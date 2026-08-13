import { test, expect } from '@playwright/test';

test.describe('Maintenance & Range Log Tracking E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Mauser Arms');
    await page.getByPlaceholder('e.g. M91/30').fill('Kar98k');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-K98-44');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('8x57mm IS');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Import Surplus');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();
  });

  test('adds maintenance log entry for selected firearm', async ({ page }) => {
    await page.getByRole('button', { name: 'Maintenance History' }).click();
    await expect(page.getByText('Maintenance & Gunsmithing Log')).toBeVisible();

    await page.getByPlaceholder('0.00').fill('24.50');
    await page.getByPlaceholder('e.g. Self or Gunsmith Shop').fill('Self');
    await page.getByPlaceholder(/Details of cleaning, parts replaced/i).fill('Thorough barrel cleaning and action lubrication.');

    await page.getByRole('button', { name: 'Save Maintenance Record' }).click();

    await expect(page.getByText('Thorough barrel cleaning and action lubrication.')).toBeVisible();
  });

  test('adds range trip log entry and verifies round count calculation', async ({ page }) => {
    await page.getByRole('button', { name: 'Range Logs' }).click();
    await expect(page.getByText('Range Trip & Ammunition Round Counter')).toBeVisible();

    await page.getByPlaceholder(/e\.g\. 7\.62x54mmR S&B 180gr FMJ/i).fill('PPU 8mm Mauser 198gr');
    await page.getByPlaceholder('40').fill('45');
    await page.getByPlaceholder(/Group size, sight adjustments/i).fill('Zeroed at 100 yards. Excellent grouping.');

    await page.getByRole('button', { name: 'Save Range Entry' }).click();

    await expect(page.getByText('PPU 8mm Mauser 198gr')).toBeVisible();
    await expect(page.getByText('45 Rounds Fired')).toBeVisible();
    await expect(page.getByText('Zeroed at 100 yards. Excellent grouping.')).toBeVisible();
  });
});
