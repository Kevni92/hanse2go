import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

vi.mock('./MapCanvas.vue', () => ({ default: { template: '<div data-testid="map" />' } }));

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('shows the map after loading the server-authoritative world state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ player: { id: 'player-alpha', name: 'Testkapitän', gold: 30_000, activeFleetId: 'fleet-alpha' }, fleet: { id: 'fleet-alpha', capacity: 60, cargo: {}, position: {} }, goods: [], cities: [] }) }));

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.html()).toContain('data-testid="map"');
    expect(wrapper.text()).toContain('30.000 G');
    await wrapper.get('[aria-label="Spielerübersicht öffnen"]').trigger('click');
    expect(wrapper.get('[role="dialog"]').text()).toContain('Testkapitän');
  });
});
