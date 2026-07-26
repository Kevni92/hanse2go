import type { Alpha5Config, ConsumptionConfig } from '@hanse2go/config';
import type { GameState, InventoryBalance, Order, OrderBookLevel, OrderBookSnapshot, OrderExecution, OrderOwnerType, OrderSide } from '@hanse2go/shared';
import { account, CITY_ACCOUNT, moveAvailableMoney, moveReservedMoney, PLAYER_ACCOUNT, POPULATION_ACCOUNT, releaseMoney, reserveMoney } from './money.js';
import { DomainError } from './city-access.js';
import type { GameRepository } from './game-state.js';

interface CreateOrderInput {
  cityId: string;
  goodId: string;
  side: OrderSide;
  limitPriceGoldPerTon: number;
  quantityUnits: number;
  ownerType?: OrderOwnerType;
  ownerId?: string;
  idempotencyKey: string;
}

interface CancelOrderInput { orderId: string; orderVersion: number; idempotencyKey: string }
interface ReplaceOrderInput extends CancelOrderInput { limitPriceGoldPerTon: number; quantityUnits: number }

/**
 * Alpha-5 orderbook domain. Matching only touches a transaction draft supplied by
 * the repository, so a failed fee, reservation, or inventory operation rolls back
 * the whole command together with its ledger entries.
 */
export class OrderBookService {
  constructor(private readonly repository: GameRepository, private readonly config: Alpha5Config) {}

  create(input: CreateOrderInput): Order {
    return this.repository.runTransaction((state) => {
      const fingerprint = fingerprintOf({ ...input, ownerType: input.ownerType ?? 'player', ownerId: input.ownerId ?? state.player.id });
      const replay = this.replay(state, input.idempotencyKey, fingerprint, 'create');
      if (replay) return this.requireOrder(state, replay.orderId);
      const order = this.createInternal(state, input, input.ownerType ?? 'player', input.ownerId ?? state.player.id);
      this.remember(state, input.idempotencyKey, fingerprint, 'create', order);
      return order;
    });
  }

  cancel(input: CancelOrderInput): Order {
    return this.repository.runTransaction((state) => {
      const fingerprint = fingerprintOf(input);
      const replay = this.replay(state, input.idempotencyKey, fingerprint, 'cancel');
      if (replay) return this.requireOrder(state, replay.orderId);
      const order = this.requireOwnedOrder(state, input.orderId);
      this.checkVersion(order, input.orderVersion);
      this.releaseOrderReservations(state, order);
      order.status = 'cancelled';
      order.orderVersion += 1;
      order.updatedAtTick = state.world.tickNumber;
      this.bumpVersion(state, order.cityId, order.goodId);
      this.remember(state, input.idempotencyKey, fingerprint, 'cancel', order);
      return order;
    });
  }

  replace(input: ReplaceOrderInput): Order {
    return this.repository.runTransaction((state) => {
      const fingerprint = fingerprintOf(input);
      const replay = this.replay(state, input.idempotencyKey, fingerprint, 'replace');
      if (replay) return this.requireOrder(state, replay.orderId);
      const oldOrder = this.requireOwnedOrder(state, input.orderId);
      this.checkVersion(oldOrder, input.orderVersion);
      this.releaseOrderReservations(state, oldOrder);
      oldOrder.status = 'replaced';
      oldOrder.orderVersion += 1;
      oldOrder.updatedAtTick = state.world.tickNumber;
      const newOrder = this.createInternal(state, {
        cityId: oldOrder.cityId,
        goodId: oldOrder.goodId,
        side: oldOrder.side,
        limitPriceGoldPerTon: input.limitPriceGoldPerTon,
        quantityUnits: input.quantityUnits,
        ownerType: oldOrder.ownerType,
        ownerId: oldOrder.ownerId,
        idempotencyKey: input.idempotencyKey,
      }, oldOrder.ownerType, oldOrder.ownerId, oldOrder.orderId);
      this.remember(state, input.idempotencyKey, fingerprint, 'replace', newOrder);
      return newOrder;
    });
  }

  getBook(cityId: string, goodId: string): OrderBookSnapshot {
    const state = this.repository.getState();
    return this.snapshot(state, cityId, goodId);
  }

