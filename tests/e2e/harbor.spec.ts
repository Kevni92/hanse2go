import { expect, test } from '@playwright/test';

const serverUrl = 'http://127.0.0.1:3000';
const mapCenter = { longitude: 8.12, latitude: 49.4 };
const lambrecht = { longitude: 8.07, latitude: 49.37 };
const mercatorY = (latitude: number) => { const radians = latitude * Math.PI / 180; return (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2; };

test.beforeEach(async ({ request }) => { expect((await request.post(`${serverUrl}/test/reset`)).ok()).toBeTruthy(); });

test('manages a concrete harbor ship on desktop and mobile', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('[aria-label="Ozeankarte im Debug-Modus"] .maplibregl-canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox(); if (!box) throw new Error('Karte nicht sichtbar');
  const worldSize = 512 * 2 ** 10;
  await canvas.click({ position: { x: box.width / 2 + ((lambrecht.longitude - mapCenter.longitude) / 360) * worldSize, y: box.height / 2 + (mercatorY(lambrecht.latitude) - mercatorY(mapCenter.latitude)) * worldSize }, force: true });
  await page.getByRole('button', { name: 'Stadt betreten' }).click({ force: true });
  await page.getByTestId('harbor-tab').click();
  await expect(page.getByText('Möwe-Flotte')).toBeVisible();
  await expect(page.getByTestId('ship-card-ship-market-lambrecht-01')).toContainText('Waldwind');
  await page.getByTestId('buy-ship-ship-market-lambrecht-01').click();
  await expect(page.getByTestId('ship-card-ship-market-lambrecht-01')).toHaveCount(0);
  const state = await (await page.request.get(`${serverUrl}/api/state`)).json();
  expect(state.ships.find((ship: { shipId: string }) => ship.shipId === 'ship-market-lambrecht-01').ownerId).toBe('player-alpha');
});
