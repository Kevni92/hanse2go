import { expect, test as base, type Page } from '@playwright/test';

const serverUrl = 'http://127.0.0.1:3000';
const mapCenter = { longitude: 8.12, latitude: 49.4 };
const cities = { lambrecht: { longitude: 8.07, latitude: 49.37 }, neustadt: { longitude: 8.14, latitude: 49.4 } };

const test = base.extend<{ consoleMessages: string[] }>({
  consoleMessages: async ({ page }, use) => {
    const messages: string[] = [];
    page.on('console', (message) => messages.push(`${message.type()}: ${message.text()}`));
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
    await use(messages);
  },
});

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${serverUrl}/test/reset`);
  expect(response.ok()).toBeTruthy();
});

test.afterEach(async ({ consoleMessages }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) await testInfo.attach('browser-console.txt', { body: consoleMessages.join('\n'), contentType: 'text/plain' });
});

function mercatorY(latitude: number) {
  const radians = latitude * Math.PI / 180;
  return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2;
}

async function moveByDebugClick(page: Page, target: { longitude: number; latitude: number }) {
  const map = page.locator('[aria-label="Ozeankarte im Debug-Modus"]');
  const canvas = map.locator('.maplibregl-canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Die Debug-Karte ist nicht sichtbar.');
  const worldSize = 512 * 2 ** 10;
  const x = box.width / 2 + ((target.longitude - mapCenter.longitude) / 360) * worldSize;
  const y = box.height / 2 + (mercatorY(target.latitude) - mercatorY(mapCenter.latitude)) * worldSize;
  await canvas.click({ position: { x, y }, force: true });
  await expect.poll(async () => (await state(page)).fleet.position.longitude).toBeCloseTo(target.longitude, 3);
  await expect(page.getByRole('button', { name: 'Stadt betreten' })).toBeVisible();
}

async function openLambrecht(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Spielerübersicht öffnen' })).toContainText('100.000 G');
  await moveByDebugClick(page, cities.lambrecht);
  await page.getByRole('button', { name: 'Stadt betreten' }).click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Lambrecht Stadtansicht' })).toBeVisible();
}

async function openMarketGood(page: Page, name: string) {
  await page.getByRole('button', { name: 'Markt' }).click();
  await page.getByRole('button', { name: new RegExp(name) }).first().click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

async function state(page: Page) {
  const response = await page.request.get(`${serverUrl}/api/state`);
  return response.json();
}

test('legt eine gedeckte Limitorder an und gibt sie atomar wieder frei', async ({ page }) => {
  await openLambrecht(page);
  await expect(page.getByText('1.000')).toBeVisible();
  await expect(page.getByText(/24 · einfach/)).toBeVisible();
  await expect(page.getByText('10 %')).toBeVisible();
  await openMarketGood(page, 'Holz');
  await expect(page.getByRole('region', { name: 'Orderbuch' })).toBeVisible();
  await page.locator('#order-quantity').fill('1000');
  await page.locator('#order-price').fill('80');
  await page.getByRole('button', { name: 'Limitorder einstellen' }).click();
  await expect(page.getByRole('button', { name: 'Stornieren' })).toBeVisible();
  const reserved = await state(page);
  expect(reserved.accounts['player:player-alpha'].reservedMoney).toBe(80_400);
  const playerOrder = reserved.orders.find((order: { ownerType: string }) => order.ownerType === 'player');
  const orderId = playerOrder.orderId;
  const cancelled = await page.request.delete(`${serverUrl}/api/cities/lambrecht/market/orders/${orderId}`, { data: { orderVersion: playerOrder.orderVersion, idempotencyKey: 'e2e-cancel' } });
  expect(cancelled.ok()).toBeTruthy();
  await expect.poll(async () => (await state(page)).orders.find((order: { orderId: string }) => order.orderId === orderId).status).toBe('cancelled');
  const released = await state(page);
  expect(released.accounts['player:player-alpha'].reservedMoney).toBe(0);
  expect(released.orders.find((order: { orderId: string }) => order.orderId === orderId).status).toBe('cancelled');
});

test('zeigt eine serverseitige Reichweitenablehnung ohne lokalen Settlement-Effekt', async ({ page }) => {
  await openLambrecht(page);
  await openMarketGood(page, 'Holz');
  const before = await state(page);
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: { longitude: 8.04, latitude: 49.4 } });
  await page.getByRole('button', { name: 'Limitorder einstellen' }).click();
  await expect(page.getByRole('alert')).toContainText('nicht in Reichweite');
  const after = await state(page);
  expect(after.player).toEqual(before.player);
  expect(after.accounts).toEqual(before.accounts);
  expect(after.orders).toEqual(before.orders);
});

test('lehnt ungültige, ungedeckte und unbesicherte Orders serverseitig ab', async ({ page }) => {
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: cities.lambrecht });
  const order = (data: unknown) => page.request.post(`${serverUrl}/api/cities/lambrecht/market/orders`, { data });
  expect((await order({ goodId: 'wood', side: 'buy', quantityUnits: 0, limitPriceGoldPerTon: 80, idempotencyKey: 'invalid-quantity' })).status()).toBe(400);
  expect((await order({ goodId: 'wood', side: 'buy', quantityUnits: 100, limitPriceGoldPerTon: 0, idempotencyKey: 'invalid-price' })).status()).toBe(400);
  expect((await order({ goodId: 'wood', side: 'sell', quantityUnits: 1, limitPriceGoldPerTon: 80, idempotencyKey: 'no-goods' })).status()).toBe(409);
  const tooExpensive = await order({ goodId: 'wood', side: 'buy', quantityUnits: 1_000_000, limitPriceGoldPerTon: 1_000_000, idempotencyKey: 'insufficient-money' });
  expect(tooExpensive.status()).toBe(409);
  expect((await tooExpensive.json()).error.code).toBe('INSUFFICIENT_AVAILABLE_GOLD');
});

test('lehnt eine veraltete Orderversion ohne zusätzliche Buchung ab', async ({ page }) => {
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: cities.lambrecht });
  const create = (key: string) => page.request.post(`${serverUrl}/api/cities/lambrecht/market/orders`, { data: { goodId: 'wood', side: 'buy', quantityUnits: 100, limitPriceGoldPerTon: 80, idempotencyKey: key } });
  const first = await create('version-first');
  const firstOrder = (await first.json()).order;
  const stale = await page.request.delete(`${serverUrl}/api/cities/lambrecht/market/orders/${firstOrder.orderId}`, { data: { orderVersion: firstOrder.orderVersion + 1, idempotencyKey: 'version-cancel' } });
  expect(stale.status()).toBe(409);
  expect((await stale.json()).error.code).toBe('ORDER_BOOK_VERSION_CONFLICT');
  expect((await state(page)).orders.find((order: { orderId: string }) => order.orderId === firstOrder.orderId).status).toBe('open');
});

test('stellt die Alpha-5-Orderbook-Ansicht auf Desktop und Mobile ohne Seitenfehler dar', async ({ page }) => {
  await openLambrecht(page);
  await openMarketGood(page, 'Holz');
  await expect(page.getByRole('region', { name: 'Kontostände' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Eigene offene Orders' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Stadtkasse' })).toBeVisible();
});
