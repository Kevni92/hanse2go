/** Feste Verbrauchswerte je angefangene 1.000 Einwohner aus `docs/alpha-2/population-consumption.md`. */
export const consumptionPerThousand: Record<string, number> = { bread: 4, clothing: 2, meat: 2, cheese: 2, ceramics: 2, furniture: 2, rum: 2 };

export function requiredConsumption(population: number, goodId: string): number {
  return Math.ceil(population / 1_000) * (consumptionPerThousand[goodId] ?? 0);
}