  getTrades(cityId: string, goodId: string): OrderExecution[] {
    return this.repository.getState().executions.filter((entry) => entry.cityId === cityId && entry.goodId === goodId);
  }

  getPlayerOrders(filters: { cityId?: string; goodId?: string; status?: string } = {}): Order[] {
    const state = this.repository.getState();
    return state.orders.filter((order) => order.ownerType === 'player' && order.ownerId === state.player.id
      && (!filters.cityId || order.cityId === filters.cityId) && (!filters.goodId || order.goodId === filters.goodId) && (!filters.status || order.status === filters.status));
  }

  getPlayerOrder(orderId: string): Order {
    const state = this.repository.getState();
    const order = this.requireOrder(state, orderId);
    if (order.ownerType !== 'player' || order.ownerId !== state.player.id) throw new DomainError('ORDER_NOT_OWNED', 'Die Order gehört nicht dem aktiven Spieler.', 403, { orderId });
    return order;
  }

  getPlayerLedger(): ReturnType<typeof this.repository.getState>['ledger'] {
    const state = this.repository.getState();
    const playerAccountId = PLAYER_ACCOUNT(state.player.id);
    return state.ledger.filter((entry) => entry.sourceAccountId === playerAccountId || entry.targetAccountId === playerAccountId);
  }

  getTreasury(cityId: string) {
    const state = this.repository.getState();
    const cityAccountId = CITY_ACCOUNT(cityId);
    const populationAccountId = POPULATION_ACCOUNT(cityId);
    const cityAccount = account(state, cityAccountId);
    const populationAccount = account(state, populationAccountId);
    const flows = state.ledger.filter((entry) => entry.sourceAccountId === cityAccountId || entry.targetAccountId === cityAccountId || entry.sourceAccountId === populationAccountId || entry.targetAccountId === populationAccountId);
    return { cityId, cityAccount, populationAccount, flows };
  }

  /** Used by the tick implementation to match standing orders without a new request. */
  matchAll(state: GameState): void {
    const keys = new Set(state.orders.filter((order) => this.isActive(order)).map((order) => orderKey(order.cityId, order.goodId)));
    for (const key of keys) {
      const [cityId, goodId] = key.split('|');
      this.match(state, cityId!, goodId!);
    }
  }

  /** Rebuilds the deterministic system side at a tick boundary. */
  refreshSystemOrders(state: GameState, consumption?: ConsumptionConfig): void {
    for (const order of state.orders.filter((entry) => this.isActive(entry) && (entry.ownerType === 'city' || entry.ownerType === 'population'))) {
      this.releaseOrderReservations(state, order);
      order.status = 'cancelled';
      order.orderVersion += 1;
      order.updatedAtTick = state.world.tickNumber;
      this.bumpVersion(state, order.cityId, order.goodId);
    }
    for (const city of state.cities) {
      for (const good of state.goods) {
        const warehouse = state.cityWarehouses[city.id]![good.id]!;
        const targetUnits = good.targetStock * 100;
        const keyBase = `system-${city.id}-${good.id}-tick-${state.world.tickNumber + 1}`;
        if (warehouse.totalUnits < targetUnits) {
          const requested = targetUnits - warehouse.totalUnits;
          const price = Math.max(1, Math.floor(good.basePrice * 0.9));
          const affordable = affordableQuantity(state, CITY_ACCOUNT(city.id), requested, price, this.config.buyerFeePermille);
          if (affordable > 0) this.createInternal(state, { cityId: city.id, goodId: good.id, side: 'buy', limitPriceGoldPerTon: price, quantityUnits: affordable, idempotencyKey: `${keyBase}-city-buy` }, 'city', city.id);
        } else if (warehouse.totalUnits > targetUnits) {
          const quantity = warehouse.totalUnits - targetUnits;
          const price = Math.max(1, Math.ceil(good.basePrice * 1.1));
          this.createInternal(state, { cityId: city.id, goodId: good.id, side: 'sell', limitPriceGoldPerTon: price, quantityUnits: quantity, idempotencyKey: `${keyBase}-city-sell` }, 'city', city.id);
        }
        const consumptionRate = consumption?.perPopulationUnit[good.id];
        if (consumptionRate) {
          const requested = Math.ceil(city.population / consumption!.populationUnit) * consumptionRate * 100;
          const price = Math.max(1, Math.floor(good.basePrice * (0.5 + (state.cityEconomies[city.id]?.wealth ?? city.prosperity) / 100)));
          const affordable = affordableQuantity(state, POPULATION_ACCOUNT(city.id), requested, price, this.config.buyerFeePermille);
          if (affordable > 0) this.createInternal(state, { cityId: city.id, goodId: good.id, side: 'buy', limitPriceGoldPerTon: price, quantityUnits: affordable, idempotencyKey: `${keyBase}-population-buy` }, 'population', city.id);
        }
      }
    }
  }

