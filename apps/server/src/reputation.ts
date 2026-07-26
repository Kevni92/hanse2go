import type { ReputationConfig } from '@hanse2go/config';
import type { GameState, Reputation, ReputationStatus, TradeDirection } from '@hanse2go/shared';

/** Ordnet einen Rufwert dem höchsten erreichten Status der Konfiguration zu. */
export function reputationStatus(config: ReputationConfig, value: number): ReputationStatus {
  let status = config.statusThresholds[0]!.status;
  for (const threshold of config.statusThresholds) if (value >= threshold.minimumValue) status = threshold.status;
  return status;
}

interface TradeFacts { cityId: string; goodId: string; targetStock: number; stockBefore: number; quantity: number; direction: TradeDirection }

/** Regeln aus `docs/alpha-2/reputation-and-concessions.md`; alle Werte stammen aus der Spielkonfiguration. */
export class ReputationService {
  /** Verbesserungskontingent je Stadt und Ware für die laufende simulierte Stunde. */
  private readonly quotas = new Map<string, number>();
  /** Restmenge unterhalb eines vollen Rufpunkts je Spieler, Stadt und Ware innerhalb der laufenden Stunde. */
  private readonly carried = new Map<string, number>();

  constructor(private readonly config: ReputationConfig) {}

  get maximumValue(): number { return this.config.maximumValue; }

  statusFor(value: number): ReputationStatus { return reputationStatus(this.config, value); }

  /** Bucht den Rufgewinn eines bereits verbuchten Handels innerhalb derselben Transaktion. */
  registerTrade(state: GameState, facts: TradeFacts): void {
    if (facts.quantity < this.config.minimumTradeQuantity) return;
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
    this.carried.set(key, total % this.config.tonsPerPoint);
    const points = Math.floor(total / this.config.tonsPerPoint);
    if (points <= 0) return;
    const entry = this.entry(state, facts.cityId);
    entry.value = Math.min(this.config.maximumValue, entry.value + points);
    entry.status = this.statusFor(entry.value);
  }

  get(state: GameState, cityId: string): Reputation { return { ...this.entry(state, cityId) }; }

  /** Der Stundentick löscht Kontingente und Restmengen; sie verfallen mit der Stunde. */
  startNewHour(): void { this.quotas.clear(); this.carried.clear(); }
  reset(): void { this.startNewHour(); }

  private entry(state: GameState, cityId: string): Reputation {
    let entry = state.reputations.find((candidate) => candidate.cityId === cityId);
    if (!entry) { entry = { cityId, value: 0, status: this.statusFor(0) }; state.reputations.push(entry); }
    return entry;
  }
}
