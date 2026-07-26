import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildingOffer, City, CityBuildingsOverview, Good } from '@hanse2go/shared';
import BuildingsView from './BuildingsView.vue';

const api = vi.hoisted(() => ({ fetchBuildings: vi.fn(), buyConcession: vi.fn(), buildBuilding: vi.fn(), transferKontorGoods: vi.fn(), simulateNextHour: vi.fn() }));
vi.mock('./api.js', () => ({
  ApiRequestError: class ApiRequestError extends Error { constructor(public code?: string, message = 'Fehler') { super(message); } },
  fetchBuildings: api.fetchBuildings, buyConcession: api.buyConcession, buildBuilding: api.buildBuilding,
  transferKontorGoods: api.transferKontorGoods, simulateNextHour: api.simulateNextHour,
}));

const goods: Good[] = [
  { id: 'wood', name: 'Holz', category: 'Baustoffe', basePrice: 80, targetStock: 100 },
  { id: 'planks', name: 'Bretter', category: 'Baustoffe', basePrice: 130, targetStock: 80 },
  { id: 'bread', name: 'Brot', category: 'Nahrung', basePrice: 190, targetStock: 80 },
];
const city: City = { id: 'lambrecht', name: 'Lambrecht', position: { longitude: 8.07, latitude: 49.37, recordedAt: '' }, radiusMeters: 800, population: 1_000, prosperity: 24, popularity: 10, hasKontor: false, productionFocus: [], stock: { wood: 200 } };

const offer = (buildingType: string, extra: Partial<BuildingOffer> = {}): BuildingOffer => ({
  buildingType, name: buildingType === 'kontor' ? 'Kontor' : 'Sägewerk', kind: buildingType === 'kontor' ? 'kontor' : 'processing',
  buildingClass: buildingType === 'kontor' ? undefined : 'einfach',
  cost: { landGold: 5_000, buildGold: buildingType === 'kontor' ? 5_000 : 2_500, totalGold: buildingType === 'kontor' ? 10_000 : 7_500, materials: { wood: 20, planks: 10 } },
  inputs: buildingType === 'kontor' ? {} : { wood: 10 }, outputs: buildingType === 'kontor' ? {} : { planks: 10 },
  availability: 'buildable', missingRequirements: [], missingGold: 0, missingMaterials: {}, ...extra,
});

const overview = (extra: Partial<CityBuildingsOverview> = {}): CityBuildingsOverview => ({
  cityId: 'lambrecht', reputation: { cityId: 'lambrecht', value: 0, status: 'Fremder' },
  hasConcession: false, concessionPrice: 10_000, hasKontor: false, kontorInventory: {},
  kontor: offer('kontor'), buildings: [], catalog: [offer('sawmill')],
  world: { tickNumber: 0, simulatedHour: 0 },
  player: { id: 'player-alpha', name: 'Testkapitän', gold: 100_000, activeFleetId: 'fleet-alpha' },
  fleet: { id: 'fleet-alpha', capacity: 150, cargo: {}, position: city.position },
  ...extra,
});

function render() { return mount(BuildingsView, { props: { city, goods } }); }

beforeEach(() => { for (const mock of Object.values(api)) mock.mockReset(); });

