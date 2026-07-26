import type { Building, BuildingProductionReport, City, ConsumptionReport, TickReport } from '@hanse2go/shared';
import { DomainError } from './city-access.js';
import { consumptionPerThousand, requiredConsumption } from './consumption.js';
import type { GameRepository } from './game-state.js';
import type { MarketService } from './market.js';
import { KONTOR_TYPE, findBuildingType } from './production.js';
import type { ReputationService } from './reputation.js';

/** Stundentick aus `docs/alpha-2/production-tick.md`: eine simulierte Stunde, als Ganzes atomar. */
export class TickService {
  private running = false;
  private readonly completed = new Map<string, TickReport>();

  constructor(private readonly repository: GameRepository, private readonly reputation: ReputationService, private readonly market: MarketService) {}

  run(idempotencyKey: string): TickReport {
    const prior = this.completed.get(idempotencyKey);
    if (prior) return prior;
    if (this.running) throw new DomainError('TICK_IN_PROGRESS', 'Es läuft bereits ein Stundentick.', 409);
    this.running = true;
    try {
      const { report, changedCities } = this.repository.runTransaction((state) => {
        // Bis zum Schreiben am Ende arbeitet der Tick auf Kopien; ein Fehler lässt den Weltzustand unverändert.
        const buildings = structuredClone(state.buildings);
        const kontors = structuredClone(state.kontors);
        const cities = structuredClone(state.cities);

        const production = this.produce(buildings, kontors);
        const consumption = this.consume(cities);
        const world = { tickNumber: state.world.tickNumber + 1, simulatedHour: state.world.simulatedHour + 1 };
        const tickReport: TickReport = { tickNumber: world.tickNumber, simulatedHour: world.simulatedHour, production, consumption };

        state.buildings = buildings;
        state.kontors = kontors;
        state.cities = cities;
        state.world = world;
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

  /** Entnimmt alle Eingänge atomar je Instanz und lagert alle Ausgänge erst nach der Produktionsphase ein. */
  private produce(buildings: Building[], kontors: Record<string, Record<string, number>>): BuildingProductionReport[] {
    const reports: BuildingProductionReport[] = [];
    const buffered: Array<{ cityId: string; outputs: Record<string, number> }> = [];
    for (const building of buildings) {
      if (building.buildingType === KONTOR_TYPE) continue;
      const entry = findBuildingType(building.buildingType);
      if (!entry) continue;
      const store = (kontors[building.cityId] ??= {});
      const inputs = Object.entries(entry.inputs);
      building.lastInputs = {};
      building.lastOutputs = {};
      if (inputs.some(([goodId, amount]) => (store[goodId] ?? 0) < amount)) {
        building.status = 'stalled';
        building.reason = 'missing_inputs';
      } else {
        for (const [goodId, amount] of inputs) {
          store[goodId] = (store[goodId] ?? 0) - amount;
          if (store[goodId] === 0) delete store[goodId];
        }
        building.status = 'production_ready';
        delete building.reason;
        building.lastInputs = { ...entry.inputs };
        building.lastOutputs = { ...entry.outputs };
        buffered.push({ cityId: building.cityId, outputs: entry.outputs });
      }
      reports.push({ buildingId: building.id, buildingType: building.buildingType, cityId: building.cityId, status: building.status, ...(building.reason ? { reason: building.reason } : {}), inputs: { ...building.lastInputs }, outputs: { ...building.lastOutputs } });
    }
    for (const { cityId, outputs } of buffered) {
      const store = (kontors[cityId] ??= {});
      for (const [goodId, amount] of Object.entries(outputs)) store[goodId] = (store[goodId] ?? 0) + amount;
    }
    return reports;
  }

  /** Zieht den festen Bevölkerungsverbrauch je Stadt und Ware ab; Bestände werden nie negativ. */
  private consume(cities: City[]): ConsumptionReport[] {
    const reports: ConsumptionReport[] = [];
    for (const city of cities) {
      for (const goodId of Object.keys(consumptionPerThousand)) {
        const requested = requiredConsumption(city.population, goodId);
        const stock = city.stock[goodId] ?? 0;
        const consumed = Math.min(requested, stock);
        city.stock[goodId] = stock - consumed;
        reports.push({ cityId: city.id, goodId, requested, consumed, remainingStock: stock - consumed });
      }
    }
    return reports;
  }
}
