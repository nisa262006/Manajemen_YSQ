const { test, expect } = require('@playwright/test');

test.describe('Santri Dashboard & Activities', () => {
  test.beforeEach(async ({ page }) => {
    // Login as santri — pakai email yang sudah di-seed
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });
    await page.fill('#identifier', 'santri1@santri.ysq.id');
    await page.fill('#password', 'santri1123');
    await page.click('.login-button');
    await page.waitForURL(/\/dashboard\/santri/i, { timeout: 15000 });
  });

  test('Dashboard santri loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/santri/i);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Navigate to Riwayat Absensi Santri', async ({ page }) => {
    // Link di HTML: /dashboard/absensi-siswa (bukan /riwayat-absensi-santri)
    const riwayatLink = page.locator('a[href*="absensi-siswa"]').first();
    await expect(riwayatLink).toBeVisible();
    await riwayatLink.click();
    await page.waitForURL(/\/dashboard\/absensi-siswa/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/absensi-siswa/);
  });

  test('Navigate to Rapor Santri', async ({ page }) => {
    // Link di HTML: /dashboard/santri/rapor
    const raporLink = page.locator('a[href*="santri/rapor"]').first();
    await expect(raporLink).toBeVisible();
    await raporLink.click();
    await page.waitForURL(/\/dashboard\/santri\/rapor/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/santri\/rapor/);
  });

  test('Navigate to Billing', async ({ page }) => {
    // Link di HTML: /dashboard/billing
    const billingLink = page.locator('a[href*="billing"]').first();
    await expect(billingLink).toBeVisible();
    await billingLink.click();
    await page.waitForURL(/\/dashboard\/billing/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/billing/);
  });
});
