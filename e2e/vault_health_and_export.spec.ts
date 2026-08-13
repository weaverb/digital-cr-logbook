import { test, expect } from '@playwright/test';

test.describe('Backup Vault, PDF/CSV Export, and Health Dashboard E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Enfield');
    await page.getByPlaceholder('e.g. M91/30').fill('No.4 Mk1');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-ENFIELD-303');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('.303 British');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Arms Supplier');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();
  });

  test('opens Backup & Vault Modal and tests backup options', async ({ page }) => {
    await page.getByTitle('Encrypted Vault (.crbk)').click();
    await expect(page.getByText('BIP-39 Encrypted Backup & Restore Vault')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Generate 12-Word BIP-39 Seed Key' })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('opens PDF Export modal and selects export settings', async ({ page }) => {
    await page.getByRole('button', { name: 'Print PDF' }).click();
    await expect(page.getByText('Generate ATF Printable Bound Book PDF')).toBeVisible();

    await page.getByPlaceholder('e.g. John Smith').fill('John Collector');
    await page.getByPlaceholder('e.g. 3-42-xxx-01').fill('3-99-12345');

    await expect(page.getByRole('button', { name: /Download Printable PDF/i })).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('opens Audit Dashboard Modal and inspects statistics', async ({ page }) => {
    await page.getByRole('button', { name: 'Audit Dashboard' }).click();
    await expect(page.getByText('ATF Bound Book & Compliance Audit Dashboard')).toBeVisible();
    await expect(page.getByText('Total Firearms')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('opens Vault Health Inspector Modal and checks integrity score', async ({ page }) => {
    await page.getByTitle('Click to run vault integrity diagnostics').click();
    await expect(page.getByText('Vault Integrity & Database Diagnostics')).toBeVisible();
    await expect(page.getByText('SQLite Storage WAL Mode:')).toBeVisible();
    await expect(page.getByText('HEALTHY (OK)')).toBeVisible();

    await page.keyboard.press('Escape');
  });
});
