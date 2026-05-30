const { test, expect } = require('@playwright/test');

test.describe('Pengajar Dashboard & Activities', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pengajar — pakai email yang sudah di-seed
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });
    await page.fill('#identifier', 'riska@pengajar.ysq.id');
    await page.fill('#password', 'riska');
    await page.click('.login-button');
    await page.waitForURL(/\/dashboard\/pengajar/i, { timeout: 15000 });
  });

  test('Dashboard pengajar loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/pengajar/i);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Navigate to Jadwal Kelas', async ({ page }) => {
    // Link di sidebar: /dashboard/pengajar/jadwal (bukan /jadwal-kelas)
    const jadwalLink = page.locator('a[href*="/pengajar/jadwal"]').first();
    await expect(jadwalLink).toBeVisible();
    await jadwalLink.click();
    await page.waitForURL(/\/dashboard\/pengajar\/jadwal/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/pengajar\/jadwal/);
    // Verify table or container is visible
    const tableOrContainer = page.locator('table, .jadwal-container, .schedule-container').first();
    await expect(tableOrContainer).toBeVisible({ timeout: 8000 });
  });

  test('Navigate to Absensi', async ({ page }) => {
    // Link di sidebar: /dashboard/pengajar/absensi (bukan /absensi-pengajar)
    const absensiLink = page.locator('a[href*="/pengajar/absensi"]').first();
    await expect(absensiLink).toBeVisible();
    await absensiLink.click();
    await page.waitForURL(/\/dashboard\/pengajar\/absensi/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/pengajar\/absensi/);
  });

  test('Navigate to Materi Ajar', async ({ page }) => {
    const materiLink = page.locator('a[href*="materi-ajar"]').first();
    await expect(materiLink).toBeVisible();
    await materiLink.click();
    await page.waitForURL(/\/dashboard\/pengajar\/materi-ajar/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/pengajar\/materi-ajar/);
  });

  test('Navigate to Rapor', async ({ page }) => {
    // Link di sidebar: /dashboard/pengajar/rapor (bukan /rapor-pengajar)
    const raporLink = page.locator('a[href*="/pengajar/rapor"]').first();
    await expect(raporLink).toBeVisible();
    await raporLink.click();
    await page.waitForURL(/\/dashboard\/pengajar\/rapor/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/pengajar\/rapor/);
  });

  test('Navigate to Laporan', async ({ page }) => {
    // Link di sidebar: /dashboard/pengajar/laporan (bukan /laporan-pengajar)
    const laporanLink = page.locator('a[href*="/pengajar/laporan"]').first();
    await expect(laporanLink).toBeVisible();
    await laporanLink.click();
    await page.waitForURL(/\/dashboard\/pengajar\/laporan/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/pengajar\/laporan/);
  });
});