  private createInternal(state: GameState, input: CreateOrderInput, ownerType: OrderOwnerType, ownerId: string, replacesOrderId?: string): Order {
    this.validate(state, input, ownerType, ownerId);
    const orderId = `order-${++state.orderIdSequence}`;
    const order: Order = {
      orderId, cityId: input.cityId, goodId: input.goodId, side: input.side, ownerType, ownerId,
      limitPriceGoldPerTon: input.limitPriceGoldPerTon, originalQuantityUnits: input.quantityUnits,
      remainingQuantityUnits: input.quantityUnits, reservedMoney: 0, reservedGoodsUnits: 0,
      status: 'open', orderVersion: 1, createdAtTick: state.world.tickNumber, updatedAtTick: state.world.tickNumber,
      idempotencyKey: input.idempotencyKey, replacesOrderId,
    };
    if (order.side === 'buy') {
      order.reservedMoney = requiredMoney(this.config, order.limitPriceGoldPerTon, order.remainingQuantityUnits);
      reserveMoney(account(state, ownerAccount(ownerType, ownerId)), order.reservedMoney);
    } else {
      reserveGoods(this.inventory(state, input.cityId, input.goodId, ownerType, ownerId), order.remainingQuantityUnits);
      order.reservedGoodsUnits = order.remainingQuantityUnits;
    }
    state.orders.push(order);
    this.bumpVersion(state, input.cityId, input.goodId);
    this.match(state, input.cityId, input.goodId);
    return order;
  }

  private match(state: GameState, cityId: string, goodId: string): void {
    const buys = state.orders.filter((order) => order.cityId === cityId && order.goodId === goodId && order.side === 'buy' && this.isActive(order))
      .sort((a, b) => b.limitPriceGoldPerTon - a.limitPriceGoldPerTon || a.createdAtTick - b.createdAtTick || a.orderId.localeCompare(b.orderId));
    const sells = state.orders.filter((order) => order.cityId === cityId && order.goodId === goodId && order.side === 'sell' && this.isActive(order))
      .sort((a, b) => a.limitPriceGoldPerTon - b.limitPriceGoldPerTon || a.createdAtTick - b.createdAtTick || a.orderId.localeCompare(b.orderId));
    let buyIndex = 0;
    let sellIndex = 0;
    while (buyIndex < buys.length && sellIndex < sells.length) {
      const buy = buys[buyIndex]!;
      const sell = sells[sellIndex]!;
      if (buy.limitPriceGoldPerTon < sell.limitPriceGoldPerTon) break;
      if (buy.ownerType === sell.ownerType && buy.ownerId === sell.ownerId) {
        sellIndex += 1;
        continue;
      }
      const quantity = Math.min(buy.remainingQuantityUnits, sell.remainingQuantityUnits);
      this.execute(state, buy, sell, quantity);
      if (!this.isActive(buy)) buyIndex += 1;
      if (!this.isActive(sell)) sellIndex += 1;
    }
  }

