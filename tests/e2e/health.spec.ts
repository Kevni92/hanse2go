import { expect, test } from '@playwright/test';

test('zeigt die serverbestätigte Kartenansicht', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Hanse2Go' })).toBeVisible();
  await expect(page.locator('[aria-label="Ozeankarte im Debug-Modus"]')).toBeVisible();
});
