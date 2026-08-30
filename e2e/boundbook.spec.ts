import { test, expect } from '@playwright/test';

test.describe('Bound Book Acquisition, Disposition, and ATF Audit E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('loads initial empty bound book and shows correct header title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('C&R Digital Logbook');
    await expect(page.getByRole('link', { name: '27 CFR § 478.125(f)' }).first()).toBeVisible();
    await expect(page.getByText('100% Offline Local Storage')).toBeVisible();
  });

  test('logs a new firearm acquisition end-to-end', async ({ page }) => {
    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await expect(page.getByText('Record Firearm Acquisition')).toBeVisible();

    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Mosin-Nagant Armory');
    await page.getByPlaceholder('e.g. CAI Georgia VT').fill('Century Arms');
    await page.getByPlaceholder('e.g. M91/30').fill('M91/30 PU Sniper');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-E2E-1001');
    await page.locator('form select').first().selectOption('Rifle');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('7.62x54R');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Classic Firearms');
    await page.getByPlaceholder('Street Address, City, State, ZIP').fill('123 Gunsmith Way, Charlotte, NC');
    await page.getByPlaceholder('e.g. 1-56-xxx-09').fill('1-56-12345');

    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();

    await expect(page.getByRole('cell', { name: 'Mosin-Nagant Armory' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'M91/30 PU Sniper' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SN-E2E-1001' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'In Collection' })).toBeVisible();
  });

  test('searches and filters bound book records', async ({ page }) => {
    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Tula Arsenal');
    await page.getByPlaceholder('e.g. M91/30').fill('SKS Carbine');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-SKS-999');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('7.62x39mm');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Private Collector');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();

    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Colt Firearms');
    await page.getByPlaceholder('e.g. M91/30').fill('1911A1 World War II');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-COLT-45');
    await page.locator('form select').first().selectOption('Pistol');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('.45 ACP');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Estate Sale');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();

    const searchInput = page.getByPlaceholder(/Search by Manufacturer, Model/i);
    await searchInput.fill('Colt');
    await expect(page.getByRole('cell', { name: 'Colt Firearms' }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Tula Arsenal' }).first()).not.toBeVisible();

    await searchInput.fill('');
    await expect(page.getByRole('cell', { name: 'Tula Arsenal' }).first()).toBeVisible();

    await page.getByRole('button', { name: /^Collection/ }).click();
    await expect(page.getByRole('cell', { name: 'Tula Arsenal' }).first()).toBeVisible();
  });

  test('amends an unlocked firearm record with ATF audit log entry', async ({ page }) => {
    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Springfield Armory');
    await page.getByPlaceholder('e.g. M91/30').fill('M1 Garand');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-GARAND-10');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('.30-06');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('CMP');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();

    await page.getByTitle('Amend Entry (ATF Audit Logged)').click();
    await expect(page.getByText('Amend Bound Book Entry')).toBeVisible();

    await page.getByPlaceholder(/Corrected typo in serial number/i).fill('Updated model details from CMP documentation');
    await page.locator('div').filter({ hasText: /^Model \*/ }).locator('input').fill('M1 Garand (30-06 Special)');
    await page.getByRole('button', { name: /Save Amendment & Log Audit Event/i }).click();

    await expect(page.getByRole('cell', { name: 'M1 Garand (30-06 Special)' }).first()).toBeVisible();
  });

  test('disposes a firearm and locks record per 27 CFR § 478.125(f)', async ({ page }) => {
    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Walther');
    await page.getByPlaceholder('e.g. M91/30').fill('PPK/S C&R');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-PPK-777');
    await page.locator('form select').first().selectOption('Pistol');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('.380 ACP');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Local Dealer');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();

    await page.getByTitle('Log Disposition (27 CFR 478.125 Lock)').click();
    await expect(page.getByText('Log Firearm Disposition')).toBeVisible();

    await page.getByPlaceholder(/John Smith or Dealer Name/i).fill('Jane Smith FFL');
    await page.getByPlaceholder(/City, State, ZIP/i).fill('456 Commerce St, Austin, TX');
    await page.getByPlaceholder(/3-42-xxx-01/i).fill('5-74-98765');
    await page.getByRole('button', { name: /Confirm & Lock Disposition Record/i }).click();

    await expect(page.getByRole('cell', { name: 'Disposed' })).toBeVisible();
  });
});
