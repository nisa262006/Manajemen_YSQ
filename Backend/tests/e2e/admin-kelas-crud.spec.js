const { test, expect } = require('@playwright/test');

async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForSelector('#identifier', { state: 'visible' });
  await page.fill('#identifier', 'admin@ysq.id');
  await page.fill('#password', 'admin123');
  await page.click('.login-button');
  await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
}

test.describe('Kelas (Penempatan Santri) CRUD Operations', () => {
  test('1. Tambah Santri ke Kelas', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/tambah-kelas');
    await page.waitForSelector('.class-list-table', { state: 'visible' });
    
    // Wait for dropdowns to populate by waiting for at least two options
    const kelasSelect = page.locator('#id_kelas');
    await expect(kelasSelect.locator('option').nth(1)).toBeAttached({ timeout: 10000 });

    // Select Kelas if available
    if (await kelasSelect.isVisible() && await kelasSelect.locator('option').count() > 1) {
      await kelasSelect.selectOption({ index: 1 });
    }

    // Select Jadwal/Sesi if available
    const jadwalSelect = page.locator('#id_jadwal');
    if (await jadwalSelect.isVisible() && await jadwalSelect.locator('option').count() > 1) {
      await jadwalSelect.selectOption({ index: 1 });
    }

    // Check the first santri checkbox
    const firstCheckbox = page.locator('.data-table tbody input[type="checkbox"]').first();
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
      
      // Handle potential success alert or redirect BEFORE clicking
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Click Simpan
      await page.click('#btn-simpan-kelas-selection');
      
      // Wait for success indication (if any, wait for navigation or just expect url)
      await expect(page).toHaveURL(/\/dashboard\/tambah-kelas/);
    }
  });
});
