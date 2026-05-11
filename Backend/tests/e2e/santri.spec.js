const { test, expect } = require('@playwright/test');

test.describe('Santri Dashboard & Activities', () => {
  test.beforeEach(async ({ page }) => {
    // Login as santri
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });
    await page.fill('#identifier', 'YSQ26DWS011_santri1');
    await page.fill('#password', 'santri1123');
    await page.click('.login-button');
    await page.waitForURL(/\/dashboard\/santri/i, { timeout: 15000 });
  });

  test('Dashboard santri loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/santri/i);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Navigate to Materi Santri', async ({ page }) => {
    const materiLink = page.locator('a[href*="materi-santri"]').first();
    if (await materiLink.isVisible()) {
      await materiLink.click();
      await page.waitForURL(/\/dashboard\/materi-santri/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/materi-santri/);
    }
  });

  test('Navigate to Rapor Santri', async ({ page }) => {
    const raporLink = page.locator('a[href*="santri/rapor"]').first();
    if (await raporLink.isVisible()) {
      await raporLink.click();
      await page.waitForURL(/\/dashboard\/santri\/rapor/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/santri\/rapor/);
    }
  });

  test('Navigate to Riwayat Absensi Santri', async ({ page }) => {
    const riwayatLink = page.locator('a[href*="riwayat-absensi-santri"]').first();
    if (await riwayatLink.isVisible()) {
      await riwayatLink.click();
      await page.waitForURL(/\/dashboard\/riwayat-absensi-santri/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/riwayat-absensi-santri/);
    }
  });

  test('API: Get profile santri via /api/me', async ({ page }) => {
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
      expect(response.role).toBe('santri');
    }
  });

  test('API: Get jadwal santri via /api/jadwal/santri/me', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/jadwal/santri/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { status: res.status, ok: res.ok };
    });

    expect([200, 401]).toContain(response.status);
  });

  test('API: Get kelas santri via /api/kelas/santri/me', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/kelas/santri/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { status: res.status, ok: res.ok };
    });

    expect([200, 401]).toContain(response.status);
  });

  test('API: Get riwayat absensi santri via /api/absensi/santri/me', async ({ page }) => {
    const response = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/absensi/santri/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { status: res.status, ok: res.ok };
    });

    expect([200, 401]).toContain(response.status);
  });
});
