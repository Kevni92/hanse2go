import type { BuildingsConfig, ConcessionConfig, Alpha3Config } from '@hanse2go/config';
import type { BuildingCatalogEntry, BuildingCost } from '@hanse2go/shared';

/** Katalog aller baubaren Gebäude; sämtliche Werte stammen aus der Spielkonfiguration. */
export interface BuildingCatalog {
  kontorType: string;
  landPrice: number;
  concession: ConcessionConfig;
  kontor: BuildingCatalogEntry;
  production: BuildingCatalogEntry[];
  housing: BuildingCatalogEntry;
  find(buildingType: string): BuildingCatalogEntry | undefined;
}

export function createBuildingCatalog(config: BuildingsConfig, alpha3?: Alpha3Config): BuildingCatalog {
  const cost = (gold: number, materials: Record<string, number>): BuildingCost => ({
    landGold: config.landPrice, buildGold: gold, totalGold: config.landPrice + gold, materials: { ...materials },
  });

  const kontor: BuildingCatalogEntry = {
    buildingType: config.kontorType, kind: 'kontor',
    cost: cost(config.kontor.gold, config.kontor.materials), inputs: {}, outputs: {},
  };
  const production: BuildingCatalogEntry[] = config.production.map((entry) => ({
    buildingType: entry.buildingType, kind: entry.kind, buildingClass: entry.buildingClass,
    workforceClass: alpha3?.buildingWorkforce[entry.buildingType],
    cost: cost(config.classes[entry.buildingClass].gold, config.classes[entry.buildingClass].materials),
    inputs: { ...entry.inputs }, outputs: { ...entry.outputs },
  }));
  const housing: BuildingCatalogEntry = { buildingType: alpha3?.housing.buildingType ?? 'town_house', kind: 'raw', cost: cost(alpha3?.housing.buildGold ?? 0, alpha3?.housing.materials ?? {}), inputs: {}, outputs: {} };
  const byType = new Map([kontor, housing, ...production].map((entry) => [entry.buildingType, entry]));

  return {
    kontorType: config.kontorType,
    landPrice: config.landPrice,
    concession: { ...config.concession },
    kontor,
    production,
    housing,
    find: (buildingType) => byType.get(buildingType),
  };
}