  private execute(state: GameState, buy: Order, sell: Order, quantityUnits: number): void {
    const grossMoney = safeMoney(quantityUnits * sell.limitPriceGoldPerTon);
    const buyerFeeMoney = fee(grossMoney, this.config.buyerFeePermille);
    const sellerFeeMoney = fee(grossMoney, this.config.sellerFeePermille);
    const buyerAccountId = ownerAccount(buy.ownerType, buy.ownerId);
    const sellerAccountId = ownerAccount(sell.ownerType, sell.ownerId);
    const treasuryId = CITY_ACCOUNT(buy.cityId);
    const totalBuyerDebit = grossMoney + buyerFeeMoney;
    if (buy.reservedMoney < totalBuyerDebit) throw new DomainError('MONEY_RESERVATION_CONFLICT', 'Die Kauforder ist nicht vollständig gedeckt.', 409, { orderId: buy.orderId });
    moveReservedMoney(state, buyerAccountId, sellerAccountId, grossMoney, 'market_trade', 'order_execution', `execution-${state.executionIdSequence + 1}`, buy.idempotencyKey);
    if (buyerAccountId === treasuryId) releaseMoney(account(state, buyerAccountId), buyerFeeMoney);
    else moveReservedMoney(state, buyerAccountId, treasuryId, buyerFeeMoney, 'market_buyer_fee', 'order_execution', `execution-${state.executionIdSequence + 1}`, buy.idempotencyKey);
    if (sellerAccountId !== treasuryId && sellerFeeMoney > 0) moveAvailableMoney(state, sellerAccountId, treasuryId, sellerFeeMoney, 'market_seller_fee', 'order_execution', `execution-${state.executionIdSequence + 1}`, sell.idempotencyKey);
    transferGoods(state, sell, buy, quantityUnits);
    buy.remainingQuantityUnits -= quantityUnits;
    sell.remainingQuantityUnits -= quantityUnits;
    buy.reservedMoney -= totalBuyerDebit;
    sell.reservedGoodsUnits -= quantityUnits;
    this.releaseExcessBuyerReservation(state, buy);
    this.finishOrder(state, buy);
    this.finishOrder(state, sell);
    const execution: OrderExecution = {
      executionId: `execution-${++state.executionIdSequence}`, cityId: buy.cityId, goodId: buy.goodId,
      buyOrderId: buy.orderId, sellOrderId: sell.orderId, quantityUnits, limitPriceGoldPerTon: sell.limitPriceGoldPerTon,
      grossMoney, buyerFeeMoney, sellerFeeMoney, tickNumber: state.world.tickNumber,
    };
    state.executions.push(execution);
    this.bumpVersion(state, buy.cityId, buy.goodId);
  }

  private releaseExcessBuyerReservation(state: GameState, order: Order): void {
    const expected = order.remainingQuantityUnits > 0 ? requiredMoney(this.config, order.limitPriceGoldPerTon, order.remainingQuantityUnits) : 0;
    const excess = Math.max(0, order.reservedMoney - expected);
    if (excess > 0) {
      releaseMoney(account(state, ownerAccount(order.ownerType, order.ownerId)), excess);
      order.reservedMoney -= excess;
    }
  }

  private releaseOrderReservations(state: GameState, order: Order): void {
    if (order.side === 'buy' && order.reservedMoney > 0) {
      releaseMoney(account(state, ownerAccount(order.ownerType, order.ownerId)), order.reservedMoney);
      order.reservedMoney = 0;
    }
    if (order.side === 'sell' && order.reservedGoodsUnits > 0) {
      releaseGoods(this.inventory(state, order.cityId, order.goodId, order.ownerType, order.ownerId), order.reservedGoodsUnits);
      order.reservedGoodsUnits = 0;
    }
  }

  private finishOrder(_state: GameState, order: Order): void {
    if (order.remainingQuantityUnits === 0) {
      order.status = 'filled';
      order.reservedMoney = 0;
      order.reservedGoodsUnits = 0;
    } else if (order.remainingQuantityUnits < order.originalQuantityUnits) {
      order.status = 'partially_filled';
    }
    order.orderVersion += 1;
    order.updatedAtTick = _state.world.tickNumber;
  }

  private snapshot(state: GameState, cityId: string, goodId: string): OrderBookSnapshot {
    const active = state.orders.filter((order) => order.cityId === cityId && order.goodId === goodId && this.isActive(order));
    const levels = (side: OrderSide): OrderBookLevel[] => {
      const byPrice = new Map<number, OrderBookLevel>();
      for (const order of active.filter((entry) => entry.side === side)) {
        const level = byPrice.get(order.limitPriceGoldPerTon) ?? { limitPriceGoldPerTon: order.limitPriceGoldPerTon, quantityUnits: 0, orderCount: 0 };
        level.quantityUnits += order.remainingQuantityUnits;
        level.orderCount += 1;
        byPrice.set(order.limitPriceGoldPerTon, level);
      }
      return [...byPrice.values()].sort((a, b) => side === 'buy' ? b.limitPriceGoldPerTon - a.limitPriceGoldPerTon : a.limitPriceGoldPerTon - b.limitPriceGoldPerTon);
    };
    return { cityId, goodId, version: state.orderBookVersions[orderKey(cityId, goodId)] ?? 0, bids: levels('buy'), asks: levels('sell'), recentExecutions: state.executions.filter((entry) => entry.cityId === cityId && entry.goodId === goodId).slice(-50) };
  }

