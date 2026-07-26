import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Alpha 5 orderbook API', () => {
  let app = buildApp();
  afterEach(async () => { await app.close(); app = buildApp(); });

  it('creates a covered limit order, exposes the book and cancels it by version', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    const created = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/orders', payload: { goodId: 'wood', side: 'buy', quantityUnits: 100, limitPriceGoldPerTon: 100, idempotencyKey: 'api-buy-1' } });
    expect(created.statusCode).toBe(200);
    expect(created.json()).toMatchObject({ order: { side: 'buy', status: 'open', remainingQuantityUnits: 100, reservedMoney: 10_050 } });

    const replay = await app.inject({ method: 'POST', url: '/api/cities/lambrecht/market/orders', payload: { goodId: 'wood', side: 'buy', quantityUnits: 100, limitPriceGoldPerTon: 100, idempotencyKey: 'api-buy-1' } });
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toEqual(created.json());
    expect((await app.inject({ method: 'GET', url: '/api/cities/lambrecht/market/wood/order-book' })).json().bids).toMatchObject([{ limitPriceGoldPerTon: 100, quantityUnits: 100 }]);
    expect((await app.inject({ method: 'GET', url: '/api/player/orders' })).json()).toHaveLength(1);

    const cancelled = await app.inject({ method: 'DELETE', url: `/api/cities/lambrecht/market/orders/${created.json().order.orderId}`, payload: { orderVersion: created.json().order.orderVersion, idempotencyKey: 'api-cancel-1' } });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().order.status).toBe('cancelled');
    expect((await app.inject({ method: 'GET', url: '/api/cities/lambrecht/treasury' })).statusCode).toBe(200);
  });
});
