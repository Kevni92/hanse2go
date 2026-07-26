import type { Alpha5Config } from '@hanse2go/config';
import type { GameState, LedgerEntry, LedgerReason, MoneyAccount, MoneyOwnerType } from '@hanse2go/shared';
import { DomainError } from './city-access.js';

export const PLAYER_ACCOUNT = (playerId: string) => `player:${playerId}`;
export const CITY_ACCOUNT = (cityId: string) => `city:${cityId}`;
export const POPULATION_ACCOUNT = (cityId: string) => `population:${cityId}`;

export function createMoneyAccounts(config: Alpha5Config): Record<string, MoneyAccount> {
  const accounts: Record<string, MoneyAccount> = {};
  for (const [ownerId, amount] of Object.entries(config.startAccounts.players)) accounts[PLAYER_ACCOUNT(ownerId)] = createAccount(PLAYER_ACCOUNT(ownerId), 'player', ownerId, amount);
  for (const [ownerId, amount] of Object.entries(config.startAccounts.cities)) accounts[CITY_ACCOUNT(ownerId)] = createAccount(CITY_ACCOUNT(ownerId), 'city', ownerId, amount);
  for (const [ownerId, amount] of Object.entries(config.startAccounts.populations)) accounts[POPULATION_ACCOUNT(ownerId)] = createAccount(POPULATION_ACCOUNT(ownerId), 'population', ownerId, amount);
  return accounts;
}

export function account(state: GameState, accountId: string): MoneyAccount {
  const value = state.accounts[accountId];
  if (!value) throw new DomainError('ACCOUNT_NOT_FOUND', 'Das Geldkonto wurde nicht gefunden.', 500, { accountId });
  return value;
}

export function reserveMoney(value: MoneyAccount, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new DomainError('INVALID_MONEY_AMOUNT', 'Der Geldbetrag ist ungültig.', 400);
  if (value.availableMoney < amount) throw new DomainError('INSUFFICIENT_AVAILABLE_GOLD', 'Es ist nicht genug verfügbares Gold vorhanden.', 409, { available: value.availableMoney, required: amount });
  value.availableMoney -= amount;
  value.reservedMoney += amount;
  value.accountVersion += 1;
  assertAccount(value);
}

export function releaseMoney(value: MoneyAccount, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0 || value.reservedMoney < amount) throw new DomainError('MONEY_RESERVATION_CONFLICT', 'Die Geldreservierung stimmt nicht mit dem Konto überein.', 409);
  value.reservedMoney -= amount;
  value.availableMoney += amount;
  value.accountVersion += 1;
  assertAccount(value);
}

export function moveReservedMoney(state: GameState, sourceId: string, targetId: string, amount: number, reason: LedgerReason, referenceType: string, referenceId: string, idempotencyKey: string): LedgerEntry {
  const source = account(state, sourceId);
  const target = account(state, targetId);
  if (!Number.isSafeInteger(amount) || amount <= 0 || source.reservedMoney < amount) throw new DomainError('MONEY_RESERVATION_CONFLICT', 'Die reservierte Geldmenge reicht für die Buchung nicht aus.', 409);
  source.reservedMoney -= amount;
  source.totalMoney -= amount;
  source.accountVersion += 1;
  target.availableMoney += amount;
  target.totalMoney += amount;
  target.accountVersion += 1;
  assertAccount(source);
  assertAccount(target);
  return appendLedger(state, sourceId, targetId, amount, reason, referenceType, referenceId, idempotencyKey);
}

export function moveAvailableMoney(state: GameState, sourceId: string, targetId: string, amount: number, reason: LedgerReason, referenceType: string, referenceId: string, idempotencyKey: string): LedgerEntry {
  const source = account(state, sourceId);
  const target = account(state, targetId);
  if (!Number.isSafeInteger(amount) || amount <= 0 || source.availableMoney < amount) throw new DomainError('INSUFFICIENT_AVAILABLE_GOLD', 'Es ist nicht genug verfügbares Gold vorhanden.', 409);
  source.availableMoney -= amount;
  source.totalMoney -= amount;
  source.accountVersion += 1;
  target.availableMoney += amount;
  target.totalMoney += amount;
  target.accountVersion += 1;
  assertAccount(source);
  assertAccount(target);
  return appendLedger(state, sourceId, targetId, amount, reason, referenceType, referenceId, idempotencyKey);
}

export function appendLedger(state: GameState, sourceAccountId: string, targetAccountId: string, amountMoney: number, reason: LedgerReason, referenceType: string, referenceId: string, idempotencyKey: string): LedgerEntry {
  const entry: LedgerEntry = {
    ledgerEntryId: `ledger-${state.ledger.length + 1}`,
    tickNumber: state.world.tickNumber,
    reason,
    sourceAccountId,
    targetAccountId,
    amountMoney,
    referenceType,
    referenceId,
    idempotencyKey,
  };
  state.ledger.push(entry);
  return entry;
}

/** Spiegelt die autoritative Alpha-5-Buchung in den historischen Ganzgold-Spielerwert. */
export function syncLegacyPlayerGold(state: GameState): void {
  state.player.gold = Math.floor(account(state, PLAYER_ACCOUNT(state.player.id)).availableMoney / 100);
}

