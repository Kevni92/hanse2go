import type { BuildingCatalogEntry, BuildingClass, BuildingCost, BuildingKind } from '@hanse2go/shared';

/** Werte aus `docs/alpha-2/buildings-and-construction.md`. Der Grundstückspreis gilt für jedes Gebäude. */
export const LAND_PRICE = 5_000;
export const CONCESSION_PRICE = 10_000;
export const CONCESSION_REPUTATION = 80;
export const KONTOR_TYPE = 'kontor';

const classCosts: Record<BuildingClass, { gold: number; materials: Record<string, number> }> = {
  einfach: { gold: 2_500, materials: { wood: 20, planks: 10, bricks: 10, tools: 5 } },
  mittel: { gold: 5_000, materials: { wood: 30, planks: 20, bricks: 20, tools: 10 } },
  hochwertig: { gold: 7_500, materials: { wood: 40, planks: 30, bricks: 30, tools: 20 } },
};
const kontorCost = { gold: 5_000, materials: { wood: 50, planks: 25, bricks: 40, tools: 10 } };

function cost(gold: number, materials: Record<string, number>): BuildingCost {
  return { landGold: LAND_PRICE, buildGold: gold, totalGold: LAND_PRICE + gold, materials: { ...materials } };
}

/** Katalog und Rezepte aus `docs/alpha-2/building-catalog.md` und `docs/alpha-2/production-recipes.md`. */
const productionRows: Array<[string, string, BuildingKind, BuildingClass, Record<string, number>, Record<string, number>]> = [
  ['grain_farm', 'Getreidehof', 'raw', 'einfach', {}, { grain: 20 }],
  ['windmill', 'Windmühle', 'processing', 'einfach', { grain: 10 }, { flour: 10 }],
  ['bakery', 'Bäckerei', 'processing', 'mittel', { flour: 10 }, { bread: 10 }],
  ['cattle_farm', 'Rinderhof', 'processing', 'mittel', { grain: 10 }, { livestock: 5, milk: 10 }],
  ['butchery', 'Metzgerei', 'processing', 'mittel', { livestock: 5 }, { meat: 5 }],
  ['dairy', 'Käserei', 'processing', 'hochwertig', { milk: 10 }, { cheese: 5 }],
  ['forestry', 'Forstbetrieb', 'raw', 'einfach', {}, { wood: 20 }],
  ['sawmill', 'Sägewerk', 'processing', 'einfach', { wood: 10 }, { planks: 10 }],
  ['clay_pit', 'Lehmgrube', 'raw', 'einfach', {}, { clay: 20 }],
  ['brickyard', 'Ziegelei', 'processing', 'mittel', { clay: 10 }, { bricks: 10 }],
  ['pottery', 'Töpferei', 'processing', 'mittel', { clay: 10 }, { ceramics: 10 }],
  ['charcoal_kiln', 'Köhlerei', 'processing', 'mittel', { wood: 10 }, { charcoal: 10 }],
  ['iron_mine', 'Eisenmine', 'raw', 'hochwertig', {}, { iron: 15 }],
  ['smithy', 'Schmiede', 'processing', 'hochwertig', { iron: 10, charcoal: 10 }, { tools: 10 }],
  ['cotton_plantation', 'Baumwollplantage', 'raw', 'einfach', {}, { cotton: 20 }],
  ['weavery', 'Weberei', 'processing', 'mittel', { cotton: 10 }, { cloth: 10 }],
  ['tailor', 'Schneiderei', 'processing', 'mittel', { cloth: 10 }, { clothing: 10 }],
  ['carpentry', 'Tischlerei', 'processing', 'hochwertig', { planks: 10 }, { furniture: 10 }],
  ['sugarcane_plantation', 'Zuckerrohrplantage', 'raw', 'mittel', {}, { sugarcane: 20 }],
  ['sugar_refinery', 'Zuckerraffinerie', 'processing', 'mittel', { sugarcane: 10 }, { sugar: 10 }],
  ['distillery', 'Brennerei', 'processing', 'hochwertig', { sugar: 10 }, { rum: 10 }],
];

export const kontorEntry: BuildingCatalogEntry = { buildingType: KONTOR_TYPE, name: 'Kontor', kind: 'kontor', cost: cost(kontorCost.gold, kontorCost.materials), inputs: {}, outputs: {} };

export const productionCatalog: BuildingCatalogEntry[] = productionRows.map(([buildingType, name, kind, buildingClass, inputs, outputs]) => ({
  buildingType, name, kind, buildingClass, cost: cost(classCosts[buildingClass].gold, classCosts[buildingClass].materials), inputs: { ...inputs }, outputs: { ...outputs },
}));

const byType = new Map<string, BuildingCatalogEntry>([kontorEntry, ...productionCatalog].map((entry) => [entry.buildingType, entry]));

export function findBuildingType(buildingType: string): BuildingCatalogEntry | undefined { return byType.get(buildingType); }
