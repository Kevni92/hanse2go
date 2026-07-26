import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Alpha 4 harbor API', () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
  it('buys the concrete ship without creating another one', async () => {
    const app = buildApp(undefined, { enableTestReset: true }); apps.push(app);
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    const harbor = await app.inject({ method: 'GET', url: '/api/cities/lambrecht/harbor' });
    const before = (await app.inject({ method: 'GET', url: '/api/state' })).json().ships.length;
    const bought = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/ships/ship-market-lambrecht-01/buy', payload: { shipMarketVersion: harbor.json().marketVersion, idempotencyKey: 'buy-waldwind' } });
    expect(bought.statusCode).toBe(200);
    expect(bought.json().ships.find((ship: { shipId: string }) => ship.shipId === 'ship-market-lambrecht-01').ownerId).toBe('player-alpha');
    expect((await app.inject({ method: 'GET', url: '/api/state' })).json().ships.length).toBe(before);
  });
});
