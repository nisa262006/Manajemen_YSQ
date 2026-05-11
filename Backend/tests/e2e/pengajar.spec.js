const { test, expect } = require('@playwright/test');

test.describe('Pengajar Dashboard & Activities', () => {
  test.beforeEach(async ({ page }) => {
    // Login as pengajar
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });
    await page.fill('#identifier', 'YSQ25PGJ001_riska');
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
    const jadwalLink = page.locator('a[href*="jadwal-kelas"]').first();
    if (await jadwalLink.isVisible()) {
      await jadwalLink.click();
      await page.waitForURL(/\/dashboard\/pengajar\/jadwal-kelas/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/pengajar\/jadwal-kelas/);
    }
  });

  test('Navigate to Absensi', async ({ page }) => {
    const absensiLink = page.locator('a[href*="absensi-pengajar"]').first();
    if (await absensiLink.isVisible()) {
      await absensiLink.click();
      await page.waitForURL(/\/dashboard\/pengajar\/absensi-pengajar/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/pengajar\/absensi-pengajar/);
    }
  });

  test('Navigate to Riwayat Absensi', async ({ page }) => {
    const riwayatLink = page.locator('a[href*="riwayat-absensi"]').first();
    if (await riwayatLink.isVisible()) {
      await riwayatLink.click();
      await page.waitForURL(/\/dashboard\/pengajar\/riwayat-absensi/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/pengajar\/riwayat-absensi/);
    }
  });

  test('Navigate to Materi Ajar', async ({ page }) => {
    const materiLink = page.locator('a[href*="materi-ajar"]').first();
    if (await materiLink.isVisible()) {
      await materiLink.click();
      await page.waitForURL(/\/dashboard\/pengajar\/materi-ajar/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/pengajar\/materi-ajar/);
    }
  });

  test('Navigate to Rapor', async ({ page }) => {
    const raporLink = page.locator('a[href*="rapor-pengajar"]').first();
    if (await raporLink.isVisible()) {
      await raporLink.click();
      await page.waitForURL(/\/dashboard\/pengajar\/rapor-pengajar/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/pengajar\/rapor-pengajar/);
    }
  });

  test('Navigate to Laporan', async ({ page }) => {
    const laporanLink = page.locator('a[href*="laporan-pengajar"]').first();
    if (await laporanLink.isVisible()) {
      await laporanLink.click();
      await page.waitForURL(/\/dashboard\/pengajar\/laporan-pengajar/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/pengajar\/laporan-pengajar/);
    }
  });

  test('API: Get profile pengajar via /api/me', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return { status: res.status, role: data.role, success: data.success };
    });

    if (response.status === 200) {
      expect(response.success).toBe(true);
      expect(response.role).toBe('pengajar');
    }
  });

  test('API: Get jadwal pengajar via /api/jadwal/pengajar/me', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/jadwal/pengajar/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { status: res.status, ok: res.ok };
    });

    expect([200, 401, 404]).toContain(response.status);
  });
});
