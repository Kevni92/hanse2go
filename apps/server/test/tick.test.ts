import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadGameConfig } from '@hanse2go/config';
import { buildApp } from '../src/app.js';
import { DomainError } from '../src/city-access.js';
import { InMemoryGameRepository, type GameRepository } from '../src/game-state.js';
import { MarketService } from '../src/market.js';
import { CityAccessService } from '../src/city-access.js';
import { ConsumptionModel } from '../src/consumption.js';
import { createBuildingCatalog } from '../src/production.js';
import { ReputationService } from '../src/reputation.js';
import { TickService } from '../src/tick.js';

const config = loadGameConfig();
const catalog = createBuildingCatalog(config.buildings, config.alpha3);
const consumption = new ConsumptionModel(config.consumption);

const kontorMaterials = { wood: 50, planks: 25, bricks: 40, tools: 10 };
const simpleMaterials = { wood: 20, planks: 10, bricks: 10, tools: 5 };
const mediumMaterials = { wood: 30, planks: 20, bricks: 20, tools: 10 };

/** Regeln aus `docs/alpha-2/production-tick.md` und `docs/alpha-2/population-consumption.md`. */
describe('hourly tick API', () => {
  let app = buildApp(undefined, { enableTestReset: true });
  afterEach(async () => { await app.close(); app = buildApp(undefined, { enableTestReset: true }); });

  const seed = (payload: Record<string, unknown>) => app.inject({ method: 'POST', url: '/test/seed', payload });
  const tick = (key: string) => app.inject({ method: 'POST', url: '/api/debug/tick', payload: { idempotencyKey: key } });
  const transfer = (goodId: string, quantity: number, direction: 'store' | 'retrieve') => app.inject({ method: 'POST', url: '/api/cities/lambrecht/kontor/transfer', payload: { goodId, quantity, direction } });
  const build = (buildingType: string) => app.inject({ method: 'POST', url: '/api/cities/lambrecht/buildings', payload: { buildingType } });
  const overview = async () => (await app.inject({ method: 'GET', url: '/api/cities/lambrecht/buildings' })).json();
  const cityStock = async (cityId: string, goodId: string) => (await app.inject({ method: 'GET', url: '/api/state' })).json().cities.find((city: { id: string }) => city.id === cityId).stock[goodId];

  const withKontor = async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    await seed({ cargo: kontorMaterials });
    expect((await build('kontor')).statusCode).toBe(200);
  };

  it('starts the world at tick zero and simulated hour zero', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/world' })).json()).toMatchObject({ tickNumber: 0, simulatedHour: 0 });
  });

  it('advances tick number and simulated hour by exactly one', async () => {
    expect((await tick('hour-1')).json()).toMatchObject({ tickNumber: 1, simulatedHour: 1 });
    expect((await tick('hour-2')).json()).toMatchObject({ tickNumber: 2, simulatedHour: 2 });
    expect((await app.inject({ method: 'GET', url: '/api/world' })).json()).toMatchObject({ tickNumber: 2, simulatedHour: 2 });
  });

  it('returns the first result for a repeated idempotency key without a second tick', async () => {
    const first = await tick('double-click');
    const retry = await tick('double-click');
    expect(retry.json()).toEqual(first.json());
    expect((await app.inject({ method: 'GET', url: '/api/world' })).json().tickNumber).toBe(1);
  });

  it('rejects a re-entrant tick with TICK_IN_PROGRESS and no state change', async () => {
    const repository = new InMemoryGameRepository();
    const cityAccess = new CityAccessService(repository);
    const reputation = new ReputationService(config.reputation);
    let nested: unknown;
    // eslint-disable-next-line prefer-const -- der Testdoppelgänger referenziert den Dienst, den er erst danach erhält
    let service!: TickService;
    // Der Testdoppelgänger betritt den laufenden Tick ein zweites Mal, während die Weltsperre gehalten wird.
    const reentrant: GameRepository = { ...repository, runTransaction: (operation) => repository.runTransaction((state) => { nested ??= captureError(() => service.run('nested')); return operation(state); }) };
    service = new TickService(reentrant, reputation, new MarketService(reentrant, cityAccess, config.market, reputation), catalog, consumption, config.alpha3);

    service.run('outer');
    expect(nested).toBeInstanceOf(DomainError);
    expect(nested).toMatchObject({ code: 'TICK_IN_PROGRESS', statusCode: 409 });
    expect(repository.getState().world.tickNumber).toBe(1);
  });

  it('is unavailable outside the debug build', async () => {
    const productionApp = buildApp(undefined, { enableDebugTick: false });
    expect((await productionApp.inject({ method: 'POST', url: '/api/debug/tick', payload: { idempotencyKey: 'none' } })).statusCode).toBe(404);
    await productionApp.close();
  });

  it('produces from raw buildings and stalls a processing building without inputs', async () => {
    await withKontor();
    await seed({ cargo: simpleMaterials });
    expect((await build('sawmill')).statusCode).toBe(200);

    const stalled = (await tick('hour-1')).json();
    expect(stalled.production).toEqual([expect.objectContaining({ buildingType: 'sawmill', status: 'stalled', reason: 'missing_inputs', inputs: {}, outputs: {} })]);
    expect((await overview()).kontorInventory).toEqual({});

    await seed({ cargo: { wood: 10 } });
    await transfer('wood', 10, 'store');
    const produced = (await tick('hour-2')).json();
    expect(produced.production).toEqual([expect.objectContaining({ buildingType: 'sawmill', status: 'production_ready', inputs: { wood: 10 }, outputs: { planks: 10 } })]);
    expect((await overview()).kontorInventory).toEqual({ planks: 10 });
    expect((await overview()).buildings.find((building: { buildingType: string }) => building.buildingType === 'sawmill')).toMatchObject({ status: 'production_ready', lastOutputs: { planks: 10 } });
  });

  it('makes outputs available only in the following tick', async () => {
    await withKontor();
    for (const [buildingType, materials] of [['forestry', simpleMaterials], ['sawmill', simpleMaterials]] as const) {
      await seed({ cargo: materials });
      expect((await build(buildingType)).statusCode).toBe(200);
    }
    // Der Forstbetrieb erzeugt 20 Holz, das Sägewerk steht in derselben Stunde noch still.
    const first = (await tick('hour-1')).json();
    expect(first.production.map((entry: { status: string }) => entry.status)).toEqual(['production_ready', 'stalled']);
    expect((await overview()).kontorInventory).toEqual({ wood: 20 });

    const second = (await tick('hour-2')).json();
    expect(second.production.map((entry: { status: string }) => entry.status)).toEqual(['production_ready', 'production_ready']);
    expect((await overview()).kontorInventory).toEqual({ wood: 30, planks: 10 });
  });

  it('multiplies the recipe for several instances and keeps side products', async () => {
    await withKontor();
    for (const buildingType of ['grain_farm', 'grain_farm', 'cattle_farm']) {
      await seed({ cargo: buildingType === 'grain_farm' ? simpleMaterials : mediumMaterials });
      expect((await build(buildingType)).statusCode).toBe(200);
    }
    await tick('hour-1');
    expect((await overview()).kontorInventory).toEqual({ grain: 40 });
    await tick('hour-2');
    // Zwei Getreidehöfe liefern 40 Tonnen, der Rinderhof verbraucht davon zehn und erzeugt Vieh und Milch.
    expect((await overview()).kontorInventory).toEqual({ grain: 70, livestock: 5, milk: 10 });
  });

  it('consumes the documented fixed amounts from every city market', async () => {
    const before = await Promise.all(['lambrecht', 'neustadt', 'mannheim'].map((cityId) => cityStock(cityId, 'bread')));
    const report = (await tick('hour-1')).json();
    expect(report.consumption).toContainEqual({ cityId: 'lambrecht', goodId: 'bread', requested: 4, consumed: 4, remainingStock: before[0]! - 4 });
    expect(report.consumption).toContainEqual({ cityId: 'neustadt', goodId: 'bread', requested: 10, consumed: 10, remainingStock: before[1]! - 10 });
    expect(report.consumption).toContainEqual({ cityId: 'mannheim', goodId: 'bread', requested: 20, consumed: 20, remainingStock: before[2]! - 20 });
    for (const goodId of ['clothing', 'meat', 'cheese', 'ceramics', 'furniture', 'rum']) {
      expect(report.consumption).toContainEqual(expect.objectContaining({ cityId: 'lambrecht', goodId, requested: 2 }));
      expect(report.consumption).toContainEqual(expect.objectContaining({ cityId: 'neustadt', goodId, requested: 5 }));
      expect(report.consumption).toContainEqual(expect.objectContaining({ cityId: 'mannheim', goodId, requested: 10 }));
    }
    // Nicht konsumierte Waren bleiben unverändert.
    expect(report.consumption.some((entry: { goodId: string }) => entry.goodId === 'grain')).toBe(false);
    expect(await cityStock('lambrecht', 'grain')).toBe(90);
  });

  it('never lets a market stock become negative on scarcity', async () => {
    // Lambrecht besitzt zehn Tonnen Rum; ab dem sechsten Tick ist der Bestand leer.
    for (let hour = 1; hour <= 6; hour += 1) await tick(`hour-${hour}`);
    expect(await cityStock('lambrecht', 'rum')).toBe(0);
    const scarce = (await tick('hour-7')).json();
    expect(scarce.consumption).toContainEqual({ cityId: 'lambrecht', goodId: 'rum', requested: 2, consumed: 0, remainingStock: 0 });
    expect(await cityStock('lambrecht', 'rum')).toBe(0);
  });

  it('reports partial scarcity with the remaining shortfall', async () => {
    for (let hour = 1; hour <= 5; hour += 1) await tick(`hour-${hour}`);
    expect(await cityStock('lambrecht', 'rum')).toBe(0);
    const report = (await app.inject({ method: 'GET', url: '/api/world' })).json().lastTickReport;
    const rum = report.consumption.find((entry: { cityId: string; goodId: string }) => entry.cityId === 'lambrecht' && entry.goodId === 'rum');
    expect(rum).toEqual({ cityId: 'lambrecht', goodId: 'rum', requested: 2, consumed: 2, remainingStock: 0 });
  });

  it('keeps the last report available and prices follow the new stocks', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    const before = (await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/quote', payload: { goodId: 'bread', direction: 'buy', quantity: 1 } })).json();
    await tick('hour-1');
    const after = (await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/quote', payload: { goodId: 'bread', direction: 'buy', quantity: 1 } })).json();
    expect(after.averageUnitPrice).toBeGreaterThan(before.averageUnitPrice);
    // Ein vor dem Tick geholtes Angebot dieser Stadt ist danach veraltet.
    const stale = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'bread', direction: 'buy', quantity: 1, marketVersion: before.marketVersion, idempotencyKey: 'stale-after-tick' } });
    expect(stale.statusCode).toBe(409);
    expect((await app.inject({ method: 'GET', url: '/api/world' })).json().lastTickReport).toMatchObject({ tickNumber: 1 });
  });

  it('rolls the whole tick back when a phase fails unexpectedly', async () => {
    const repository = new InMemoryGameRepository();
    const cityAccess = new CityAccessService(repository);
    const reputation = new ReputationService(config.reputation);
    const service = new TickService(repository, reputation, new MarketService(repository, cityAccess, config.market, reputation), catalog, consumption, config.alpha3);
    const before = repository.getState();
    const failure = vi.spyOn(Math, 'floor').mockImplementation(() => { throw new Error('unerwarteter Fehler'); });

    expect(() => service.run('broken')).toThrow('unerwarteter Fehler');
    failure.mockRestore();
    const after = repository.getState();
    expect(after.world).toEqual(before.world);
    expect(after.cities).toEqual(before.cities);
    expect(after.lastTickReport).toBeUndefined();
    // Nach dem Fehler ist die Weltsperre wieder frei.
    expect(service.run('after-failure').tickNumber).toBe(1);
  });
});

function captureError(operation: () => unknown): unknown {
  try { operation(); return undefined; } catch (error) { return error; }
}
