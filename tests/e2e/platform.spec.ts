import { expect, test } from '@playwright/test';

test('T01 platform smoke: foundation and independent-demo disclosure load', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sacred Commerce', exact: true })).toBeVisible();
  await expect(page.getByText('Independent interview demo · Simulated purchases only.')).toBeVisible();
  await expect(page.getByText(/Not an official Isha Life store/i)).toBeVisible();
});
