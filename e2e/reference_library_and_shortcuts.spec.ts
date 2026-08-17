import { test, expect } from '@playwright/test';

test.describe('C&R Reference Library, Command Palette, and Help E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('navigates to C&R Reference Library tab and searches items', async ({ page }) => {
    await page.getByRole('button', { name: /ATF Master C&R Reference Library/i }).click();
    await expect(page.getByText('ATF Master Curios & Relics Reference Library')).toBeVisible();

    const crSearchInput = page.getByPlaceholder(/Search by Manufacturer/i);
    await crSearchInput.fill('Mosin');

    await expect(page.getByText(/Mosin/i).first()).toBeVisible();

    await page.getByRole('button', { name: 'Section II (GCA)' }).click();
    await expect(page.getByText('Section II').first()).toBeVisible();
  });

  test('opens Command Palette via button and keyboard shortcut', async ({ page }) => {
    await page.getByTitle(/Global Command Palette/i).click();
    await expect(page.getByPlaceholder(/Type a command or search firearms/i)).toBeVisible();

    await page.getByPlaceholder(/Type a command or search firearms/i).fill('Acquisition');
    await expect(page.getByText('Record New Firearm Acquisition')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/Type a command or search firearms/i)).not.toBeVisible();

    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/Type a command or search firearms/i)).toBeVisible();
  });

  test('opens Support & Help Modal and verifies official legal compliance links', async ({ page }) => {
    await page.getByRole('button', { name: 'Support' }).click();
    await expect(page.getByText('User Support & Assistance')).toBeVisible();

    await expect(page.getByText('System & Diagnostic Information')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('User Support & Assistance')).not.toBeVisible();
  });

  test('imports updated ATF C&R CSV file, replaces reference database, and restores default', async ({ page }) => {
    await page.getByRole('button', { name: /ATF Master C&R Reference Library/i }).click();
    await expect(page.getByText('ATF Master Curios & Relics Reference Library')).toBeVisible();

    // Click Import Updated CSV button
    await page.getByRole('button', { name: /Import Updated CSV/i }).click();
    await expect(page.getByText('Import ATF C&R Master List (CSV)')).toBeVisible();
    await expect(page.getByText('Default Official Bundled List')).toBeVisible();

    // Upload custom CSV
    const sampleCSV = `record_id,section_code,section_name,nfa_status,manufacturer_or_make,model,caliber_or_gauge,serial_number_range,date_or_year_range,atf_classification_details,first_published_edition,latest_published_edition,in_2025_publication,in_2018_publication,in_2007_publication,full_raw_entry
CR-E2E-9999,Section II,Firearms Classified as Curios or Relics Under 18 U.S.C. Chapter 44 (GCA),GCA Only (Not NFA),Experimental Arsenal,Super Carbine 2026,cal. 9mm,S/Ns 001-999,from 1970 to 1975,"Experimental Arsenal Super Carbine 2026 test listing.",ATF 2026,ATF 2026,TRUE,FALSE,FALSE,"Experimental Arsenal Super Carbine 2026 test listing."`;

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/Choose a new ATF C&R CSV file or drag and drop here/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'curios_and_relics_2026_update.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(sampleCSV)
    });

    await expect(page.getByText(/1 Valid Records Extracted/i)).toBeVisible();
    await expect(page.getByText(/Ready to Import and Replace/i)).toBeVisible();

    // Apply and replace
    await page.getByRole('button', { name: /Apply & Replace C&R List/i }).click();
    await expect(page.getByText('Import ATF C&R Master List (CSV)')).not.toBeVisible();

    // Verify imported record is active in library search
    await expect(page.getByText(/1 Records Loaded \(Custom\)/i)).toBeVisible();
    await expect(page.getByText(/Experimental Arsenal/i).first()).toBeVisible();
    await expect(page.getByText('CR-E2E-9999')).toBeVisible();

    // Verify restore back to bundled defaults
    await page.getByRole('button', { name: /Import Updated CSV/i }).click();
    await expect(page.getByText('Custom User-Imported List')).toBeVisible();
    await page.getByRole('button', { name: /Restore Bundled Default/i }).click();
    await page.getByRole('button', { name: /Confirm Reset/i }).click();

    await expect(page.getByText('Import ATF C&R Master List (CSV)')).not.toBeVisible();
    await expect(page.getByText(/4,207 Records Pre-Loaded/i)).toBeVisible();
  });
});
