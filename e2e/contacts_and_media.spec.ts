import { test, expect } from '@playwright/test';

test.describe('FFL Contacts Rolodex and Media Gallery E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Beretta');
    await page.getByPlaceholder('e.g. M91/30').fill('Model 1934');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-BERETTA-9');
    await page.locator('form select').first().selectOption('Pistol');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('9mm Corto');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Gun Broker Dealer');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();
  });

  test('adds and searches contacts in FFL Contacts Rolodex', async ({ page }) => {
    await page.getByRole('button', { name: 'FFL Rolodex' }).click();
    await expect(page.getByText('FFL Contacts & Transferee Rolodex')).toBeVisible();

    await page.getByRole('button', { name: /Add New Contact/i }).click();

    await page.getByPlaceholder('e.g. Simpson Ltd').fill('Precision Armory FFL');
    await page.getByPlaceholder('e.g. 9-36-xxx-12').fill('1-59-998877');
    await page.getByPlaceholder('info@dealer.com').fill('sales@precisionarmory.com');
    await page.getByPlaceholder('(555) 000-0000').fill('555-0199');
    await page.getByPlaceholder('City, State, ZIP').fill('789 Target Way, Dallas, TX');

    await page.getByRole('button', { name: /Save Contact/i }).click();

    await expect(page.getByText('Precision Armory FFL')).toBeVisible();
    await expect(page.getByText('1-59-998877')).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search contacts by Name/i);
    await searchInput.fill('Precision');
    await expect(page.getByText('Precision Armory FFL')).toBeVisible();

    await searchInput.fill('NonExistentName');
    await expect(page.getByText('Precision Armory FFL')).not.toBeVisible();
  });

  test('attaches photo metadata in Media Gallery Modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Proof Marks & Scans' }).click();
    await expect(page.getByText('Proof Mark & Provenance Photo Gallery')).toBeVisible();

    await page.getByRole('button', { name: /Upload Proof \/ Provenance Photo/i }).click();

    await page.getByPlaceholder('e.g. Receiver Proof Stamp 1941').fill('Right Side Proof Marks');
  });
});
