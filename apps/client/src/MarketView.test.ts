import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { City, Fleet, Good, MarketQuote, Player, TradeDirection } from '@hanse2go/shared';
import MarketView from './MarketView.vue';

const api = vi.hoisted(() => ({ fetchQuote: vi.fn(), fetchMarketHistory: vi.fn(), submitTrade: vi.fn() }));
const fetchQuote = api.fetchQuote;
const submitTrade = api.submitTrade;

fetchQuote.mockImplementation((cityId: string, goodId: string, direction: TradeDirection, quantity: number): Promise<MarketQuote> => Promise.resolve({
  cityId, goodId, direction, quantity, marketVersion: 1, total: quantity * (direction === 'buy' ? 75 : 68), averageUnitPrice: direction === 'buy' ? 75 : 68,
  minimumUnitPrice: direction === 'buy' ? 75 : 68, maximumUnitPrice: direction === 'buy' ? 75 : 68,
  resultingCityStock: direction === 'buy' ? 200 - quantity : 200 + quantity,
  resultingFleetStock: direction === 'buy' ? 10 + quantity : 10 - quantity,
  resultingGold: 30_000 - quantity * 75,
  remainingCapacity: 50 - quantity,
}));
submitTrade.mockResolvedValue(undefined);

vi.mock('./api.js', () => ({
  ApiRequestError: class ApiRequestError extends Error { code?: string },
  fetchQuote: api.fetchQuote,
  fetchMarketHistory: api.fetchMarketHistory,
  submitTrade: api.submitTrade,
}));
api.fetchMarketHistory.mockResolvedValue([]);

const categories = ['food', 'building_materials', 'crafts', 'clothing', 'household', 'luxury'] as const;
// Die Warennamen kommen aus der Sprachdatei; `wood` steht stellvertretend für die erste Zeile.
const goods: Good[] = Array.from({ length: 22 }, (_, index) => ({ id: index === 0 ? 'wood' : `good-${index}`, category: categories[index % categories.length]!, basePrice: 100, targetStock: 100 }));
const city: City = { id: 'lambrecht', position: { longitude: 8.07, latitude: 49.37, recordedAt: '' }, radiusMeters: 800, population: 1000, prosperity: 24, popularity: 10, hasKontor: false, productionFocus: [], stock: Object.fromEntries(goods.map((good) => [good.id, 200])) };
const fleet: Fleet = { id: 'fleet-alpha', capacity: 60, position: city.position, cargo: { wood: 10 } };
const player: Player = { id: 'player-alpha', name: 'Testkapitän', gold: 30_000, activeFleetId: fleet.id };

function render() { return mount(MarketView, { props: { city, goods, fleet, player } }); }

describe('MarketView', () => {
  it('groups and displays all 22 goods with the server-provided coin indicator', async () => {
    const wrapper = render();
    await flushPromises();

    expect(wrapper.findAll('.good-row')).toHaveLength(22);
    expect(wrapper.text()).toContain('Nahrung');
    expect(wrapper.text()).toContain('Luxuswaren');
    expect(wrapper.get('[aria-label="günstig: eine Bronzemünze"]').text()).toContain('75 G');
  });

  it('requests a fresh offer when the quantity changes and commits only that offer', async () => {
    const wrapper = render();
    await flushPromises();
    await wrapper.get('.good-row').trigger('click');
    await flushPromises();

    const plusTen = wrapper.findAll('button').find((button) => button.text() === '+10');
    await plusTen!.trigger('click');
    await flushPromises();

    expect(wrapper.get('output').text()).toBe('11 t');
    await wrapper.get('.trade').trigger('click');
    await flushPromises();
    expect(submitTrade).toHaveBeenCalledWith('lambrecht', expect.objectContaining({ goodId: 'wood', quantity: 11, direction: 'buy' }));
    expect(wrapper.emitted('traded')).toHaveLength(1);
  });
});
