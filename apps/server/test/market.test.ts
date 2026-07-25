import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('market API', () => {
  let app = buildApp();
  const positionAt = async (longitude: number, latitude: number) => app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude, latitude } });
  afterEach(async () => { await app.close(); app = buildApp(); });

  it('calculates a profitable wood purchase and sale server-side', async () => {
    await positionAt(8.07, 49.37);
    const buy = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/quote', payload: { goodId: 'wood', direction: 'buy', quantity: 10 } });
    expect(buy.statusCode).toBe(200);
    const buyQuote = buy.json();
    expect(buyQuote.total).toBeGreaterThan(0);
    const bought = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'wood', direction: 'buy', quantity: 10, marketVersion: buyQuote.marketVersion, idempotencyKey: 'buy-wood' } });
    expect(bought.statusCode).toBe(200);
    await positionAt(8.14, 49.4);
    const sell = await app.inject({ method: 'POST', url: '/api/cities/neustadt/market/quote', payload: { goodId: 'wood', direction: 'sell', quantity: 10 } });
    const sellQuote = sell.json();
    expect(sellQuote.total).toBeGreaterThan(buyQuote.total);
    const sold = await app.inject({ method: 'POST', url: '/api/cities/neustadt/market/trade', payload: { goodId: 'wood', direction: 'sell', quantity: 10, marketVersion: sellQuote.marketVersion, idempotencyKey: 'sell-wood' } });
    expect(sold.statusCode).toBe(200);
    const state = (await app.inject({ method: 'GET', url: '/api/state' })).json();
    expect(state.fleet.cargo.wood).toBeUndefined();
    expect(state.player.gold).toBeGreaterThan(30_000);
  });

  it('rejects a stale offer without changing the state and handles retry idempotently', async () => {
    await positionAt(8.07, 49.37);
    const quote = (await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/quote', payload: { goodId: 'wood', direction: 'buy', quantity: 1 } })).json();
    const first = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'wood', direction: 'buy', quantity: 1, marketVersion: quote.marketVersion, idempotencyKey: 'once' } });
    const retry = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'wood', direction: 'buy', quantity: 1, marketVersion: quote.marketVersion, idempotencyKey: 'once' } });
    const stale = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/trade', payload: { goodId: 'wood', direction: 'buy', quantity: 1, marketVersion: quote.marketVersion, idempotencyKey: 'stale' } });
    expect(retry.json()).toEqual(first.json());
    expect(stale.statusCode).toBe(409);
    expect(stale.json()).toMatchObject({ error: { code: 'STALE_OFFER' } });
    expect((await app.inject({ method: 'GET', url: '/api/fleet' })).json().cargo.wood).toBe(1);
  });
});
