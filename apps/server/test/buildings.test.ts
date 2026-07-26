import { afterEach, describe, expect, it } from 'vitest';
import { loadGameConfig } from '@hanse2go/config';
import { buildApp } from '../src/app.js';
import { createBuildingCatalog } from '../src/production.js';

const productionCatalog = createBuildingCatalog(loadGameConfig().buildings).production;

const kontorMaterials = { wood: 50, planks: 25, bricks: 40, tools: 10 };
const simpleMaterials = { wood: 20, planks: 10, bricks: 10, tools: 5 };

/** Regeln aus `docs/alpha-2/buildings-and-construction.md` und `docs/alpha-2/building-catalog.md`. */
describe('building API', () => {
  let app = buildApp(undefined, { enableTestReset: true });
  afterEach(async () => { await app.close(); app = buildApp(undefined, { enableTestReset: true }); });

  const seed = (payload: Record<string, unknown>) => app.inject({ method: 'POST', url: '/test/seed', payload });
  const build = (buildingType: string, cityId = 'lambrecht') => app.inject({ method: 'POST', url: `/api/cities/${cityId}/buildings`, payload: { buildingType } });
  const overview = async (cityId = 'lambrecht') => (await app.inject({ method: 'GET', url: `/api/cities/${cityId}/buildings` })).json();
  const player = async () => (await app.inject({ method: 'GET', url: '/api/player' })).json();
  const fleet = async () => (await app.inject({ method: 'GET', url: '/api/fleet' })).json();

  const prepare = async (extra: Record<string, number> = {}) => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    await seed({ reputation: { lambrecht: 80 }, gold: 100_000, cargo: { ...kontorMaterials, ...extra } });
    expect((await app.inject({ method: 'POST', url: '/api/cities/lambrecht/concession' })).statusCode).toBe(200);
  };

  it('publishes the full catalog with land price, class costs and recipes', async () => {
    await prepare();
    const current = await overview();
    expect(current.catalog).toHaveLength(21);
    expect(current.kontor).toMatchObject({ buildingType: 'kontor', cost: { landGold: 5_000, buildGold: 5_000, totalGold: 10_000, materials: kontorMaterials } });
    expect(current.catalog.find((entry: { buildingType: string }) => entry.buildingType === 'sawmill')).toMatchObject({
      name: 'Sägewerk', kind: 'processing', buildingClass: 'einfach',
      cost: { landGold: 5_000, buildGold: 2_500, totalGold: 7_500, materials: simpleMaterials },
      inputs: { wood: 10 }, outputs: { planks: 10 },
    });
    expect(current.catalog.find((entry: { buildingType: string }) => entry.buildingType === 'smithy')).toMatchObject({
      buildingClass: 'hochwertig', cost: { buildGold: 7_500, totalGold: 12_500, materials: { wood: 40, planks: 30, bricks: 30, tools: 20 } },
      inputs: { iron: 10, charcoal: 10 }, outputs: { tools: 10 },
    });
  });

  it('covers all 22 goods with exactly one producing building type', async () => {
    const produced = productionCatalog.flatMap((entry) => Object.keys(entry.outputs));
    const goods = (await app.inject({ method: 'GET', url: '/api/goods' })).json().map((good: { id: string }) => good.id);
    expect(new Set(produced)).toEqual(new Set(goods));
    for (const entry of productionCatalog) {
      expect(Object.keys(entry.outputs).length).toBeGreaterThan(0);
      // Rohstoffgebäude haben keine Wareninputs, alle übrigen sind Verarbeitung.
      if (entry.kind === 'raw') expect(entry.inputs).toEqual({});
      else expect(Object.keys(entry.inputs).length).toBeGreaterThan(0);
      for (const input of Object.keys(entry.inputs)) expect(goods).toContain(input);
      for (const amount of [...Object.values(entry.inputs), ...Object.values(entry.outputs)]) expect(Number.isInteger(amount) && amount > 0).toBe(true);
    }
  });

  it('requires a concession before any building', async () => {
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.07, latitude: 49.37 } });
    await seed({ cargo: kontorMaterials });
    const response = await build('kontor');
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: { code: 'CONCESSION_REQUIRED' } });
    expect((await overview()).kontor).toMatchObject({ availability: 'requirements_missing', missingRequirements: ['concession'] });
  });

  it('requires the kontor before any production building and allows it only once', async () => {
    await prepare({ ...simpleMaterials });
    const early = await build('sawmill');
    expect(early.statusCode).toBe(409);
    expect(early.json()).toMatchObject({ error: { code: 'KONTOR_REQUIRED' } });

    await seed({ cargo: kontorMaterials });
    expect((await build('kontor')).statusCode).toBe(200);
    await seed({ cargo: kontorMaterials });
    const twice = await build('kontor');
    expect(twice.statusCode).toBe(409);
    expect(twice.json()).toMatchObject({ error: { code: 'KONTOR_ALREADY_EXISTS' } });
    expect((await overview()).kontor).toMatchObject({ availability: 'requirements_missing', missingRequirements: ['kontor_already_exists'] });
  });

  it('books gold and materials from the player and the active fleet only', async () => {
    await prepare({ grain: 5 });
    const goldBefore = (await player()).gold;
    expect((await build('kontor')).statusCode).toBe(200);

    expect((await player()).gold).toBe(goldBefore - 10_000);
    expect((await fleet()).cargo).toEqual({ grain: 5 });
    const current = await overview();
    expect(current.hasKontor).toBe(true);
    expect(current.kontorInventory).toEqual({});
    expect(current.buildings).toHaveLength(1);
    expect(current.buildings[0]).toMatchObject({ buildingType: 'kontor', cityId: 'lambrecht', playerId: 'player-alpha', status: 'built' });
    // Der Alpha-1-Stadtwert `Kontor` zeigt ab Alpha 2 das eigene Kontor des Spielers.
    expect((await app.inject({ method: 'GET', url: '/api/cities/lambrecht' })).json().city.hasKontor).toBe(true);
  });

  it('rejects missing gold and missing materials without changing any stock', async () => {
    await prepare();
    await seed({ gold: 9_999, cargo: kontorMaterials });
    const poor = await build('kontor');
    expect(poor.statusCode).toBe(409);
    expect(poor.json()).toMatchObject({ error: { code: 'INSUFFICIENT_GOLD', details: { required: 10_000 } } });

    await seed({ gold: 100_000, cargo: { wood: 50, planks: 25, bricks: 39, tools: 10 } });
    const withoutBricks = await build('kontor');
    expect(withoutBricks.statusCode).toBe(409);
    expect(withoutBricks.json()).toMatchObject({ error: { code: 'INSUFFICIENT_BUILD_MATERIALS', details: { missingMaterials: { bricks: 1 } } } });
    expect((await player()).gold).toBe(100_000);
    expect((await fleet()).cargo).toEqual({ wood: 50, planks: 25, bricks: 39, tools: 10 });
    expect((await overview()).buildings).toHaveLength(0);
  });

  it('rejects an unknown building type', async () => {
    await prepare();
    const response = await build('townhall');
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: { code: 'UNKNOWN_BUILDING_TYPE' } });
  });

  it('allows several instances of the same production building', async () => {
    await prepare();
    expect((await build('kontor')).statusCode).toBe(200);
    for (const attempt of [1, 2]) {
      await seed({ cargo: simpleMaterials });
      const response = await build('forestry');
      expect(response.statusCode).toBe(200);
      expect(response.json().buildings.filter((building: { buildingType: string }) => building.buildingType === 'forestry')).toHaveLength(attempt);
    }
    const ids = (await overview()).buildings.map((building: { id: string }) => building.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reports buildable and requirements_missing offers with the missing values', async () => {
    await prepare();
    expect((await build('kontor')).statusCode).toBe(200);
    await seed({ gold: 7_499, cargo: { wood: 20, planks: 10 } });
    const offer = (await overview()).catalog.find((entry: { buildingType: string }) => entry.buildingType === 'forestry');
    expect(offer).toMatchObject({ availability: 'requirements_missing', missingGold: 1, missingMaterials: { bricks: 10, tools: 5 } });
    expect(offer.missingRequirements).toEqual(['gold', 'materials']);

    await seed({ gold: 100_000, cargo: simpleMaterials });
    expect((await overview()).catalog.find((entry: { buildingType: string }) => entry.buildingType === 'forestry')).toMatchObject({ availability: 'buildable', missingRequirements: [], missingGold: 0, missingMaterials: {} });
  });

  it('keeps buildings and kontor stock separate per city', async () => {
    await prepare();
    expect((await build('kontor')).statusCode).toBe(200);
    await app.inject({ method: 'PUT', url: '/api/fleet/position', payload: { longitude: 8.14, latitude: 49.4 } });
    const neustadt = await overview('neustadt');
    expect(neustadt).toMatchObject({ hasConcession: false, hasKontor: false, buildings: [] });
    const blocked = await build('kontor', 'neustadt');
    expect(blocked.json()).toMatchObject({ error: { code: 'CONCESSION_REQUIRED' } });
  });
});
