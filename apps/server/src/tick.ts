import type { Building, BuildingProductionReport, City, ConsumptionReport, GameState, Player, TickReport, WorkforcePriority } from '@hanse2go/shared';
import type { Alpha3Config } from '@hanse2go/config';
import { DomainError } from './city-access.js';
import type { ConsumptionModel } from './consumption.js';
import type { GameRepository } from './game-state.js';
import type { MarketService } from './market.js';
import type { BuildingCatalog } from './production.js';
import type { ReputationService } from './reputation.js';
import type { OrderBookService } from './order-book.js';
import { moveAvailableMoney, PLAYER_ACCOUNT, POPULATION_ACCOUNT } from './money.js';

/** Stundentick aus `docs/alpha-2/production-tick.md`: eine simulierte Stunde, als Ganzes atomar. */
export class TickService {
  private running = false;
  private readonly completed = new Map<string, TickReport>();

  constructor(
    private readonly repository: GameRepository,
    private readonly reputation: ReputationService,
    private readonly market: MarketService,
    private readonly catalog: BuildingCatalog,
    private readonly consumption: ConsumptionModel,
    private readonly alpha3: Alpha3Config,
    private readonly orderBook?: OrderBookService,
  ) {}

  run(idempotencyKey: string): TickReport {
    const prior = this.completed.get(idempotencyKey);
    if (prior) return prior;
    if (this.running) throw new DomainError('TICK_IN_PROGRESS', 'Es läuft bereits ein Stundentick.', 409);
    this.running = true;
    try {
      const { report, changedCities } = this.repository.runTransaction((state) => {
        // Bis zum Schreiben am Ende arbeitet der Tick auf Kopien; ein Fehler lässt den Weltzustand unverändert.
        const buildings = structuredClone(state.buildings);
        const kontorsBefore = structuredClone(state.kontors);
        const kontors = structuredClone(state.kontors);
        const cities = structuredClone(state.cities);
        const cityEconomies = structuredClone(state.cityEconomies);
        const player = structuredClone(state.player);
        const executionStart = state.executions.length;

        this.allocateAndPay(buildings, cities, player, state);
        const production = this.produce(buildings, kontors, state.kontorWarehouses);
        const world = { tickNumber: state.world.tickNumber + 1, simulatedHour: state.world.simulatedHour + 1 };

        state.buildings = buildings;
        state.kontors = kontors;
        this.syncKontorWarehouses(state, kontorsBefore, kontors);
        state.cities = cities;
        state.cityEconomies = cityEconomies;
        state.player = player;
        state.world = world;
        this.orderBook?.matchAll(state);
        const populationOrderIds = new Set(state.orders.filter((order) => order.ownerType === 'population' && order.side === 'buy').map((order) => order.orderId));
        this.orderBook?.refreshSystemOrders(state, this.consumption.config);
        for (const order of state.orders) if (order.ownerType === 'population' && order.side === 'buy') populationOrderIds.add(order.orderId);
        const populationPurchases = this.consumePopulationPurchases(state, executionStart, populationOrderIds);
        const consumption = this.consume(state, cityEconomies, populationPurchases);
        this.updateWealthAndGrowth(state.cities, cityEconomies, consumption, buildings);
        const tickReport: TickReport = { tickNumber: world.tickNumber, simulatedHour: world.simulatedHour, production, consumption };
        state.lastTickReport = tickReport;
        return { report: tickReport, changedCities: consumption.filter((entry) => entry.consumed > 0).map((entry) => entry.cityId) };
      });
      // Kontingente und Restmengen des Rufaufbaus verfallen mit der Stunde.
      this.reputation.startNewHour();
      for (const cityId of new Set(changedCities)) this.market.invalidateCity(cityId);
      this.completed.set(idempotencyKey, report);
      return report;
    } finally {
      this.running = false;
    }
  }

  reset(): void { this.completed.clear(); }