  private validate(state: GameState, input: CreateOrderInput, ownerType: OrderOwnerType, ownerId: string): void {
    if (!state.cities.some((city) => city.id === input.cityId)) throw new DomainError('CITY_NOT_FOUND', 'Die Stadt wurde nicht gefunden.', 404, { cityId: input.cityId });
    if (!state.goods.some((good) => good.id === input.goodId)) throw new DomainError('GOOD_NOT_FOUND', 'Die Ware wurde nicht gefunden.', 404, { goodId: input.goodId });
    if (!input.idempotencyKey) throw new DomainError('IDEMPOTENCY_KEY_REQUIRED', 'Ein Idempotenzschlüssel ist erforderlich.', 400);
    if (!Number.isSafeInteger(input.limitPriceGoldPerTon) || input.limitPriceGoldPerTon <= 0) throw new DomainError('INVALID_ORDER_PRICE', 'Der Limitpreis muss eine positive ganze Goldzahl je Tonne sein.', 400);
    if (!Number.isSafeInteger(input.quantityUnits) || input.quantityUnits <= 0) throw new DomainError('INVALID_ORDER_QUANTITY', 'Die Ordermenge muss eine positive ganze Zahl sein.', 400);
    account(state, ownerAccount(ownerType, ownerId));
    this.inventory(state, input.cityId, input.goodId, ownerType, ownerId);
  }

  private requireOwnedOrder(state: GameState, orderId: string): Order {
    const order = this.requireOrder(state, orderId);
    if (order.ownerType !== 'player' || order.ownerId !== state.player.id) throw new DomainError('ORDER_NOT_OWNED', 'Die Order gehört nicht dem aktiven Spieler.', 403, { orderId });
    return order;
  }

  private requireOrder(state: GameState, orderId: string): Order {
    const order = state.orders.find((entry) => entry.orderId === orderId);
    if (!order) throw new DomainError('ORDER_NOT_FOUND', 'Die Order wurde nicht gefunden.', 404, { orderId });
    return order;
  }

  private checkVersion(order: Order, version: number): void {
    if (order.orderVersion !== version) throw new DomainError('ORDER_BOOK_VERSION_CONFLICT', 'Die Orderversion ist veraltet.', 409, { orderId: order.orderId, expected: order.orderVersion, received: version });
    if (!this.isActive(order)) throw new DomainError('ORDER_NOT_OPEN', 'Die Order ist nicht mehr offen.', 409, { orderId: order.orderId });
  }

  private replay(state: GameState, key: string, fingerprint: string, operation: 'create' | 'cancel' | 'replace') {
    if (!key) throw new DomainError('IDEMPOTENCY_KEY_REQUIRED', 'Ein Idempotenzschlüssel ist erforderlich.', 400);
    const record = state.idempotencyRecords[key];
    if (!record) return undefined;
    if (record.operation !== operation || record.requestFingerprint !== fingerprint) throw new DomainError('ORDER_IDEMPOTENCY_CONFLICT', 'Der Idempotenzschlüssel wurde mit einer anderen Anfrage verwendet.', 409, { idempotencyKey: key });
    return record;
  }

  private remember(state: GameState, key: string, requestFingerprint: string, operation: 'create' | 'cancel' | 'replace', order: Order): void {
    state.idempotencyRecords[key] = { requestFingerprint, operation, orderId: order.orderId, responseVersion: order.orderVersion };
  }

  private bumpVersion(state: GameState, cityId: string, goodId: string): void {
    const key = orderKey(cityId, goodId);
    state.orderBookVersions[key] = (state.orderBookVersions[key] ?? 0) + 1;
  }

