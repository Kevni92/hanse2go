import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { City, Fleet, Good, Player } from '@hanse2go/shared';
import MarketView from './MarketView.vue';

const api = vi.hoisted(() => ({ fetchOrderBook: vi.fn(), fetchPlayerOrders: vi.fn(), fetchTreasury: vi.fn(), createOrder: vi.fn(), cancelOrder: vi.fn(), replaceOrder: vi.fn() }));
vi.mock('./api.js', () => ({ ApiRequestError: class ApiRequestError extends Error { code?: string }, ...api }));
api.fetchOrderBook.mockResolvedValue({ cityId: 'lambrecht', goodId: 'wood', version: 1, bids: [], asks: [], recentExecutions: [] });
api.fetchPlayerOrders.mockResolvedValue([]);
api.fetchTreasury.mockResolvedValue({ cityAccount: { availableMoney: 20_490_000, reservedMoney: 0, totalMoney: 20_490_000 }, populationAccount: { availableMoney: 9_792_000, reservedMoney: 0, totalMoney: 9_792_000 } });
api.createOrder.mockResolvedValue({ order: { orderId: 'order-1', status: 'open', orderVersion: 1 }, executions: [], orderBookVersion: 2, account: {}, inventory: {}, treasury: {} });

const categories = ['food', 'building_materials', 'crafts', 'clothing', 'household', 'luxury'] as const;
const goods: Good[] = Array.from({ length: 22 }, (_, index) => ({ id: index === 0 ? 'wood' : `good-${index}`, category: categories[index % categories.length]!, basePrice: 100, targetStock: 100 }));
const city: City = { id: 'lambrecht', position: { longitude: 8.07, latitude: 49.37, recordedAt: '' }, radiusMeters: 800, population: 1000, prosperity: 24, popularity: 10, hasKontor: false, productionFocus: [], stock: Object.fromEntries(goods.map((good) => [good.id, 200])) };
const fleet: Fleet = { id: 'fleet-alpha', capacity: 60, position: city.position, cargo: { wood: 10 } };
const player: Player = { id: 'player-alpha', name: 'Testkapitän', gold: 30_000, activeFleetId: fleet.id };

function render() { return mount(MarketView, { props: { city, goods, fleet, player } }); }

describe('MarketView', () => {
  it('groups and displays all configured goods', async () => {
    const wrapper = render();
    await flushPromises();
    expect(wrapper.findAll('.good-row')).toHaveLength(22);
    expect(wrapper.text()).toContain('Nahrung');
    expect(wrapper.text()).toContain('Luxuswaren');
  });

  it('loads a book and submits a limit order with the selected price and units', async () => {
    const wrapper = render();
    await flushPromises();
    await wrapper.get('.good-row').trigger('click');
    await flushPromises();
    await wrapper.get('#order-quantity').setValue(125);
    await wrapper.get('#order-price').setValue(80);
    await wrapper.get('.order-form').trigger('submit');
    await flushPromises();
    expect(api.createOrder).toHaveBeenCalledWith('lambrecht', expect.objectContaining({ goodId: 'wood', side: 'buy', quantityUnits: 125, limitPriceGoldPerTon: 80 }));
    expect(wrapper.emitted('traded')).toHaveLength(1);
  });
});
