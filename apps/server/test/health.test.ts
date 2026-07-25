import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('GET /health', () => {
  let app = buildApp();
  afterEach(async () => { await app.close(); app = buildApp(); });

  it('reports the server health using the shared contract', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', service: 'hanse2go-server' });
  });

  it('initializes the documented deterministic Alpha state', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/state' });
    const state = response.json();
    expect(response.statusCode).toBe(200);
    expect(state.player).toMatchObject({ id: 'player-alpha', gold: 30_000 });
    expect(state.fleet).toMatchObject({ id: 'fleet-alpha', capacity: 60, cargo: {} });
    expect(state.goods).toHaveLength(22);
    expect(state.cities).toHaveLength(3);
    expect(state.cities.find((city: { id: string }) => city.id === 'lambrecht').stock.wood).toBe(200);
  });
});