  private isActive(order: Order): boolean { return (order.status === 'open' || order.status === 'partially_filled') && order.remainingQuantityUnits > 0; }

  private inventory(state: GameState, cityId: string, goodId: string, ownerType: OrderOwnerType, ownerId: string): InventoryBalance {
    if (ownerType === 'player' && ownerId !== state.player.id) throw new DomainError('ORDER_NOT_OWNED', 'Das Konto gehört nicht dem aktiven Spieler.', 403);
    const warehouse = ownerType === 'player' ? state.kontorWarehouses[cityId] : state.cityWarehouses[cityId];
    const value = warehouse?.[goodId] as InventoryBalance | undefined;
    if (!value) {
      throw new DomainError('GOOD_NOT_FOUND', 'Das Warenlager wurde nicht gefunden.', 404, { cityId, goodId });
    }
    return value;
  }
}

function ownerAccount(ownerType: OrderOwnerType, ownerId: string): string {
  if (ownerType === 'player') return PLAYER_ACCOUNT(ownerId);
  if (ownerType === 'city') return CITY_ACCOUNT(ownerId);
  return POPULATION_ACCOUNT(ownerId);
}

function orderKey(cityId: string, goodId: string): string { return `${cityId}|${goodId}`; }
function safeMoney(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new DomainError('INVALID_MONEY_AMOUNT', 'Der Geldbetrag ist ungültig.', 400);
  return value;
}
function fee(grossMoney: number, permille: number): number { return Math.ceil(grossMoney * permille / 1000); }
function requiredMoney(config: Alpha5Config, price: number, quantity: number): number { return safeMoney(price * quantity + fee(price * quantity, config.buyerFeePermille)); }
function fingerprintOf(value: unknown): string { return JSON.stringify(value); }
function affordableQuantity(state: GameState, accountId: string, requested: number, price: number, buyerFeePermille: number): number {
  const available = account(state, accountId).availableMoney;
  const maximum = Math.min(requested, Math.floor(available / Math.max(1, price)));
  let quantity = maximum;
  while (quantity > 0 && price * quantity + fee(price * quantity, buyerFeePermille) > available) quantity -= 1;
  return quantity;
}

function reserveGoods(value: InventoryBalance, amount: number): void {
  if (value.availableUnits < amount) throw new DomainError('INSUFFICIENT_AVAILABLE_GOODS', 'Es sind nicht genug verfügbare Waren vorhanden.', 409, { available: value.availableUnits, required: amount });
  value.availableUnits -= amount;
  value.reservedUnits += amount;
  value.inventoryVersion += 1;
  assertInventory(value);
}
function releaseGoods(value: InventoryBalance, amount: number): void {
  if (value.reservedUnits < amount) throw new DomainError('ORDER_MATCHING_FAILED', 'Die Warenreservierung ist inkonsistent.', 500);
  value.reservedUnits -= amount;
  value.availableUnits += amount;
  value.inventoryVersion += 1;
  assertInventory(value);
}
function transferGoods(state: GameState, sell: Order, buy: Order, amount: number): void {
  const sellerWarehouse = sell.ownerType === 'player' ? state.kontorWarehouses[sell.cityId] : state.cityWarehouses[sell.cityId];
  const buyerWarehouse = buy.ownerType === 'player' ? state.kontorWarehouses[buy.cityId] : state.cityWarehouses[buy.cityId];
  const seller = sellerWarehouse?.[sell.goodId];
  const buyer = buyerWarehouse?.[buy.goodId];
  if (!seller || !buyer || seller.reservedUnits < amount) throw new DomainError('ORDER_MATCHING_FAILED', 'Die Warenreservierung ist inkonsistent.', 500);
  seller.reservedUnits -= amount;
  seller.totalUnits -= amount;
  seller.inventoryVersion += 1;
  buyer.availableUnits += amount;
  buyer.totalUnits += amount;
  buyer.inventoryVersion += 1;
  assertInventory(seller);
  assertInventory(buyer);
}
function assertInventory(value: InventoryBalance): void {
  if (value.availableUnits < 0 || value.reservedUnits < 0 || value.availableUnits + value.reservedUnits !== value.totalUnits) throw new DomainError('ORDER_MATCHING_FAILED', 'Die Warenbilanz ist inkonsistent.', 500);
}
