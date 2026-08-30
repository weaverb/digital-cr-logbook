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
    await expect(page.getByText('Vault Integrity & Data Diagnostics')).toBeVisible();
    await expect(page.getByText('Local Storage Engine:')).toBeVisible();
    await expect(page.getByText('ACTIVE (OK)')).toBeVisible();

    await page.keyboard.press('Escape');
  });

  test('footer status bar makes an honest local-storage claim, not a database claim', async ({ page }) => {
    await expect(page.getByText('Local Storage: Active (Click for Health Diagnostics)')).toBeVisible();
    await expect(page.getByText(/SQLite/i)).not.toBeVisible();
  });

  test('restoring a vault backup requires reviewing and confirming before any data is overwritten', async ({ page }) => {
    // The app confirms a successful restore with a native alert() — auto-accept it.
    page.on('dialog', dialog => dialog.accept());

    // Generate a seed and download an encrypted backup of the current single-record vault
    await page.getByTitle('Encrypted Vault (.crbk)').click();
    await page.getByRole('button', { name: 'Generate 12-Word BIP-39 Seed Key' }).click();

    const seedWords = await page.locator('span.text-amber-300.font-bold').allTextContents();
    expect(seedWords).toHaveLength(12);
    const seedPhrase = seedWords.join(' ');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Encrypted Archive/i }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();

    await page.keyboard.press('Escape');

    // Add a second acquisition so current data diverges from the downloaded backup
    await page.getByRole('button', { name: 'New Acquisition' }).click();
    await page.getByPlaceholder('e.g. Tula Arms Plant').fill('Mosin Arsenal');
    await page.getByPlaceholder('e.g. M91/30').fill('91/30');
    await page.getByPlaceholder('e.g. 913077421').fill('SN-MOSIN-9130');
    await page.getByPlaceholder('e.g. 7.62x54mmR').fill('7.62x54mmR');
    await page.getByPlaceholder('e.g. Classic Firearms or John Smith').fill('Arms Supplier Two');
    await page.getByRole('button', { name: /Save Bound Book Acquisition/i }).click();
    await expect(page.getByText('Mosin Arsenal')).toBeVisible();

    // Load the backup file and seed phrase into the Restore tab
    await page.getByTitle('Encrypted Vault (.crbk)').click();
    await page.getByRole('button', { name: 'Restore from Backup' }).click();
    await page.locator('input[type="file"]').setInputFiles(backupPath!);
    await page.getByPlaceholder(/Enter all 12 words separated by spaces/i).fill(seedPhrase);
    await page.getByRole('button', { name: /Decrypt & Load Vault Data/i }).click();

    // Data must NOT be overwritten yet — a confirmation review is required first
    await expect(page.getByText('Confirm Restore — This Cannot Be Undone')).toBeVisible();
    await expect(page.getByText('Current Data (Will Be Replaced)')).toBeVisible();
    await expect(page.getByText(/Incoming Backup/)).toBeVisible();
    await expect(page.getByText('Mosin Arsenal')).toBeVisible(); // still present, nothing written yet

    // Cancelling returns to the form without touching any data
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Confirm Restore — This Cannot Be Undone')).not.toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Mosin Arsenal')).toBeVisible();

    // Re-run the restore and this time confirm the overwrite
    await page.getByTitle('Encrypted Vault (.crbk)').click();
    await page.getByRole('button', { name: 'Restore from Backup' }).click();
    await page.locator('input[type="file"]').setInputFiles(backupPath!);
    await page.getByPlaceholder(/Enter all 12 words separated by spaces/i).fill(seedPhrase);
    await page.getByRole('button', { name: /Decrypt & Load Vault Data/i }).click();
    await expect(page.getByText('Confirm Restore — This Cannot Be Undone')).toBeVisible();
    await page.getByRole('button', { name: /Confirm & Overwrite Current Data/i }).click();

    // The backup (captured before the second acquisition) is now restored
    await expect(page.getByText('BIP-39 Encrypted Backup & Restore Vault')).not.toBeVisible();
    await expect(page.getByText('Mosin Arsenal')).not.toBeVisible();
    await expect(page.getByText('Enfield')).toBeVisible();
  });
});
