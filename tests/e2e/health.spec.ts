import { expect, test } from '@playwright/test';

test('zeigt den bestätigten Serverstatus', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('status')).toHaveText('Server ist erreichbar.');
});
