import { test, expect } from '@playwright/test';

test.describe('Keuangan Pemasukan - Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:5500/folder-repo-1/keuangan-pemasukan.html');
  });

  test('halaman pemasukan harus tampil', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Laporan Pemasukan Keuangan');

    // FIX: tbody bukan visible
    await expect(page.locator('#ysq-income-body')).toBeAttached();
  });

  test('sidebar menu tersedia', async ({ page }) => {
    await expect(page.locator('.sidebar')).toBeVisible();

    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Daftar Santri')).toBeVisible();

    // FIX STRICT MODE
    await expect(page.locator('.ysq-report-toggle')).toBeVisible();
  });

  test('filter pemasukan bisa diisi', async ({ page }) => {
    await page.waitForSelector('#ysq-date-start');

    await page.fill('#ysq-date-start', '2025-01-01');
    await page.fill('#ysq-date-end', '2025-12-31');

    await page.selectOption('#ysq-filter-cat', 'iuran');

    await expect(page.locator('#ysq-date-start')).toHaveValue('2025-01-01');
    await expect(page.locator('#ysq-date-end')).toHaveValue('2025-12-31');
  });

  test('tombol tampil data bisa diklik', async ({ page }) => {
    await page.click('button:has-text("Tampilkan Data")');

    await expect(page.locator('#ysq-income-body')).toBeAttached();
  });

});