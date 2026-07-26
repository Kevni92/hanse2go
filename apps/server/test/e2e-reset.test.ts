import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Playwright test reset', () => {
  const app = buildApp(undefined, { enableTestReset: true });
  afterEach(async () => { await app.inject({ method: 'POST', url: '/test/reset' }); });

  it('restores the deterministic alpha state only when explicitly enabled', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    const quote = (await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/quote', payload: { goodId: 'wood', direction: 'buy', quantity: 1 } })).json();
    await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'wood', direction: 'buy', quantity: 1, marketVersion: quote.marketVersion, idempotencyKey: 'reset-check' } });
    await app.inject({ method: 'POST', url: '/test/seed', payload: { reputation: { lambrecht: 80 }, cargo: { wood: 50, planks: 25, bricks: 40, tools: 10 } } });
    await app.inject({ method: 'POST', url: '/api/cities/lambrecht/concession' });
    await app.inject({ method: 'POST', url: '/api/cities/lambrecht/buildings', payload: { buildingType: 'kontor' } });
    await app.inject({ method: 'POST', url: '/api/debug/tick', payload: { idempotencyKey: 'reset-tick' } });

    expect((await app.inject({ method: 'POST', url: '/test/reset' })).statusCode).toBe(200);
    const state = (await app.inject({ method: 'GET', url: '/api/state' })).json();
    // Startwerte aus `docs/alpha-2/test-world.md`.
    expect(state.player.gold).toBe(100_000);
    expect(state.fleet.cargo).toEqual({});
    expect(state.cities.find((city: { id: string }) => city.id === 'lambrecht').stock.wood).toBe(200);
    expect(state.world).toEqual({ tickNumber: 0, simulatedHour: 0 });
    expect(state.reputations.every((entry: { value: number }) => entry.value === 0)).toBe(true);
    expect(state).toMatchObject({ concessions: [], buildings: [], kontors: {} });
    expect(state.lastTickReport).toBeUndefined();
    expect(state.cities.every((city: { hasKontor: boolean }) => !city.hasKontor)).toBe(true);
  });

  it('prepares the documented Alpha 2 test state and refuses seeding beyond the fleet capacity', async () => {
    const seeded = await app.inject({ method: 'POST', url: '/test/seed', payload: { gold: 42_000, reputation: { lambrecht: 80 }, cargo: { wood: 10 } } });
    expect(seeded.statusCode).toBe(200);
    expect(seeded.json().player.gold).toBe(42_000);
    expect(seeded.json().reputations.find((entry: { cityId: string }) => entry.cityId === 'lambrecht')).toEqual({ cityId: 'lambrecht', value: 80, status: 'trusted_citizen' });

    const tooMuch = await app.inject({ method: 'POST', url: '/test/seed', payload: { cargo: { wood: 151 } } });
    expect(tooMuch.statusCode).toBe(409);
    expect(tooMuch.json()).toMatchObject({ error: { code: 'INSUFFICIENT_CAPACITY' } });
  });

  it('keeps the test endpoints out of a server without the test flag', async () => {
    const plain = buildApp();
    expect((await plain.inject({ method: 'POST', url: '/test/reset' })).statusCode).toBe(404);
    expect((await plain.inject({ method: 'POST', url: '/test/seed', payload: { gold: 1 } })).statusCode).toBe(404);
    await plain.close();
  });
});
