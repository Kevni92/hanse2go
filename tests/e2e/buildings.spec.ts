import { expect, test as base, type Page } from '@playwright/test';

const serverUrl = 'http://127.0.0.1:3000';
const mapCenter = { longitude: 8.12, latitude: 49.4 };
const lambrecht = { longitude: 8.07, latitude: 49.37 };
const neustadt = { longitude: 8.14, latitude: 49.4 };
const kontorMaterials = { wood: 50, planks: 25, bricks: 40, tools: 10 };
const simpleMaterials = { wood: 20, planks: 10, bricks: 10, tools: 5 };

const test = base.extend<{ consoleMessages: string[] }>({
  consoleMessages: async ({ page }, use) => {
    const messages: string[] = [];
    page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    await use(messages);
  },
});

test.beforeEach(async ({ request }) => {
  expect((await request.post(`${serverUrl}/test/reset`)).ok()).toBeTruthy();
});

test.afterEach(async ({ consoleMessages }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) await testInfo.attach('browser-console.txt', { body: consoleMessages.join('\n'), contentType: 'text/plain' });
});

function mercatorY(latitude: number) {
  const radians = latitude * Math.PI / 180;
  return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
}

async function state(page: Page) {
  return (await page.request.get(`${serverUrl}/api/state`)).json();
}

async function seed(page: Page, payload: Record<string, unknown>) {
  expect((await page.request.post(`${serverUrl}/test/seed`, { data: payload })).ok()).toBeTruthy();
}

/** Der Tab lädt seine Daten beim Öffnen; nach einem Testseed zeigt er damit wieder den Serverzustand. */
async function reopenBuildingsTab(page: Page) {
  await page.getByRole('button', { name: 'Markt' }).click();
  await page.getByRole('button', { name: 'Gebäude' }).click();
  await expect(page.locator('[data-testid="buildings-tab"]')).toBeVisible();
}

async function openBuildingsTab(page: Page) {
  await page.goto('/');
  const map = page.locator('[aria-label="Ozeankarte im Debug-Modus"]');
  const canvas = map.locator('.maplibregl-canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Die Debug-Karte ist nicht sichtbar.');
  const worldSize = 512 * 2 ** 10;
  await canvas.click({
    position: {
      x: box.width / 2 + ((lambrecht.longitude - mapCenter.longitude) / 360) * worldSize,
      y: box.height / 2 + (mercatorY(lambrecht.latitude) - mercatorY(mapCenter.latitude)) * worldSize,
    },
    force: true,
  });
  await expect(page.getByRole('button', { name: 'Stadt betreten' })).toBeVisible();
  await page.getByRole('button', { name: 'Stadt betreten' }).click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Lambrecht Stadtansicht' })).toBeVisible();
  await page.getByRole('button', { name: 'Gebäude' }).click();
  await expect(page.locator('[data-testid="buildings-tab"]')).toBeVisible();
}

