import type { BuildingClass, BuildingKind, GoodCategory, ReputationStatus, WorkforceClass } from '@hanse2go/shared';

/** Typen der zentralen Spielkonfiguration in `game-config.json`. */

export interface GeoPoint { longitude: number; latitude: number }

export interface WorldConfig {
  /** Zeitstempel aller Startpositionen; hält den Startzustand deterministisch. */
  startTimestamp: string;
}
/** `startingConcessions` enthält Stadt-IDs, für die der Spieler die Baukonzession bereits besitzt. */
export interface PlayerConfig { id: string; name: string; startingGold: number; startingConcessions: string[] }
export interface FleetConfig { id: string; capacity: number; startPosition: GeoPoint }

export interface GoodConfig { id: string; category: GoodCategory; basePrice: number; targetStock: number }
export interface CityConfig {
  id: string; position: GeoPoint; radiusMeters: number;
  population: number; prosperity: number; popularity: number;
  /** Waren-IDs; der Anzeigename kommt aus der Sprachdatei. */
  productionFocus: string[];
  stock: Record<string, number>;
}

/** Preisformel und Spread aus `docs/market-and-pricing.md`. */
export interface MarketConfig { minimumPriceFactor: number; maximumPriceFactor: number; buySpread: number; sellSpread: number }

export interface ReputationStatusThreshold { minimumValue: number; status: ReputationStatus }
export interface ReputationConfig {
  minimumTradeQuantity: number;
  tonsPerPoint: number;
  maximumValue: number;
  /** Aufsteigend nach `minimumValue`; der erste Eintrag ist der Startstatus. */
  statusThresholds: ReputationStatusThreshold[];
}

export interface ConsumptionConfig { populationUnit: number; perPopulationUnit: Record<string, number> }

export interface BuildingClassCost { gold: number; materials: Record<string, number> }
export interface ConcessionConfig { price: number; requiredReputation: number }
export interface ProductionBuildingConfig {
  buildingType: string; kind: BuildingKind; buildingClass: BuildingClass;
  inputs: Record<string, number>; outputs: Record<string, number>;
}
export interface WorkforceClassConfig { workers: number; wagePerWorker: number }
export interface Alpha3Config {
  workforce: Record<WorkforceClass, WorkforceClassConfig>;
  buildingWorkforce: Record<string, WorkforceClass>;
  housing: { buildingType: string; capacity: number; buildGold: number; materials: Record<string, number> };
  cities: Record<string, { baseHousing: number; wealth: number }>;
}
export interface BuildingsConfig {
  kontorType: string;
  /** Der Grundstückspreis gilt für jedes Gebäude zusätzlich zu den Klassenkosten. */
  landPrice: number;
  concession: ConcessionConfig;
  classes: Record<BuildingClass, BuildingClassCost>;
  kontor: BuildingClassCost;
  production: ProductionBuildingConfig[];
}

export interface GameConfig {
  world: WorldConfig;
  player: PlayerConfig;
  fleet: FleetConfig;
  market: MarketConfig;
  reputation: ReputationConfig;
  consumption: ConsumptionConfig;
  goods: GoodConfig[];
  cities: CityConfig[];
  buildings: BuildingsConfig;
  alpha3: Alpha3Config;
}
