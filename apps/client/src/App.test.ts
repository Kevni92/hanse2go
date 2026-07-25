import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

vi.mock('./MapCanvas.vue', () => ({ default: { template: '<div data-testid="map" />' } }));

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('shows the map after loading the server-authoritative world state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ player: {}, fleet: { position: {} }, goods: [], cities: [] }) }));

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.html()).toContain('data-testid="map"');
  });
});
