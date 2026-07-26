/** Fachliche Bezeichner sind ausschließlich englisch; Anzeigenamen stehen in den Sprachdateien von `@hanse2go/config`. */
export type GoodCategory = 'food' | 'building_materials' | 'crafts' | 'clothing' | 'household' | 'luxury';

export interface Position { longitude: number; latitude: number; recordedAt: string }
export interface Good { id: string; category: GoodCategory; basePrice: number; targetStock: number }
/** `productionFocus` enthält Waren-IDs. */
export interface City { id: string; position: Position; radiusMeters: number; population: number; prosperity: number; popularity: number; hasKontor: boolean; productionFocus: string[]; stock: Record<string, number> }
export interface Fleet { id: string; capacity: number; cargo: Record<string, number>; position: Position }
export type ShipOwnerType = 'player' | 'system';
export type ShipLocationType = 'fleet' | 'port';
export interface Ship { shipId: string; shipTypeId: string; customName: string; ownerType: ShipOwnerType; ownerId: string; locationType: ShipLocationType; fleetId?: string; portCityId?: string; createdAtTick: number; originType: 'world_seed' | 'shipyard_build'; originCityId: string; buildOrderId?: string; shipVersion: number }
export type ManagedFleetStatus = 'active' | 'in_port';
export interface ManagedFleet { fleetId: string; ownerId: string; customName: string; status: ManagedFleetStatus; shipIds: string[]; portCityId?: string; position?: Position; cargoByGood: Record<string, number>; createdAtTick: number; fleetVersion: number }
export interface Shipyard { cityId: string; shipyardVersion: number; activeBuildOrderId?: string; queuedBuildOrderIds: string[] }
export interface ShipBuildOrder { buildOrderId: string; ownerId: string; cityId: string; shipTypeId: string; requestedShipName?: string; status: 'queued' | 'building' | 'completed'; queuePosition: number; createdAtTick: number; startedAtTick?: number; completedAtTick?: number; totalBuildTicks: number; remainingBuildTicks: number; paidGold: number; paidMaterials: Record<string, number>; resultShipId?: string }
export interface Player { id: string; name: string; gold: number; activeFleetId: string }
export type TradeDirection = 'buy' | 'sell';
export interface MarketQuote { cityId: string; goodId: string; direction: TradeDirection; quantity: number; marketVersion: number; total: number; averageUnitPrice: number; minimumUnitPrice: number; maximumUnitPrice: number; resultingCityStock: number; resultingFleetStock: number; resultingGold: number; remainingCapacity: number }
export interface MarketHistoryEntry { timestamp: string; goodId: string; direction: TradeDirection; quantity: number; total: number; priceBefore: number; priceAfter: number }

export type MoneyOwnerType = 'player' | 'city' | 'population';
export interface MoneyAccount {
  accountId: string;
  ownerType: MoneyOwnerType;
  ownerId: string;
  availableMoney: number;
  reservedMoney: number;
  totalMoney: number;
  accountVersion: number;
}
export interface InventoryBalance { availableUnits: number; reservedUnits: number; totalUnits: number; inventoryVersion: number }
export type LedgerReason = 'market_trade' | 'market_buyer_fee' | 'market_seller_fee' | 'wage_payment' | 'population_purchase' | 'concession_fee' | 'land_purchase_fee' | 'building_construction_fee' | 'shipyard_fee' | 'ship_purchase' | 'ship_sale';
export interface LedgerEntry {
  ledgerEntryId: string;
  tickNumber: number;
  reason: LedgerReason;
  sourceAccountId: string;
  targetAccountId: string;
  amountMoney: number;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
}

export type OrderSide = 'buy' | 'sell';
export type OrderOwnerType = 'player' | 'city' | 'population';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'replaced';
export interface Order {
  orderId: string;
  cityId: string;
  goodId: string;
  side: OrderSide;
  ownerType: OrderOwnerType;
  ownerId: string;
  limitPriceGoldPerTon: number;
  originalQuantityUnits: number;
  remainingQuantityUnits: number;
  reservedMoney: number;
  reservedGoodsUnits: number;
  status: OrderStatus;
  orderVersion: number;
  createdSequence: number;
  createdAtTick: number;
  updatedAtTick: number;
  idempotencyKey: string;
  replacesOrderId?: string;
}
export interface OrderExecution {
  executionId: string;
  cityId: string;
  goodId: string;
  buyOrderId: string;
  sellOrderId: string;
  quantityUnits: number;
  limitPriceGoldPerTon: number;
  grossMoney: number;
  buyerFeeMoney: number;
  sellerFeeMoney: number;
  tickNumber: number;
}
export interface OrderBookLevel { limitPriceGoldPerTon: number; quantityUnits: number; cumulativeQuantityUnits: number; ownQuantityUnits: number; orderCount: number }
export interface OrderBookSnapshot {
  cityId: string;
  goodId: string;
  version: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  recentExecutions: OrderExecution[];
}
export interface IdempotencyRecord {
  requestFingerprint: string;
  operation: 'create' | 'cancel' | 'replace';
  orderId: string;
  responseVersion: number;
}