  /** Alpha 3: financeable demand is allocated before wages and production. The current in-memory alpha has one player; priority still defines deterministic per-city allocation. */
  private allocateAndPay(buildings: Building[], cities: City[], player: Player, state: ReturnType<GameRepository['getState']>): void {
    const rank: Record<WorkforcePriority, number> = { very_high: 5, high: 4, normal: 3, low: 2, very_low: 1 };
    for (const city of cities) {
      let workersLeft = Math.floor(city.population);
      const candidates = buildings.filter((building) => building.cityId === city.id && building.workforceClass)
        .sort((a, b) => rank[b.workforcePriority ?? 'normal'] - rank[a.workforcePriority ?? 'normal'] || a.id.localeCompare(b.id));
      for (const building of candidates) {
        const workforce = this.alpha3.workforce[building.workforceClass!];
        const financiallyPossible = Math.floor((state.accounts[PLAYER_ACCOUNT(player.id)]?.availableMoney ?? player.gold * 100) / (workforce.wagePerWorker * 100));
        const assigned = Math.min(workersLeft, workforce.workers, financiallyPossible);
        const wageCost = assigned * workforce.wagePerWorker;
        building.assignedWorkers = assigned;
        building.lastWageCost = wageCost;
        workersLeft -= assigned;
        if (wageCost > 0) moveAvailableMoney(state, PLAYER_ACCOUNT(player.id), POPULATION_ACCOUNT(city.id), wageCost * 100, 'wage_payment', 'tick', `tick-${state.world.tickNumber + 1}`, `tick-${state.world.tickNumber + 1}`);
        player.gold = Math.floor((state.accounts[PLAYER_ACCOUNT(player.id)]?.availableMoney ?? player.gold * 100) / 100);
      }
    }
  }

  /** Entnimmt alle Eingänge atomar je Instanz und lagert alle Ausgänge erst nach der Produktionsphase ein. */
  private produce(buildings: Building[], kontors: Record<string, Record<string, number>>, warehouses: GameState['kontorWarehouses']): BuildingProductionReport[] {
    const reports: BuildingProductionReport[] = [];
    const buffered: Array<{ cityId: string; outputs: Record<string, number> }> = [];
    for (const building of buildings) {
      if (building.buildingType === this.catalog.kontorType || building.buildingType === this.alpha3.housing.buildingType) continue;
      const entry = this.catalog.find(building.buildingType);
      if (!entry) continue;
      const store = (kontors[building.cityId] ??= {});
      const workforce = building.workforceClass ? this.alpha3.workforce[building.workforceClass] : undefined;
      const utilization = workforce ? (building.assignedWorkers ?? 0) / workforce.workers : 1;
      const inputs = Object.entries(entry.inputs);
      building.lastInputs = {};
      building.lastOutputs = {};
      const proportionalInputs = Object.fromEntries(inputs.map(([goodId, amount]) => [goodId, amount * utilization]));
      const proportionalOutputs = Object.fromEntries(Object.entries(entry.outputs).map(([goodId, amount]) => [goodId, amount * utilization]));
      if (utilization <= 0) {
        building.status = 'stalled';
        building.reason = 'missing_inputs';
      } else if (Object.entries(proportionalInputs).some(([goodId, amount]) => (store[goodId] ?? 0) + 1e-9 < amount || (warehouses[building.cityId]?.[goodId]?.availableUnits ?? 0) + 1e-9 < amount * 100)) {
        building.status = 'stalled';
        building.reason = 'missing_inputs';
      } else {
        for (const [goodId, amount] of Object.entries(proportionalInputs)) {
          store[goodId] = (store[goodId] ?? 0) - amount;
          if (store[goodId] === 0) delete store[goodId];
        }
        building.status = 'production_ready';
        delete building.reason;
        building.lastInputs = proportionalInputs;
        building.lastOutputs = proportionalOutputs;
        buffered.push({ cityId: building.cityId, outputs: proportionalOutputs });
      }
      reports.push({ buildingId: building.id, buildingType: building.buildingType, cityId: building.cityId, status: building.status, ...(building.reason ? { reason: building.reason } : {}), assignedWorkers: building.assignedWorkers, wageCost: building.lastWageCost, utilization, inputs: { ...building.lastInputs }, outputs: { ...building.lastOutputs } });
    }
    for (const { cityId, outputs } of buffered) {
      const store = (kontors[cityId] ??= {});
      for (const [goodId, amount] of Object.entries(outputs)) store[goodId] = (store[goodId] ?? 0) + amount;
    }
    return reports;
  }

