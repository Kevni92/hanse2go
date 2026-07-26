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
  await expect(page.getByRole('button', { name: 'Stadt betreten' })).toHaveCount(0);
  await moveByDebugClick(page, cities.lambrecht);
  await page.getByRole('button', { name: 'Stadt betreten' }).click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Lambrecht Stadtansicht' })).toBeVisible();
}

async function openMarketGood(page: Page, goodName: string) {
  await page.getByRole('button', { name: 'Markt' }).click();
  await page.getByRole('button', { name: new RegExp(goodName) }).first().click();
  await expect(page.getByRole('heading', { name: goodName })).toBeVisible();
}

async function setQuantity(page: Page, quantity: number) {
  const slider = page.getByLabel(/^Menge/);
  // Der Regler ist erst bedienbar, wenn das Servermaximum vorliegt. Vorher begrenzt die
  // eintreffende Preisvorschau jede gesetzte Menge auf eine Tonne.
  await expect(slider).toBeEnabled();
  await slider.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, quantity);
}

async function state(page: Page) {
  const response = await page.request.get(`${serverUrl}/api/state`);
  return response.json();
}

test('nimmt den Holz-Handelsweg Lambrecht nach Neustadt vollständig ab', async ({ page }) => {
  await openLambrecht(page);
  await expect(page.getByText('1.000')).toBeVisible();
  await expect(page.getByText(/24 · einfach/)).toBeVisible();
  await expect(page.getByText('10 %')).toBeVisible();
  await expect(page.getByText('nicht vorhanden')).toBeVisible();
  await page.getByRole('button', { name: 'Produktion' }).click();
  await expect(page.getByText('Holz')).toBeVisible();

  await page.getByRole('button', { name: 'Markt' }).click();
  for (const category of ['Nahrung', 'Baustoffe', 'Handwerk', 'Kleidung', 'Haushaltswaren', 'Luxuswaren']) await expect(page.getByRole('heading', { name: category })).toBeVisible();
  await expect(page.locator('[data-testid^="market-good-"]')).toHaveCount(22);
  await openMarketGood(page, 'Holz');
  await setQuantity(page, 10);
  const buyQuoteResponse = await page.request.post(`${serverUrl}/api/cities/lambrecht/market/quote`, { data: { goodId: 'wood', direction: 'buy', quantity: 10 } });
  const buyQuote = await buyQuoteResponse.json();
  await expect(page.getByRole('region', { name: 'Serverangebot' })).toContainText(`${buyQuote.total.toLocaleString('de-DE')} Gold`);
  await expect(page.getByRole('region', { name: 'Serverangebot' })).toContainText(`${buyQuote.resultingGold.toLocaleString('de-DE')} Gold`);
  await page.getByRole('button', { name: 'Serverangebot abschließen' }).click();
  await expect(page.getByRole('button', { name: 'Spielerübersicht öffnen' })).toContainText(`${buyQuote.resultingGold.toLocaleString('de-DE')} G`);
  await expect(page.getByText('10 t in dieser Serverlaufzeit gehandelt')).toBeVisible();
  let currentState = await state(page);
  expect(currentState.fleet.cargo.wood).toBe(10);
  expect(currentState.cities.find((city: { id: string }) => city.id === 'lambrecht').stock.wood).toBe(190);
  expect((await page.request.get(`${serverUrl}/api/cities/lambrecht/market/wood/history`)).ok()).toBeTruthy();

  await page.getByRole('button', { name: 'Stadtansicht schließen' }).click();
  await moveByDebugClick(page, cities.neustadt);
  await page.getByRole('button', { name: 'Stadt betreten' }).click({ force: true });
  await openMarketGood(page, 'Holz');
  await page.getByRole('button', { name: 'Verkaufen' }).click();
  await setQuantity(page, 10);
  const sellQuoteResponse = await page.request.post(`${serverUrl}/api/cities/neustadt/market/quote`, { data: { goodId: 'wood', direction: 'sell', quantity: 10 } });
  const sellQuote = await sellQuoteResponse.json();
  await expect(page.getByRole('region', { name: 'Serverangebot' })).toContainText(`${sellQuote.total.toLocaleString('de-DE')} Gold`);
  await page.getByRole('button', { name: 'Serverangebot abschließen' }).click();
  await expect(page.getByText('10 t in dieser Serverlaufzeit gehandelt')).toBeVisible();
  currentState = await state(page);
  expect(currentState.fleet.cargo.wood).toBeUndefined();
  expect(currentState.player.gold).toBeGreaterThan(100_000);
  expect(currentState.player.gold).toBe(buyQuote.resultingGold + sellQuote.total);
  expect(currentState.cities.find((city: { id: string }) => city.id === 'neustadt').stock.wood).toBe(50);
  expect((await page.request.get(`${serverUrl}/api/cities/neustadt/market/wood/history`)).ok()).toBeTruthy();
});

test('zeigt eine serverseitige Reichweitenablehnung ohne lokalen Handel', async ({ page }) => {
  await openLambrecht(page);
  await openMarketGood(page, 'Holz');
  const before = await state(page);
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: { longitude: 8.04, latitude: 49.4 } });
  await page.getByRole('button', { name: 'Serverangebot abschließen' }).click();
  await expect(page.getByRole('alert')).toContainText('nicht in Reichweite');
  const after = await state(page);
  expect(after.player).toEqual(before.player);
  expect(after.fleet.cargo).toEqual(before.fleet.cargo);
  expect(after.cities).toEqual(before.cities);
});

test('lehnt Handelsgrenzen serverseitig ab', async ({ page }) => {
  await page.request.put(`${serverUrl}/api/fleet/position`, { data: cities.lambrecht });
  const quote = (goodId: string, direction: 'buy' | 'sell', quantity: number) => page.request.post(`${serverUrl}/api/cities/lambrecht/market/quote`, { data: { goodId, direction, quantity } });
  expect((await quote('wood', 'buy', 151)).status()).toBe(409);
  expect((await quote('wood', 'buy', 201)).status()).toBe(409);
  expect((await quote('wood', 'sell', 1)).status()).toBe(409);
  const clothing = await quote('clothing', 'buy', 15);
  const clothingOffer = await clothing.json();
  expect((await page.request.post(`${serverUrl}/api/cities/lambrecht/market/trade`, { data: { goodId: 'clothing', direction: 'buy', quantity: 15, marketVersion: clothingOffer.marketVersion, idempotencyKey: 'e2e-clothing' } })).ok()).toBeTruthy();
  await page.request.post(`${serverUrl}/test/seed`, { data: { gold: 5_000 } });
  const insufficientGold = await quote('tools', 'buy', 30);
  expect(insufficientGold.status()).toBe(409);
  expect((await insufficientGold.json()).error.code).toBe('INSUFFICIENT_GOLD');
});

test('lehnt ein veraltetes Angebot in der Oberfläche ab und lädt ein neues', async ({ page }) => {
  await openLambrecht(page);
  await openMarketGood(page, 'Holz');
  const current = await page.request.post(`${serverUrl}/api/cities/lambrecht/market/quote`, { data: { goodId: 'wood', direction: 'buy', quantity: 1 } });
  const offer = await current.json();
  await page.request.post(`${serverUrl}/api/cities/lambrecht/market/trade`, { data: { goodId: 'wood', direction: 'buy', quantity: 1, marketVersion: offer.marketVersion, idempotencyKey: 'e2e-mutate-market' } });
  await page.getByRole('button', { name: 'Serverangebot abschließen' }).click();
  await expect(page.getByRole('alert')).toContainText('veraltet');
  expect((await state(page)).fleet.cargo.wood).toBe(1);
});