/** Alpha 2 – Ruf, Konzession, Gebäude, Kontorlager und Stundentick. */
export type ReputationStatus = 'stranger' | 'known_trader' | 'respected_trader' | 'trusted_citizen';
export interface Reputation { cityId: string; value: number; status: ReputationStatus }

export type BuildingClass = 'simple' | 'medium' | 'premium';
/** Alpha 3 keeps the construction class separate from the workforce class. */
export type WorkforceClass = 'simple' | 'medium' | 'premium';
export type WorkforcePriority = 'very_high' | 'high' | 'normal' | 'low' | 'very_low';
/** `kontor` ist Pflichtgebäude ohne Produktion, `raw` produziert ohne Eingang, `processing` verarbeitet. */
export type BuildingKind = 'kontor' | 'raw' | 'processing';
export type BuildingStatus = 'built' | 'production_ready' | 'stalled';
export type BuildingStallReason = 'missing_inputs';
export type BuildingAvailability = 'buildable' | 'requirements_missing';
export type BuildingRequirement = 'concession' | 'kontor' | 'kontor_already_exists' | 'gold' | 'materials';

export interface BuildingCost { landGold: number; buildGold: number; totalGold: number; materials: Record<string, number> }
export interface BuildingCatalogEntry { buildingType: string; kind: BuildingKind; buildingClass?: BuildingClass; workforceClass?: WorkforceClass; cost: BuildingCost; inputs: Record<string, number>; outputs: Record<string, number> }
export interface BuildingOffer extends BuildingCatalogEntry { availability: BuildingAvailability; missingRequirements: BuildingRequirement[]; missingGold: number; missingMaterials: Record<string, number> }
export interface Building { id: string; playerId: string; cityId: string; buildingType: string; kind: BuildingKind; buildingClass?: BuildingClass; workforceClass?: WorkforceClass; workforcePriority?: WorkforcePriority; assignedWorkers?: number; lastWageCost?: number; status: BuildingStatus; reason?: BuildingStallReason; lastInputs: Record<string, number>; lastOutputs: Record<string, number> }

export interface WorldClock { tickNumber: number; simulatedHour: number }
export interface BuildingProductionReport { buildingId: string; buildingType: string; cityId: string; status: BuildingStatus; reason?: BuildingStallReason; assignedWorkers?: number; wageCost?: number; utilization?: number; inputs: Record<string, number>; outputs: Record<string, number> }
export interface ConsumptionReport { cityId: string; goodId: string; requested: number; consumed: number; remainingStock: number }
export interface TickReport { tickNumber: number; simulatedHour: number; production: BuildingProductionReport[]; consumption: ConsumptionReport[] }

export type TransferDirection = 'store' | 'retrieve';
export interface CityBuildingsOverview { cityId: string; reputation: Reputation; hasConcession: boolean; concessionPrice: number; hasKontor: boolean; kontorInventory: Record<string, number>; kontor: BuildingOffer; buildings: Building[]; catalog: BuildingOffer[]; world: WorldClock; player: Player; fleet: Fleet }

export interface CityEconomy { baseHousing: number; wealth: number; consumptionRemainders: Record<string, number>; productionRemainders: Record<string, Record<string, number>>; wealthRemainder: number; growthRemainder: number }
export interface GameState {
  player: Player; fleet: Fleet; fleets: ManagedFleet[]; ships: Ship[]; shipyards: Shipyard[]; shipBuildOrders: ShipBuildOrder[]; shipMarketVersions: Record<string, number>;
  goods: Good[]; cities: City[]; cityEconomies: Record<string, CityEconomy>; world: WorldClock; reputations: Reputation[]; concessions: string[]; buildings: Building[]; kontors: Record<string, Record<string, number>>;
  accounts: Record<string, MoneyAccount>;
  cityWarehouses: Record<string, Record<string, InventoryBalance>>;
  kontorWarehouses: Record<string, Record<string, InventoryBalance>>;
  ledger: LedgerEntry[];
  moneySupply: number;
  orders: Order[];
  executions: OrderExecution[];
  orderBookVersions: Record<string, number>;
  orderIdSequence: number;
  executionIdSequence: number;
  idempotencyRecords: Record<string, IdempotencyRecord>;
  lastTickReport?: TickReport;
}
