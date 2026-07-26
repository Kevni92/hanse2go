import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Alpha 5 acceptance diagnostics', () => {
  it('keeps the money and account invariants through 720 deterministic ticks', async () => {
    const app = buildApp(undefined, { enableTestReset: true });
    try {
      const reset = await app.inject({ method: 'POST', url: '/test/reset' });
      expect(reset.statusCode).toBe(200);
      for (let tick = 1; tick <= 720; tick += 1) {
        const response = await app.inject({ method: 'POST', url: '/api/debug/tick', payload: { idempotencyKey: `alpha5-720-${tick}` } });
        expect(response.statusCode, `tick ${tick}: ${response.body}`).toBe(200);
        const state = (await app.inject({ method: 'GET', url: '/api/state' })).json();
        const total = Object.values(state.accounts).reduce((sum: number, account: { totalMoney: number }) => sum + account.totalMoney, 0);
        expect(total, `tick ${tick}: money supply`).toBe(170_717_000);
        for (const account of Object.values(state.accounts) as Array<{ availableMoney: number; reservedMoney: number; totalMoney: number }>) {
          expect(account.availableMoney).toBeGreaterThanOrEqual(0);
          expect(account.reservedMoney).toBeGreaterThanOrEqual(0);
          expect(account.availableMoney + account.reservedMoney).toBe(account.totalMoney);
        }
        for (const orders of Object.values(state.cityWarehouses) as Array<Record<string, { availableUnits: number; reservedUnits: number; totalUnits: number }>>) {
          for (const inventory of Object.values(orders)) {
            expect(inventory.availableUnits).toBeGreaterThanOrEqual(0);
            expect(inventory.reservedUnits).toBeGreaterThanOrEqual(0);
            expect(inventory.availableUnits + inventory.reservedUnits).toBe(inventory.totalUnits);
          }
        }
        for (const orders of Object.values(state.kontorWarehouses) as Array<Record<string, { availableUnits: number; reservedUnits: number; totalUnits: number }>>) {
          for (const inventory of Object.values(orders)) {
            expect(inventory.availableUnits).toBeGreaterThanOrEqual(0);
            expect(inventory.reservedUnits).toBeGreaterThanOrEqual(0);
            expect(inventory.availableUnits + inventory.reservedUnits).toBe(inventory.totalUnits);
          }
        }
        for (const order of state.orders as Array<{ status: string; side: string; reservedMoney: number; reservedGoodsUnits: number }>) {
          if (order.status === 'open' || order.status === 'partially_filled') {
            expect(order.side === 'buy' ? order.reservedMoney : order.reservedGoodsUnits).toBeGreaterThan(0);
          } else {
            expect(order.reservedMoney).toBe(0);
            expect(order.reservedGoodsUnits).toBe(0);
          }
        }
      }
      const finalState = (await app.inject({ method: 'GET', url: '/api/state' })).json();
      expect(finalState.world).toEqual({ tickNumber: 720, simulatedHour: 720 });
      expect(finalState.moneySupply).toBe(170_717_000);
      expect(finalState.orders.length).toBeLessThan(200);
    } finally {
      await app.close();
    }
  }, 120_000);
});