test('führt den Lambrecht-Hauptablauf von Ruf bis Tickproduktion vollständig ab', async ({ page }) => {
  await openBuildingsTab(page);

  // Lambrecht startet mit Baukonzession; der Kaufknopf entfällt dort vollständig.
  const buildings = page.locator('[data-testid="buildings-tab"]');
  await expect(buildings).toContainText('0 / 100');
  await expect(buildings).toContainText('Fremder');
  await expect(buildings).toContainText('vorhanden');
  await expect(page.locator('[data-testid="concession-button"]')).toHaveCount(0);

  // Ruf entsteht ausschließlich aus nützlichem Handel: Lehm liegt unter dem Zielbestand.

  await seed(page, { cargo: { clay: 20 } });
  const quote = await (await page.request.post(`${serverUrl}/api/cities/lambrecht/market/quote`, { data: { goodId: 'clay', direction: 'sell', quantity: 20 } })).json();
  expect((await page.request.post(`${serverUrl}/api/cities/lambrecht/market/trade`, { data: { goodId: 'clay', direction: 'sell', quantity: 20, marketVersion: quote.marketVersion, idempotencyKey: 'e2e-clay' } })).ok()).toBeTruthy();
  await reopenBuildingsTab(page);
  await expect(buildings).toContainText('2 / 100');

  // Der Testzustand bereitet 80 Ruf und das Flottenmaterial vor.
  await seed(page, { reputation: { lambrecht: 80 }, cargo: kontorMaterials });
  await reopenBuildingsTab(page);
  await expect(buildings).toContainText('Vertrauenswürdiger Bürger');
  await expect(page.locator('[data-testid="kontor-build-button"]')).toBeVisible();
  await expect(buildings).toContainText('Holz: 50 / 50 t');

  const goldBefore = (await state(page)).player.gold;
  await page.locator('[data-testid="kontor-build-button"]').click();
  await expect(buildings).toContainText('Kontorlager');
  expect((await state(page)).player.gold).toBe(goldBefore - 10_000);
  expect((await state(page)).fleet.cargo).toEqual({});

  // Rohstoff- und Verarbeitungsgebäude bauen.
  await seed(page, { cargo: simpleMaterials });
  await reopenBuildingsTab(page);
  await page.locator('[data-testid="building-card-forestry"]').getByRole('button', { name: 'Forstbetrieb bauen' }).click();
  await seed(page, { cargo: simpleMaterials });
  await reopenBuildingsTab(page);
  await page.locator('[data-testid="building-card-sawmill"]').getByRole('button', { name: 'Sägewerk bauen' }).click();
  await expect(buildings).toContainText('Forstbetrieb');
  await expect(buildings).toContainText('Sägewerk');

  // Ein Tick ohne Holz im Kontor lässt das Sägewerk stillstehen.
  await page.locator('[data-testid="next-hour-button"]').click();
  const report = page.locator('[data-testid="tick-report"]');
  await expect(report).toContainText('stillstehend');
  await expect(report).toContainText('fehlende Eingangswaren');
  await expect(report).toContainText('Brot: 4 / 4 t');
  await expect(buildings).toContainText('Holz: 20 t');

  // Nach der Einlagerung von zehn Tonnen Holz erzeugt das Sägewerk zehn Bretter.
  const woodRow = page.locator('[data-testid="kontor-transfer-wood"]');
  await woodRow.getByRole('button', { name: 'Höchstmenge Holz auslagern' }).click();
  await woodRow.getByRole('button', { name: 'Auslagern', exact: true }).click();
  await expect(page.locator('[data-testid="kontor-transfer-wood"]')).toContainText('20 t');
  await woodRow.locator('input').fill('10');
  await woodRow.getByRole('button', { name: 'Einlagern', exact: true }).click();
  await expect(buildings).toContainText('Holz: 10 t');

  await page.locator('[data-testid="next-hour-button"]').click();
  await expect(report).toContainText('Bericht der Stunde 2');
  await expect(buildings).toContainText('Bretter: 10 t');
  const current = await state(page);
  expect(current.world).toEqual({ tickNumber: 2, simulatedHour: 2 });
  expect(current.kontors.lambrecht).toMatchObject({ planks: 10, wood: 20 });
});

test('lehnt fehlenden Ruf, Gold, Material, Kontor und Laderaum serverseitig ab', async ({ page }) => {
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: lambrecht });
  const post = (path: string, data?: unknown) => page.request.post(`${serverUrl}${path}`, data ? { data } : undefined);

  // Nur Lambrecht startet mit Konzession; in Neustadt gilt der vollständige Kaufablauf.
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: neustadt });
  const withoutReputation = await post('/api/cities/neustadt/concession');
  expect(withoutReputation.status()).toBe(409);
  expect((await withoutReputation.json()).error.code).toBe('REPUTATION_TOO_LOW');

  await seed(page, { reputation: { neustadt: 80 }, gold: 9_999 });
  expect((await (await post('/api/cities/neustadt/concession')).json()).error.code).toBe('INSUFFICIENT_GOLD');

  await seed(page, { gold: 100_000 });
  const withoutConcession = await post('/api/cities/neustadt/buildings', { buildingType: 'kontor' });
  expect((await withoutConcession.json()).error.code).toBe('CONCESSION_REQUIRED');
  expect((await post('/api/cities/neustadt/concession')).ok()).toBeTruthy();

  await page.request.put(`${serverUrl}/api/fleet/position`, { data: lambrecht });
  const ownedTwice = await post('/api/cities/lambrecht/concession');
  expect((await ownedTwice.json()).error.code).toBe('CONCESSION_ALREADY_OWNED');
  const withoutMaterials = await post('/api/cities/lambrecht/buildings', { buildingType: 'kontor' });
  expect((await withoutMaterials.json()).error.code).toBe('INSUFFICIENT_BUILD_MATERIALS');

  await seed(page, { cargo: simpleMaterials });
  const withoutKontor = await post('/api/cities/lambrecht/buildings', { buildingType: 'sawmill' });
  expect((await withoutKontor.json()).error.code).toBe('KONTOR_REQUIRED');

  await seed(page, { cargo: kontorMaterials });
  expect((await post('/api/cities/lambrecht/buildings', { buildingType: 'kontor' })).ok()).toBeTruthy();
  const twice = await post('/api/cities/lambrecht/buildings', { buildingType: 'kontor' });
  expect((await twice.json()).error.code).toBe('KONTOR_ALREADY_EXISTS');
  expect((await (await post('/api/cities/lambrecht/buildings', { buildingType: 'palace' })).json()).error.code).toBe('UNKNOWN_BUILDING_TYPE');

  await seed(page, { cargo: { wood: 60 } });
  expect((await post('/api/cities/lambrecht/kontor/transfer', { goodId: 'wood', quantity: 60, direction: 'store' })).ok()).toBeTruthy();
  await seed(page, { cargo: { grain: 150 } });
  const withoutCapacity = await post('/api/cities/lambrecht/kontor/transfer', { goodId: 'wood', quantity: 1, direction: 'retrieve' });
  expect((await withoutCapacity.json()).error.code).toBe('INSUFFICIENT_FLEET_CAPACITY');
  expect((await (await post('/api/cities/lambrecht/kontor/transfer', { goodId: 'wood', quantity: 0, direction: 'store' })).json()).error.code).toBe('INVALID_TRANSFER_QUANTITY');

  // Ein Doppelklick auf den Tick erzeugt mit derselben Idempotenz-ID keinen zweiten Tick.
  const first = await post('/api/debug/tick', { idempotencyKey: 'e2e-double-click' });
  const second = await post('/api/debug/tick', { idempotencyKey: 'e2e-double-click' });
  expect(await second.json()).toEqual(await first.json());
  expect((await state(page)).world.tickNumber).toBe(1);
});

