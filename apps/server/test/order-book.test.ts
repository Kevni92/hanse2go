import { loadGameConfig } from '@hanse2go/config';
import { describe, expect, it } from 'vitest';
import { CITY_ACCOUNT, PLAYER_ACCOUNT } from '../src/money.js';
import { InMemoryGameRepository } from '../src/game-state.js';
import { OrderBookService } from '../src/order-book.js';

describe('Alpha 5 orderbook domain', () => {
  it('matches by price/time, moves goods and books both fees without changing money supply', () => {
    const repository = new InMemoryGameRepository(loadGameConfig());
    const service = new OrderBookService(repository, loadGameConfig().alpha5);
    const sell = service.create({ cityId: 'lambrecht', goodId: 'wood', side: 'sell', priceMoneyPerUnit: 100, quantityUnits: 100, ownerType: 'city', ownerId: 'lambrecht', idempotencyKey: 'sell-1' });
    const buy = service.create({ cityId: 'lambrecht', goodId: 'wood', side: 'buy', priceMoneyPerUnit: 120, quantityUnits: 100, idempotencyKey: 'buy-1' });
    const state = repository.getState();

    expect(state.orders.find((order) => order.orderId === sell.orderId)?.status).toBe('filled');
    expect(state.orders.find((order) => order.orderId === buy.orderId)?.status).toBe('filled');
    expect(state.executions).toHaveLength(1);
    expect(state.executions[0]).toMatchObject({ quantityUnits: 100, grossMoney: 10_000, buyerFeeMoney: 50, sellerFeeMoney: 50 });
    expect(state.kontorWarehouses.lambrecht!.wood!.availableUnits).toBe(100);
    expect(state.cityWarehouses.lambrecht!.wood!.totalUnits).toBeGreaterThan(0);
    expect(state.accounts[PLAYER_ACCOUNT('player-alpha')]!.totalMoney).toBe(10_000_000 - 10_050);
    expect(state.accounts[CITY_ACCOUNT('lambrecht')]!.totalMoney).toBe(20_490_000 + 10_050);
    expect(state.moneySupply).toBe(170_717_000);
    expect(state.ledger.filter((entry) => entry.referenceType === 'order_execution')).toHaveLength(2);
  });

  it('keeps an unmatched order reserved, supports idempotent replay, and releases the reservation on cancel', () => {
    const repository = new InMemoryGameRepository(loadGameConfig());
    const service = new OrderBookService(repository, loadGameConfig().alpha5);
    repository.runTransaction((state) => {
      const inventory = state.kontorWarehouses.lambrecht!.wood!;
      inventory.availableUnits = 20;
      inventory.totalUnits = 20;
    });
    const order = service.create({ cityId: 'lambrecht', goodId: 'wood', side: 'sell', priceMoneyPerUnit: 100, quantityUnits: 20, idempotencyKey: 'sell-replay' });
    expect(service.create({ cityId: 'lambrecht', goodId: 'wood', side: 'sell', priceMoneyPerUnit: 100, quantityUnits: 20, idempotencyKey: 'sell-replay' }).orderId).toBe(order.orderId);
    expect(repository.getState().kontorWarehouses.lambrecht!.wood).toMatchObject({ availableUnits: 0, reservedUnits: 20, totalUnits: 20 });

    const cancelled = service.cancel({ orderId: order.orderId, orderVersion: order.orderVersion, idempotencyKey: 'cancel-replay' });
    expect(cancelled.status).toBe('cancelled');
    expect(repository.getState().kontorWarehouses.lambrecht!.wood).toMatchObject({ availableUnits: 20, reservedUnits: 0, totalUnits: 20 });
    expect(repository.getState().moneySupply).toBe(170_717_000);
  });

  it('partially fills and replaces an order atomically', () => {
    const repository = new InMemoryGameRepository(loadGameConfig());
    const service = new OrderBookService(repository, loadGameConfig().alpha5);
    repository.runTransaction((state) => {
      const inventory = state.kontorWarehouses.lambrecht!.wood!;
      inventory.availableUnits = 20;
      inventory.totalUnits = 20;
    });
    const sell = service.create({ cityId: 'lambrecht', goodId: 'wood', side: 'sell', priceMoneyPerUnit: 100, quantityUnits: 20, idempotencyKey: 'partial-sell' });
    service.create({ cityId: 'lambrecht', goodId: 'wood', side: 'buy', priceMoneyPerUnit: 100, quantityUnits: 10, ownerType: 'city', ownerId: 'lambrecht', idempotencyKey: 'partial-buy' });
    expect(repository.getState().orders.find((order) => order.orderId === sell.orderId)?.status).toBe('partially_filled');

    const replacement = service.replace({ orderId: sell.orderId, orderVersion: 2, priceMoneyPerUnit: 90, quantityUnits: 5, idempotencyKey: 'replace-1' });
    expect(replacement.replacesOrderId).toBe(sell.orderId);
    expect(repository.getState().orders.find((order) => order.orderId === sell.orderId)?.status).toBe('replaced');
    expect(repository.getState().kontorWarehouses.lambrecht!.wood).toMatchObject({ availableUnits: 5, reservedUnits: 5, totalUnits: 10 });
  });
});
