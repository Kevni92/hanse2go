import type { GameState, Reputation, ReputationStatus, TradeDirection } from '@hanse2go/shared';

/** Regeln aus `docs/alpha-2/reputation-and-concessions.md`. */
export const MINIMUM_REPUTATION_QUANTITY = 10;
export const TONS_PER_REPUTATION_POINT = 10;
export const MAXIMUM_REPUTATION = 100;

export function reputationStatus(value: number): ReputationStatus {
  if (value < 20) return 'Fremder';
  if (value < 50) return 'Bekannter Händler';
  if (value < 80) return 'Angesehener Händler';
  return 'Vertrauenswürdiger Bürger';
}

interface TradeFacts { cityId: string; goodId: string; targetStock: number; stockBefore: number; quantity: number; direction: TradeDirection }

export class ReputationService {
  /** Verbesserungskontingent je Stadt und Ware für die laufende simulierte Stunde. */
  private readonly quotas = new Map<string, number>();
  /** Restmenge unter zehn Tonnen je Spieler, Stadt und Ware innerhalb der laufenden Stunde. */
  private readonly carried = new Map<string, number>();

  /** Bucht den Rufgewinn eines bereits verbuchten Handels innerhalb derselben Transaktion. */
  registerTrade(state: GameState, facts: TradeFacts): void {
    if (facts.quantity < MINIMUM_REPUTATION_QUANTITY) return;
    // Ein Verkauf hilft nur unterhalb, ein Kauf nur oberhalb des Zielbestands.
    const distance = facts.direction === 'sell' ? facts.targetStock - facts.stockBefore : facts.stockBefore - facts.targetStock;
    if (distance <= 0) return;
    // Ein Handel über den Zielbestand hinaus zählt höchstens bis zum Zielbestand.
    const improvement = Math.min(facts.quantity, distance);
    const key = `${state.player.id}:${facts.cityId}:${facts.goodId}`;
    const quota = this.quotas.get(key) ?? distance;
    const credited = Math.min(improvement, quota);
    this.quotas.set(key, quota - credited);
    if (credited <= 0) return;

    const total = (this.carried.get(key) ?? 0) + credited;
    this.carried.set(key, total % TONS_PER_REPUTATION_POINT);
    const points = Math.floor(total / TONS_PER_REPUTATION_POINT);
    if (points <= 0) return;
    const entry = this.entry(state, facts.cityId);
    entry.value = Math.min(MAXIMUM_REPUTATION, entry.value + points);
    entry.status = reputationStatus(entry.value);
  }

  get(state: GameState, cityId: string): Reputation { return { ...this.entry(state, cityId) }; }

  /** Der Stundentick löscht Kontingente und Restmengen; sie verfallen mit der Stunde. */
  startNewHour(): void { this.quotas.clear(); this.carried.clear(); }
  reset(): void { this.startNewHour(); }

  private entry(state: GameState, cityId: string): Reputation {
    let entry = state.reputations.find((candidate) => candidate.cityId === cityId);
    if (!entry) { entry = { cityId, value: 0, status: reputationStatus(0) }; state.reputations.push(entry); }
    return entry;
  }
}