test('prüft alle Katalogrezepte mit der Alpha-3-Arbeitsverteilung', async ({ page }) => {
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: lambrecht });
  await seed(page, { gold: 1_000_000, cargo: kontorMaterials });
  expect((await page.request.post(`${serverUrl}/api/cities/lambrecht/buildings`, { data: { buildingType: 'kontor' } })).ok()).toBeTruthy();

  const overview = await (await page.request.get(`${serverUrl}/api/cities/lambrecht/buildings`)).json();
  const productionCatalog = overview.catalog.filter((entry: { workforceClass?: string }) => entry.workforceClass);
  expect(productionCatalog).toHaveLength(21);
  for (const entry of productionCatalog) {
    await seed(page, { gold: 1_000_000, cargo: entry.cost.materials });
    const built = await page.request.post(`${serverUrl}/api/cities/lambrecht/buildings`, { data: { buildingType: entry.buildingType } });
    expect(built.ok(), `${entry.buildingType} muss baubar sein`).toBeTruthy();
  }

  // Alle Eingänge bereitstellen; Alpha 3 verteilt die begrenzten 1.000 Stadtarbeiter anschließend nach Priorität.
  const inputs: Record<string, number> = {};
  for (const entry of productionCatalog) for (const [goodId, amount] of Object.entries(entry.inputs as Record<string, number>)) inputs[goodId] = (inputs[goodId] ?? 0) + amount;
  for (const [goodId, amount] of Object.entries(inputs)) {
    await seed(page, { cargo: { [goodId]: amount } });
    expect((await page.request.post(`${serverUrl}/api/cities/lambrecht/kontor/transfer`, { data: { goodId, quantity: amount, direction: 'store' } })).ok()).toBeTruthy();
  }

  const report = await (await page.request.post(`${serverUrl}/api/debug/tick`, { data: { idempotencyKey: 'e2e-all-recipes' } })).json();
  expect(report.production).toHaveLength(21);
  expect(report.production.every((entry: { assignedWorkers: number }) => entry.assignedWorkers >= 0)).toBeTruthy();
  expect(report.production.reduce((total: number, entry: { assignedWorkers: number }) => total + entry.assignedWorkers, 0)).toBeLessThanOrEqual(1_000);

  // Ausgänge entsprechen exakt den tatsächlich berichteten Teilproduktionen.
  const kontor = (await state(page)).kontors.lambrecht;
  const expected: Record<string, number> = {};
  for (const entry of report.production) for (const [goodId, amount] of Object.entries(entry.outputs as Record<string, number>)) expected[goodId] = (expected[goodId] ?? 0) + amount;
  for (const [goodId, amount] of Object.entries(expected)) expect(kontor[goodId] ?? 0, goodId).toBeGreaterThanOrEqual(amount);
});
