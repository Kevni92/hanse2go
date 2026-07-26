import type { ConsumptionConfig } from '@hanse2go/config';

/** Fester Bevölkerungsverbrauch aus `docs/alpha-2/population-consumption.md`; die Werte kommen aus der Spielkonfiguration. */
export class ConsumptionModel {
  constructor(private readonly config: ConsumptionConfig) {}

  /** Alle Waren, die die Bevölkerung überhaupt verbraucht. */
  get consumedGoodIds(): string[] { return Object.keys(this.config.perPopulationUnit); }

  /** `Sollverbrauch = ceil(Bevölkerung / Bezugsgröße) × Verbrauchswert`. */
  required(population: number, goodId: string): number {
    return Math.ceil(population / this.config.populationUnit) * (this.config.perPopulationUnit[goodId] ?? 0);
  }
}