describe('BuildingsView', () => {
  it('shows reputation, missing reputation and a locked concession button below eighty', async () => {
    api.fetchBuildings.mockResolvedValue(overview({ reputation: { cityId: 'lambrecht', value: 35, status: 'Bekannter Händler' } }));
    const wrapper = render();
    await flushPromises();

    expect(wrapper.get('[data-testid="buildings-tab"]').text()).toContain('Bekannter Händler');
    expect(wrapper.text()).toContain('35 / 100');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('10.000 Gold');
    expect(wrapper.get('[data-testid="concession-button"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="kontor-build-button"]').exists()).toBe(false);
  });

  it('enables the concession button at eighty reputation and enough gold', async () => {
    api.fetchBuildings.mockResolvedValue(overview({ reputation: { cityId: 'lambrecht', value: 80, status: 'Vertrauenswürdiger Bürger' } }));
    api.buyConcession.mockResolvedValue(overview({ reputation: { cityId: 'lambrecht', value: 80, status: 'Vertrauenswürdiger Bürger' }, hasConcession: true }));
    const wrapper = render();
    await flushPromises();

    const button = wrapper.get('[data-testid="concession-button"]');
    expect(button.attributes('disabled')).toBeUndefined();
    await button.trigger('click');
    await flushPromises();
    expect(api.buyConcession).toHaveBeenCalledWith('lambrecht');
    expect(wrapper.emitted('changed')).toHaveLength(1);
    expect(wrapper.find('[data-testid="kontor-build-button"]').exists()).toBe(true);
  });

  it('locks the concession button without enough gold', async () => {
    api.fetchBuildings.mockResolvedValue(overview({
      reputation: { cityId: 'lambrecht', value: 80, status: 'Vertrauenswürdiger Bürger' },
      player: { id: 'player-alpha', name: 'Testkapitän', gold: 9_999, activeFleetId: 'fleet-alpha' },
    }));
    const wrapper = render();
    await flushPromises();
    expect(wrapper.get('[data-testid="concession-button"]').attributes('disabled')).toBeDefined();
  });

  it('shows only the kontor costs and missing materials before the kontor exists', async () => {
    api.fetchBuildings.mockResolvedValue(overview({ hasConcession: true, kontor: offer('kontor', { availability: 'requirements_missing', missingRequirements: ['materials'], missingMaterials: { planks: 4 } }) }));
    const wrapper = render();
    await flushPromises();

    expect(wrapper.text()).toContain('Bretter: 0 / 10 t');
    expect(wrapper.text()).toContain('es fehlen 4 t');
    expect(wrapper.get('[data-testid="kontor-build-button"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="building-card-sawmill"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="kontor-transfer-wood"]').exists()).toBe(false);
  });

  it('builds the kontor and then offers inventory, own buildings and the catalog', async () => {
    api.fetchBuildings.mockResolvedValue(overview({ hasConcession: true }));
    api.buildBuilding.mockResolvedValue(overview({
      hasConcession: true, hasKontor: true, kontorInventory: { wood: 30 },
      buildings: [{ id: 'lambrecht-kontor-1', playerId: 'player-alpha', cityId: 'lambrecht', buildingType: 'kontor', name: 'Kontor', kind: 'kontor', status: 'built', lastInputs: {}, lastOutputs: {} }],
    }));
    const wrapper = render();
    await flushPromises();

    await wrapper.get('[data-testid="kontor-build-button"]').trigger('click');
    await flushPromises();

    expect(api.buildBuilding).toHaveBeenCalledWith('lambrecht', 'kontor');
    expect(wrapper.text()).toContain('Holz: 30 t');
    expect(wrapper.text()).toContain('Kontor');
    const card = wrapper.get('[data-testid="building-card-sawmill"]');
    expect(card.text()).toContain('5.000 Gold Grundstück');
    expect(card.text()).toContain('7.500 Gold');
    expect(card.text()).toContain('10 t Holz → 10 t Bretter');
    expect(card.get('button').attributes('disabled')).toBeUndefined();
  });

  it('marks a catalog entry with missing requirements and keeps its build button locked', async () => {
    api.fetchBuildings.mockResolvedValue(overview({
      hasConcession: true, hasKontor: true,
      catalog: [offer('sawmill', { availability: 'requirements_missing', missingRequirements: ['materials'], missingMaterials: { wood: 20 } })],
    }));
    const wrapper = render();
    await flushPromises();

    const card = wrapper.get('[data-testid="building-card-sawmill"]');
    expect(card.text()).toContain('Baumaterialien fehlen');
    expect(card.text()).toContain('20 t Holz');
    expect(card.get('button').attributes('disabled')).toBeDefined();
  });

  it('transfers goods with a server-confirmed maximum in both directions', async () => {
    api.fetchBuildings.mockResolvedValue(overview({
      hasConcession: true, hasKontor: true, kontorInventory: { planks: 12 },
      fleet: { id: 'fleet-alpha', capacity: 150, cargo: { wood: 25 }, position: city.position },
    }));
    api.transferKontorGoods.mockResolvedValue(overview({ hasConcession: true, hasKontor: true, kontorInventory: { wood: 25, planks: 12 } }));
    const wrapper = render();
    await flushPromises();

    const row = wrapper.get('[data-testid="kontor-transfer-wood"]');
    await row.get('[aria-label="Höchstmenge Holz einlagern"]').trigger('click');
    expect((row.get('input').element as HTMLInputElement).value).toBe('25');
    await row.findAll('button').find((button) => button.text() === 'Einlagern')!.trigger('click');
    await flushPromises();
    expect(api.transferKontorGoods).toHaveBeenCalledWith('lambrecht', 'wood', 25, 'store');

    const planks = wrapper.get('[data-testid="kontor-transfer-planks"]');
    await planks.get('[aria-label="Höchstmenge Bretter auslagern"]').trigger('click');
    await planks.findAll('button').find((button) => button.text() === 'Auslagern')!.trigger('click');
    await flushPromises();
    expect(api.transferKontorGoods).toHaveBeenLastCalledWith('lambrecht', 'planks', 12, 'retrieve');
  });

  it('shows the server error of a rejected transfer and reloads the confirmed state', async () => {
    api.fetchBuildings.mockResolvedValue(overview({ hasConcession: true, hasKontor: true, fleet: { id: 'fleet-alpha', capacity: 150, cargo: { wood: 5 }, position: city.position } }));
    const { ApiRequestError } = await import('./api.js');
    api.transferKontorGoods.mockRejectedValue(new ApiRequestError('INSUFFICIENT_FLEET_GOODS', 'Die Flotte besitzt nicht genug von dieser Ware.'));
    const wrapper = render();
    await flushPromises();

    await wrapper.get('[data-testid="kontor-transfer-wood"]').findAll('button').find((button) => button.text() === 'Einlagern')!.trigger('click');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('nicht genug');
    expect(api.fetchBuildings).toHaveBeenCalledTimes(2);
  });

  it('locks the tick button while the hour is simulated and shows the report', async () => {
    api.fetchBuildings.mockResolvedValue(overview({ hasConcession: true, hasKontor: true }));
    let release = (): void => {};
    api.simulateNextHour.mockReturnValue(new Promise((resolve) => { release = () => resolve({
      tickNumber: 1, simulatedHour: 1,
      production: [{ buildingId: 'lambrecht-sawmill-1', buildingType: 'sawmill', cityId: 'lambrecht', status: 'stalled', reason: 'missing_inputs', inputs: {}, outputs: {} }],
      consumption: [{ cityId: 'lambrecht', goodId: 'bread', requested: 4, consumed: 3, remainingStock: 0 }],
    }); }));
    const wrapper = render();
    await flushPromises();

    const button = wrapper.get('[data-testid="next-hour-button"]');
    expect(wrapper.find('[data-testid="tick-report"]').exists()).toBe(false);
    await button.trigger('click');
    expect(button.attributes('disabled')).toBeDefined();

    release();
    await flushPromises();
    const report = wrapper.get('[data-testid="tick-report"]');
    expect(report.text()).toContain('stillstehend');
    expect(report.text()).toContain('fehlende Eingangswaren');
    expect(report.text()).toContain('Brot: 3 / 4 t · Fehlmenge 1 t');
    expect(button.attributes('disabled')).toBeUndefined();
    expect(wrapper.emitted('changed')).toHaveLength(1);
  });
});
