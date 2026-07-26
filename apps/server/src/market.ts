import type { MarketConfig } from '@hanse2go/config';
import type { GameState, MarketHistoryEntry, MarketQuote, TradeDirection } from '@hanse2go/shared';
import { CityAccessService, DomainError } from './city-access.js';
import type { GameRepository } from './game-state.js';
import type { ReputationService } from './reputation.js';

type QuoteInput = { cityId: string; goodId: string; direction: TradeDirection; quantity: number };
type CommitInput = QuoteInput & { marketVersion: number; idempotencyKey: string };

export class MarketService {
  private readonly versions = new Map<string, number>();
  private readonly history = new Map<string, MarketHistoryEntry[]>();
  private readonly completed = new Map<string, MarketQuote>();

  constructor(
    private readonly repository: GameRepository,
    private readonly cityAccess: CityAccessService,
    private readonly config: MarketConfig,
    private readonly reputation?: ReputationService,
  ) {}

  quote(input: QuoteInput): MarketQuote {
    this.cityAccess.requireReachable(input.cityId);
    return this.repository.runTransaction((state) => this.calculate(state, input));
  }

  commit(input: CommitInput): MarketQuote {
    const prior = this.completed.get(input.idempotencyKey);
    if (prior) return prior;
    this.cityAccess.requireReachable(input.cityId);
    return this.repository.runTransaction((state) => {
      const currentVersion = this.version(input.cityId);
      if (input.marketVersion !== currentVersion) throw new DomainError('STALE_OFFER', 'Das Preisangebot ist veraltet. Bitte lade ein neues Angebot.', 409);
      const quote = this.calculate(state, input);
      const city = state.cities.find((candidate) => candidate.id === input.cityId)!;
      const good = state.goods.find((candidate) => candidate.id === input.goodId)!;
      const stockBefore = city.stock[good.id]!;
      const before = this.unitPrice(good.basePrice, good.targetStock, stockBefore, input.direction);
      if (input.direction === 'buy') {
        city.stock[good.id]! -= input.quantity;
        state.fleet.cargo[good.id] = (state.fleet.cargo[good.id] ?? 0) + input.quantity;
        state.player.gold -= quote.total;
      } else {
        city.stock[good.id]! += input.quantity;
        state.fleet.cargo[good.id]! -= input.quantity;
        if (state.fleet.cargo[good.id] === 0) delete state.fleet.cargo[good.id];
        state.player.gold += quote.total;
      }
      this.versions.set(input.cityId, currentVersion + 1);
      this.reputation?.registerTrade(state, { cityId: city.id, goodId: good.id, targetStock: good.targetStock, stockBefore, quantity: input.quantity, direction: input.direction });
      const after = this.unitPrice(good.basePrice, good.targetStock, city.stock[good.id]!, input.direction);
      const entry: MarketHistoryEntry = { timestamp: new Date().toISOString(), goodId: good.id, direction: input.direction, quantity: input.quantity, total: quote.total, priceBefore: before, priceAfter: after };
      this.history.set(input.cityId, [...(this.history.get(input.cityId) ?? []), entry]);
      const result = { ...quote, marketVersion: currentVersion + 1 };
      this.completed.set(input.idempotencyKey, result);
      return result;
    });
  }

  getHistory(cityId: string, goodId: string): MarketHistoryEntry[] {
    this.cityAccess.requireReachable(cityId);
    return (this.history.get(cityId) ?? []).filter((entry) => entry.goodId === goodId);
  }

  reset(): void {
    this.versions.clear();
    this.history.clear();
    this.completed.clear();
  }

  /** Ein Stundentick verändert Stadtbestände; offene Preisangebote dieser Stadt werden dadurch veraltet. */
  invalidateCity(cityId: string): void { this.versions.set(cityId, this.version(cityId) + 1); }

  private calculate(state: GameState, input: QuoteInput): MarketQuote {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) throw new DomainError('INVALID_QUANTITY', 'Die Handelsmenge muss eine positive ganze Zahl sein.', 400);
    const city = state.cities.find((candidate) => candidate.id === input.cityId);
    const good = state.goods.find((candidate) => candidate.id === input.goodId);
    if (!city) throw new DomainError('CITY_NOT_FOUND', 'Die angeforderte Stadt existiert nicht.', 404);
    if (!good) throw new DomainError('GOOD_NOT_FOUND', 'Die angeforderte Ware existiert nicht.', 404);
    const cityStock = city.stock[good.id]!;
    const fleetStock = state.fleet.cargo[good.id] ?? 0;
    const usedCapacity = Object.values(state.fleet.cargo).reduce((sum, amount) => sum + amount, 0);
    if (input.direction === 'buy') {
      if (cityStock < input.quantity) throw new DomainError('INSUFFICIENT_CITY_STOCK', 'Die Stadt besitzt nicht genug von dieser Ware.', 409);
      if (state.fleet.capacity - usedCapacity < input.quantity) throw new DomainError('INSUFFICIENT_CAPACITY', 'Der Laderaum reicht nicht aus.', 409);
    } else if (fleetStock < input.quantity) throw new DomainError('INSUFFICIENT_FLEET_STOCK', 'Die Flotte besitzt nicht genug von dieser Ware.', 409);
    let stock = cityStock; const prices: number[] = [];
    for (let unit = 0; unit < input.quantity; unit += 1) { prices.push(this.unitPrice(good.basePrice, good.targetStock, stock, input.direction)); stock += input.direction === 'buy' ? -1 : 1; }
    const total = prices.reduce((sum, price) => sum + price, 0);
    if (input.direction === 'buy' && state.player.gold < total) throw new DomainError('INSUFFICIENT_GOLD', 'Es ist nicht genug Gold vorhanden.', 409);
    const resultingCityStock = input.direction === 'buy' ? cityStock - input.quantity : cityStock + input.quantity;
    const resultingFleetStock = input.direction === 'buy' ? fleetStock + input.quantity : fleetStock - input.quantity;
    return { cityId: city.id, goodId: good.id, direction: input.direction, quantity: input.quantity, marketVersion: this.version(city.id), total, averageUnitPrice: Math.round(total / input.quantity), minimumUnitPrice: Math.min(...prices), maximumUnitPrice: Math.max(...prices), resultingCityStock, resultingFleetStock, resultingGold: input.direction === 'buy' ? state.player.gold - total : state.player.gold + total, remainingCapacity: state.fleet.capacity - usedCapacity + (input.direction === 'sell' ? input.quantity : -input.quantity) };
  }

  private version(cityId: string): number { return this.versions.get(cityId) ?? 0; }
  /** Preisformel und Spread aus `docs/market-and-pricing.md`; die Grenzwerte stammen aus der Spielkonfiguration. */
  private unitPrice(base: number, target: number, stock: number, direction: TradeDirection): number {
    const { minimumPriceFactor, maximumPriceFactor, buySpread, sellSpread } = this.config;
    const value = base * Math.min(maximumPriceFactor, Math.max(minimumPriceFactor, target / Math.max(stock, 1)));
    return direction === 'buy' ? Math.ceil(value * buySpread) : Math.floor(value * sellSpread);
  }
}
