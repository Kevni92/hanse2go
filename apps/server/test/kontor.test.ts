import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const kontorMaterials = { wood: 50, planks: 25, bricks: 40, tools: 10 };

/** Regeln aus `docs/alpha-2/kontor-and-inventory.md`. */
describe('kontor transfer API', () => {
  let app = buildApp(undefined, { enableTestReset: true });
  afterEach(async () => { await app.close(); app = buildApp(undefined, { enableTestReset: true }); });

  const seed = (payload: Record<string, unknown>) => app.inject({ method: 'POST', url: '/test/seed', payload });
  const transfer = (goodId: string, quantity: number, direction: 'store' | 'retrieve', cityId = 'lambrecht') => app.inject({ method: 'POST', url: `/api/cities/${cityId}/kontor/transfer`, payload: { goodId, quantity, direction } });
  const overview = async (cityId = 'lambrecht') => (await app.inject({ method: 'GET', url: `/api/cities/${cityId}/buildings` })).json();

  const withKontor = async (cargo: Record<string, number> = {}) => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    await seed({ reputation: { lambrecht: 80 }, cargo: kontorMaterials });
    await app.inject({ method: 'POST', url: '/api/cities/lambrecht/concession' });
    expect((await app.inject({ method: 'POST', url: '/api/cities/lambrecht/buildings', payload: { buildingType: 'kontor' } })).statusCode).toBe(200);
    await seed({ cargo });
  };

  it('refuses any transfer without an own kontor', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    await seed({ cargo: { wood: 10 } });
    const response = await transfer('wood', 10, 'store');
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: 'KONTOR_REQUIRED' } });
  });

  it('stores and retrieves whole tons atomically between fleet and kontor', async () => {
    await withKontor({ wood: 30 });
    const stored = await transfer('wood', 10, 'store');
    expect(stored.statusCode).toBe(200);
    expect(stored.json()).toMatchObject({ kontorInventory: { wood: 10 }, fleet: { cargo: { wood: 20 } } });

    const retrieved = await transfer('wood', 4, 'retrieve');
    expect(retrieved.json()).toMatchObject({ kontorInventory: { wood: 6 }, fleet: { cargo: { wood: 24 } } });
  });

  it('rejects invalid quantities without changing any stock', async () => {
    await withKontor({ wood: 30 });
    for (const quantity of [0, -5, 2.5]) {
      const response = await transfer('wood', quantity, 'store');
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: { code: 'INVALID_TRANSFER_QUANTITY' } });
    }
    expect((await overview()).fleet.cargo).toEqual({ wood: 30 });
  });

  it('rejects a store above the fleet stock and a retrieve above the kontor stock', async () => {
    await withKontor({ wood: 10 });
    const tooMuch = await transfer('wood', 11, 'store');
    expect(tooMuch.statusCode).toBe(409);
    expect(tooMuch.json()).toMatchObject({ error: { code: 'INSUFFICIENT_FLEET_GOODS' } });

    await transfer('wood', 10, 'store');
    const empty = await transfer('wood', 11, 'retrieve');
    expect(empty.statusCode).toBe(409);
    expect(empty.json()).toMatchObject({ error: { code: 'INSUFFICIENT_KONTOR_GOODS' } });
    expect((await overview()).kontorInventory).toEqual({ wood: 10 });
  });

  it('rejects a retrieve above the free fleet capacity', async () => {
    await withKontor({ wood: 60 });
    await transfer('wood', 60, 'store');
    await seed({ cargo: { grain: 145 } });
    const response = await transfer('wood', 6, 'retrieve');
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: 'INSUFFICIENT_FLEET_CAPACITY', details: { freeCapacity: 5 } } });
    expect((await overview()).kontorInventory).toEqual({ wood: 60 });

    expect((await transfer('wood', 5, 'retrieve')).statusCode).toBe(200);
  });

  it('keeps market, fleet and kontor stocks apart and creates no reputation', async () => {
    await withKontor({ clay: 20 });
    const cityStockBefore = (await app.inject({ method: 'GET', url: '/api/cities/lambrecht' })).json().city.stock.clay;
    const reputationBefore = (await overview()).reputation.value;
    await transfer('clay', 20, 'store');
    expect((await app.inject({ method: 'GET', url: '/api/cities/lambrecht' })).json().city.stock.clay).toBe(cityStockBefore);
    expect((await overview()).reputation.value).toBe(reputationBefore);
  });

  it('rejects an unknown good', async () => {
    await withKontor({ wood: 10 });
    const response = await transfer('gold-bars', 1, 'store');
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { code: 'GOOD_NOT_FOUND' } });
  });
});
