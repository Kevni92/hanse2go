import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('shows an online status after the server confirms health', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok', service: 'hanse2go-server' }) }));

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.get('[role="status"]').text()).toContain('erreichbar');
  });
});
