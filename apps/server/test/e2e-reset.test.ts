import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Playwright test reset', () => {
  const app = buildApp(undefined, { enableTestReset: true });
  afterEach(async () => { await app.inject({ method: 'POST', url: '/test/reset' }); });

  it('restores the deterministic alpha state only when explicitly enabled', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    const quote = (await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/quote', payload: { goodId: 'wood', direction: 'buy', quantity: 1 } })).json();
    await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'wood', direction: 'buy', quantity: 1, marketVersion: quote.marketVersion, idempotencyKey: 'reset-check' } });

    expect((await app.inject({ method: 'POST', url: '/test/reset' })).statusCode).toBe(200);
    const state = (await app.inject({ method: 'GET', url: '/api/state' })).json();
    expect(state.player.gold).toBe(30_000);
    expect(state.fleet.cargo).toEqual({});
    expect(state.cities.find((city: { id: string }) => city.id === 'lambrecht').stock.wood).toBe(200);
  });
});
