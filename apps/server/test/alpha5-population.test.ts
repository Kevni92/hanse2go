import { describe, expect, it } from 'vitest';
import { loadGameConfig } from '@hanse2go/config';
import { CityAccessService } from '../src/city-access.js';
import { InMemoryGameRepository } from '../src/game-state.js';
import { MarketService } from '../src/market.js';
import { OrderBookService } from '../src/order-book.js';
import { createBuildingCatalog } from '../src/production.js';
import { ReputationService } from '../src/reputation.js';
import { ConsumptionModel } from '../src/consumption.js';
import { TickService } from '../src/tick.js';

describe('Alpha 5 population settlement', () => {
  it('buys only through a covered population order and consumes the execution', () => {
    const config = loadGameConfig();
    const repository = new InMemoryGameRepository(config);
    const reputation = new ReputationService(config.reputation);
    const access = new CityAccessService(repository);
    const market = new MarketService(repository, access, config.market, reputation);
    const orderBook = new OrderBookService(repository, config.alpha5, reputation);
    const tick = new TickService(repository, reputation, market, createBuildingCatalog(config.buildings, config.alpha3), new ConsumptionModel(config.consumption), config.alpha3, orderBook);

    repository.runTransaction((state) => {
      state.cities.find((city) => city.id === 'lambrecht')!.stock.bread = 80;
      state.cityWarehouses.lambrecht!.bread = { availableUnits: 8_000, reservedUnits: 0, totalUnits: 8_000, inventoryVersion: 1 };
      state.kontorWarehouses.lambrecht!.bread = { availableUnits: 400, reservedUnits: 0, totalUnits: 400, inventoryVersion: 1 };
      state.cityEconomies.lambrecht!.wealth = 40;
    });

    const sell = orderBook.create({ cityId: 'lambrecht', goodId: 'bread', side: 'sell', quantityUnits: 400, limitPriceGoldPerTon: 170, idempotencyKey: 'population-sell' });
    const report = tick.run('population-tick');
    const state = repository.getState();

    expect(report.consumption).toContainEqual({ cityId: 'lambrecht', goodId: 'bread', requested: 4, consumed: 4, remainingStock: 80 });
    expect(state.executions).toContainEqual(expect.objectContaining({ sellOrderId: sell.orderId, quantityUnits: 400, limitPriceGoldPerTon: 170, grossMoney: 68_000, buyerFeeMoney: 340, sellerFeeMoney: 340 }));
    expect(state.orders.find((order) => order.orderId === sell.orderId)?.status).toBe('filled');
    expect(state.cityWarehouses.lambrecht!.bread).toMatchObject({ availableUnits: 8_000, reservedUnits: 0, totalUnits: 8_000 });
    expect(state.ledger.some((entry) => entry.reason === 'population_purchase')).toBe(true);
    expect(state.reputations.find((entry) => entry.cityId === 'lambrecht')?.value).toBe(0);
  });
});
