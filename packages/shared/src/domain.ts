export type GoodCategory = 'Nahrung' | 'Baustoffe' | 'Handwerk' | 'Kleidung' | 'Haushaltswaren' | 'Luxuswaren';

export interface Position { longitude: number; latitude: number; recordedAt: string }
export interface Good { id: string; name: string; category: GoodCategory; basePrice: number; targetStock: number }
export interface City { id: string; name: string; position: Position; radiusMeters: number; population: number; prosperity: number; popularity: number; hasKontor: boolean; productionFocus: string[]; stock: Record<string, number> }
export interface Fleet { id: string; capacity: number; cargo: Record<string, number>; position: Position }
export interface Player { id: string; name: string; gold: number; activeFleetId: string }
export type TradeDirection = 'buy' | 'sell';
export interface MarketQuote { cityId: string; goodId: string; direction: TradeDirection; quantity: number; marketVersion: number; total: number; averageUnitPrice: number; minimumUnitPrice: number; maximumUnitPrice: number; resultingCityStock: number; resultingFleetStock: number; resultingGold: number; remainingCapacity: number }
export interface MarketHistoryEntry { timestamp: string; goodId: string; direction: TradeDirection; quantity: number; total: number; priceBefore: number; priceAfter: number }

/** Alpha 2 – Ruf, Konzession, Gebäude, Kontorlager und Stundentick. */
export type ReputationStatus = 'Fremder' | 'Bekannter Händler' | 'Angesehener Händler' | 'Vertrauenswürdiger Bürger';
export interface Reputation { cityId: string; value: number; status: ReputationStatus }

export type BuildingClass = 'einfach' | 'mittel' | 'hochwertig';
/** `kontor` ist Pflichtgebäude ohne Produktion, `raw` produziert ohne Eingang, `processing` verarbeitet. */
export type BuildingKind = 'kontor' | 'raw' | 'processing';
export type BuildingStatus = 'built' | 'production_ready' | 'stalled';
export type BuildingStallReason = 'missing_inputs';
export type BuildingAvailability = 'buildable' | 'requirements_missing';
export type BuildingRequirement = 'concession' | 'kontor' | 'kontor_already_exists' | 'gold' | 'materials';

export interface BuildingCost { landGold: number; buildGold: number; totalGold: number; materials: Record<string, number> }
export interface BuildingCatalogEntry { buildingType: string; name: string; kind: BuildingKind; buildingClass?: BuildingClass; cost: BuildingCost; inputs: Record<string, number>; outputs: Record<string, number> }
export interface BuildingOffer extends BuildingCatalogEntry { availability: BuildingAvailability; missingRequirements: BuildingRequirement[]; missingGold: number; missingMaterials: Record<string, number> }
export interface Building { id: string; playerId: string; cityId: string; buildingType: string; name: string; kind: BuildingKind; buildingClass?: BuildingClass; status: BuildingStatus; reason?: BuildingStallReason; lastInputs: Record<string, number>; lastOutputs: Record<string, number> }

export interface WorldClock { tickNumber: number; simulatedHour: number }
export interface BuildingProductionReport { buildingId: string; buildingType: string; cityId: string; status: BuildingStatus; reason?: BuildingStallReason; inputs: Record<string, number>; outputs: Record<string, number> }
export interface ConsumptionReport { cityId: string; goodId: string; requested: number; consumed: number; remainingStock: number }
export interface TickReport { tickNumber: number; simulatedHour: number; production: BuildingProductionReport[]; consumption: ConsumptionReport[] }

export type TransferDirection = 'store' | 'retrieve';
export interface CityBuildingsOverview { cityId: string; reputation: Reputation; hasConcession: boolean; concessionPrice: number; hasKontor: boolean; kontorInventory: Record<string, number>; kontor: BuildingOffer; buildings: Building[]; catalog: BuildingOffer[]; world: WorldClock; player: Player; fleet: Fleet }

export interface GameState { player: Player; fleet: Fleet; goods: Good[]; cities: City[]; world: WorldClock; reputations: Reputation[]; concessions: string[]; buildings: Building[]; kontors: Record<string, Record<string, number>>; lastTickReport?: TickReport }
