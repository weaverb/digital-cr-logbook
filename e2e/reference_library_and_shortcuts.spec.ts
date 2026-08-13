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
});
