import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Fleet, Good, Player } from '@hanse2go/shared';
import PlayerHud from './PlayerHud.vue';

const goods: Good[] = [{ id: 'wood', category: 'building_materials', basePrice: 80, targetStock: 100 }];
const fleet: Fleet = { id: 'fleet-alpha', capacity: 60, cargo: { wood: 10 }, position: { longitude: 8.07, latitude: 49.37, recordedAt: '' } };
const player: Player = { id: 'player-alpha', name: 'Testkapitän', gold: 30_000, activeFleetId: fleet.id };

describe('PlayerHud', () => {
  it('shows capacity, free space, and loaded goods for the fixed alpha fleet', () => {
    const wrapper = mount(PlayerHud, { props: { player, fleet, goods, view: 'fleet' } });

    expect(wrapper.text()).toContain('60 t');
    expect(wrapper.text()).toContain('10 t');
    expect(wrapper.text()).toContain('50 t');
    expect(wrapper.text()).toContain('Holz');
  });
});