  /** Zieht den festen Bevölkerungsverbrauch je Stadt und Ware ab; Bestände werden nie negativ. */
  private consume(state: GameState, economies: Record<string, { consumptionRemainders: Record<string, number> }>, populationPurchases: Record<string, Record<string, number>>): ConsumptionReport[] {
    const reports: ConsumptionReport[] = [];
    for (const city of state.cities) {
      for (const goodId of this.consumption.consumedGoodIds) {
        const rate = this.consumption.required(this.consumption.config.populationUnit, goodId);
        const remainder = economies[city.id]!.consumptionRemainders[goodId] ?? 0;
        const raw = rate * city.population + remainder;
        const requested = Math.floor(raw / this.consumption.config.populationUnit);
        economies[city.id]!.consumptionRemainders[goodId] = raw % this.consumption.config.populationUnit;
        const purchased = Math.min(requested, populationPurchases[city.id]?.[goodId] ?? 0);
        const stock = city.stock[goodId] ?? 0;
        const remainingDemand = Math.max(0, requested - purchased);
        const consumedFromStock = Math.min(remainingDemand, stock);
        const consumed = purchased + consumedFromStock;
        const warehouse = state.cityWarehouses[city.id]![goodId]!;
        if (consumedFromStock > 0) {
          const units = consumedFromStock * 100;
          if (warehouse.availableUnits < units) throw new DomainError('ORDER_MATCHING_FAILED', 'Das Stadtlager ist nicht mit dem Stadtbestand synchron.', 500);
          warehouse.availableUnits -= units;
          warehouse.totalUnits -= units;
          warehouse.inventoryVersion += 1;
          city.stock[goodId] = stock - consumedFromStock;
        }
        reports.push({ cityId: city.id, goodId, requested, consumed, remainingStock: city.stock[goodId] ?? stock });
      }
    }
    return reports;
  }

  private syncKontorWarehouses(state: GameState, before: Record<string, Record<string, number>>, after: Record<string, Record<string, number>>): void {
    for (const city of state.cities) {
      for (const good of state.goods) {
        const deltaUnits = Math.round(((after[city.id]?.[good.id] ?? 0) - (before[city.id]?.[good.id] ?? 0)) * 100);
        if (deltaUnits === 0) continue;
        const warehouse = state.kontorWarehouses[city.id]![good.id]!;
        if (deltaUnits < 0 && warehouse.availableUnits < -deltaUnits) throw new DomainError('ORDER_MATCHING_FAILED', 'Die Produktion verwendet reservierte Kontorware.', 409);
        warehouse.availableUnits += deltaUnits;
        warehouse.totalUnits += deltaUnits;
        warehouse.inventoryVersion += 1;
      }
    }
  }

  private consumePopulationPurchases(state: GameState, executionStart: number, populationOrderIds: Set<string>): Record<string, Record<string, number>> {
    const purchased: Record<string, Record<string, number>> = {};
    for (const execution of state.executions.slice(executionStart)) {
      if (!populationOrderIds.has(execution.buyOrderId)) continue;
      const warehouse = state.cityWarehouses[execution.cityId]![execution.goodId]!;
      const units = execution.quantityUnits;
      if (warehouse.availableUnits < units) throw new DomainError('ORDER_MATCHING_FAILED', 'Die gekaufte Bevölkerungsware ist nicht verfügbar.', 500);
      warehouse.availableUnits -= units;
      warehouse.totalUnits -= units;
      warehouse.inventoryVersion += 1;
      const city = state.cities.find((entry) => entry.id === execution.cityId)!;
      city.stock[execution.goodId] = Math.max(0, (city.stock[execution.goodId] ?? 0) - units / 100);
      purchased[execution.cityId] ??= {};
      purchased[execution.cityId]![execution.goodId] = (purchased[execution.cityId]![execution.goodId] ?? 0) + units / 100;
    }
    return purchased;
  }

  private updateWealthAndGrowth(cities: City[], economies: Record<string, { baseHousing: number; wealth: number; wealthRemainder: number; growthRemainder: number }>, consumption: ConsumptionReport[], buildings: Building[]): void {
    for (const city of cities) {
      const reports = consumption.filter((entry) => entry.cityId === city.id);
      const coverage = reports.length ? reports.reduce((sum, entry) => sum + (entry.requested ? entry.consumed / entry.requested : 1), 0) / reports.length : 1;
      const economy = economies[city.id]!;
      const target = coverage * 100;
      economy.wealth = Math.max(0, Math.min(100, economy.wealth + (target - economy.wealth) * 842 / 1_000_000));
      const houses = buildings.filter((building) => building.cityId === city.id && building.buildingType === this.alpha3.housing.buildingType).length;
      const totalHousing = economy.baseHousing + houses * this.alpha3.housing.capacity;
      const freeHousing = Math.max(0, totalHousing - city.population);
      const housingFactor = Math.min(1, freeHousing / Math.max(city.population * 0.1, 1));
      const rawGrowth = city.population * Math.max(0, economy.wealth - 40) / 100 * 0.001 / 24 * housingFactor + economy.growthRemainder;
      const growth = Math.floor(rawGrowth);
      economy.growthRemainder = rawGrowth - growth;
      city.population += Math.min(growth, freeHousing);
    }
  }
}