/** Bucht eine bestehende Ganzgold-Zahlung des Spielers in die lokale Stadtkasse. */
export function payCityFromPlayer(state: GameState, cityId: string, gold: number, reason: LedgerReason, referenceType: string, referenceId: string, idempotencyKey: string): void {
  if (!Number.isSafeInteger(gold) || gold <= 0) throw new DomainError('INVALID_MONEY_AMOUNT', 'Der Goldbetrag ist ungültig.', 400);
  moveAvailableMoney(state, PLAYER_ACCOUNT(state.player.id), CITY_ACCOUNT(cityId), gold * 100, reason, referenceType, referenceId, idempotencyKey);
  syncLegacyPlayerGold(state);
}

/** Bucht eine bestehende Ganzgold-Zahlung der Stadtkasse an den Spieler. */
export function payPlayerFromCity(state: GameState, cityId: string, gold: number, reason: LedgerReason, referenceType: string, referenceId: string, idempotencyKey: string): void {
  if (!Number.isSafeInteger(gold) || gold <= 0) throw new DomainError('INVALID_MONEY_AMOUNT', 'Der Goldbetrag ist ungültig.', 400);
  moveAvailableMoney(state, CITY_ACCOUNT(cityId), PLAYER_ACCOUNT(state.player.id), gold * 100, reason, referenceType, referenceId, idempotencyKey);
  syncLegacyPlayerGold(state);
}

export function assertAccount(value: MoneyAccount): void {
  if (!Number.isSafeInteger(value.availableMoney) || !Number.isSafeInteger(value.reservedMoney) || !Number.isSafeInteger(value.totalMoney)
    || value.availableMoney < 0 || value.reservedMoney < 0 || value.totalMoney < 0
    || value.availableMoney + value.reservedMoney !== value.totalMoney) {
    throw new DomainError('MONEY_ACCOUNT_INVARIANT_FAILED', 'Die Geldkontoinvariante ist verletzt.', 500, { accountId: value.accountId });
  }
}

export function assertMoneySupply(state: GameState): void {
  assertOrderReservations(state);
  const total = Object.values(state.accounts).reduce((sum, value) => {
    assertAccount(value);
    return sum + value.totalMoney;
  }, 0);
  if (total !== state.moneySupply) throw new DomainError('MONEY_SUPPLY_INVARIANT_VIOLATION', 'Die Gesamtgeldmenge ist nicht unverändert.', 500, { expected: state.moneySupply, actual: total });
}

function assertOrderReservations(state: GameState): void {
  const moneyReservations: Record<string, number> = {};
  const goodsReservations: Record<string, number> = {};
  for (const order of state.orders) {
    if (order.status !== 'open' && order.status !== 'partially_filled') {
      if (order.reservedMoney !== 0 || order.reservedGoodsUnits !== 0) throw new DomainError('ORDER_MATCHING_FAILED', 'Eine geschlossene Order hält noch eine Reservierung.', 500, { orderId: order.orderId });
      continue;
    }
    if (order.side === 'buy') {
      const accountId = ownerAccountId(order.ownerType, order.ownerId);
      moneyReservations[accountId] = (moneyReservations[accountId] ?? 0) + order.reservedMoney;
    } else {
      const inventoryKey = `${order.ownerType}:${order.cityId}:${order.goodId}`;
      goodsReservations[inventoryKey] = (goodsReservations[inventoryKey] ?? 0) + order.reservedGoodsUnits;
    }
  }
  for (const value of Object.values(state.accounts)) {
    if (value.reservedMoney !== (moneyReservations[value.accountId] ?? 0)) throw new DomainError('MONEY_ACCOUNT_INVARIANT_FAILED', 'Kontoreservierung und Orderreservierung stimmen nicht überein.', 500, { accountId: value.accountId });
  }
  for (const city of state.cities) for (const good of state.goods) {
    const cityInventory = state.cityWarehouses[city.id]![good.id]!;
    const playerInventory = state.kontorWarehouses[city.id]![good.id]!;
    if (cityInventory.reservedUnits !== (goodsReservations[`city:${city.id}:${good.id}`] ?? 0) + (goodsReservations[`population:${city.id}:${good.id}`] ?? 0)) throw new DomainError('ORDER_MATCHING_FAILED', 'Stadtlager und Orderreservierung stimmen nicht überein.', 500, { cityId: city.id, goodId: good.id });
    if (playerInventory.reservedUnits !== (goodsReservations[`player:${city.id}:${good.id}`] ?? 0)) throw new DomainError('ORDER_MATCHING_FAILED', 'Kontorlager und Orderreservierung stimmen nicht überein.', 500, { cityId: city.id, goodId: good.id });
  }
}

function ownerAccountId(ownerType: 'player' | 'city' | 'population', ownerId: string): string {
  if (ownerType === 'player') return PLAYER_ACCOUNT(ownerId);
  if (ownerType === 'city') return CITY_ACCOUNT(ownerId);
  return POPULATION_ACCOUNT(ownerId);
}

function createAccount(accountId: string, ownerType: MoneyOwnerType, ownerId: string, totalMoney: number): MoneyAccount {
  return { accountId, ownerType, ownerId, availableMoney: totalMoney, reservedMoney: 0, totalMoney, accountVersion: 1 };
}
