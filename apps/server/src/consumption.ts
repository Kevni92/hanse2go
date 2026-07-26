import type { ConsumptionConfig } from '@hanse2go/config';

/** Fester Bevölkerungsverbrauch aus `docs/alpha-2/population-consumption.md`; die Werte kommen aus der Spielkonfiguration. */
export class ConsumptionModel {
  constructor(private readonly consumptionConfig: ConsumptionConfig) {}

  /** Alle Waren, die die Bevölkerung überhaupt verbraucht. */
  get consumedGoodIds(): string[] { return Object.keys(this.consumptionConfig.perPopulationUnit); }
  get config(): ConsumptionConfig { return this.consumptionConfig; }

  /** `Sollverbrauch = ceil(Bevölkerung / Bezugsgröße) × Verbrauchswert`. */
  required(population: number, goodId: string): number {
    return Math.ceil(population / this.consumptionConfig.populationUnit) * (this.consumptionConfig.perPopulationUnit[goodId] ?? 0);
  }
}
