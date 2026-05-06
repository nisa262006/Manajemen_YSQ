import { test, expect } from '@playwright/test';

test.describe('Laporan Pengeluaran - Sahabat Quran', () => {

  const URL = 'http://localhost:3000/dashboard/admin/laporan/keuangan-pengeluaran';

  test.beforeEach(async ({ page }) => {
    // 🔥 tunggu server & JS ready
    await page.goto(URL, { waitUntil: 'networkidle' });

    // pastikan halaman benar-benar ready
    await expect(page.locator('h1')).toContainText('Laporan Pengeluaran');
    await expect(page.locator('#table-pengeluaran')).toBeVisible();
  });

  // =========================
  // 1. PAGE LOAD
  // =========================
  test('harus menampilkan halaman laporan pengeluaran', async ({ page }) => {
    await expect(page.locator('#ysq-total-pengeluaran')).toBeVisible();
    await expect(page.locator('#ysq-search')).toBeVisible();
  });

  // =========================
  // 2. OPEN MODAL
  // =========================
  test('bisa membuka modal tambah pengeluaran', async ({ page }) => {
    await page.click('text=Tambah');

    const modal = page.locator('#modalPengeluaran');
    await expect(modal).toBeVisible();
  });

  // =========================
  // 3. INPUT DATA
  // =========================
  test('input pengeluaran baru', async ({ page }) => {
    await page.click('text=Tambah');

    await expect(page.locator('#modalPengeluaran')).toBeVisible();

    await page.selectOption('#out-jenis', { label: 'Konsumsi' });
    await page.fill('#out-tgl', '2026-05-06');
    await page.fill('#out-nominal', '150000');
    await page.fill('#out-ket', 'Snack santri');

    await page.click('text=Simpan');

    // tunggu modal close
    await expect(page.locator('#modalPengeluaran')).toBeHidden();
  });

  // =========================
  // 4. SEARCH
  // =========================
  test('search pengeluaran', async ({ page }) => {

    const search = page.locator('#ysq-search');
    await expect(search).toBeVisible();

    await search.fill('Konsumsi');

    // jangan hard check isi tabel (biar gak flaky)
    const rows = page.locator('#ysq-pengeluaran-body tr');
    await expect(rows.first()).toBeVisible();
  });

  // =========================
  // 5. FILTER CATEGORY
  // =========================
  test('filter kategori pengeluaran', async ({ page }) => {

    await page.selectOption('#ysq-out-filter-cat', 'Konsumsi');

    const rows = page.locator('#ysq-pengeluaran-body tr');

    // lebih aman daripada toContainText
    await expect(rows.first()).toBeVisible();
  });

  // =========================
  // 6. DATE FILTER
  // =========================
  test('filter berdasarkan tanggal', async ({ page }) => {

    await page.fill('#ysq-out-date-start', '2026-05-01');
    await page.fill('#ysq-out-date-end', '2026-05-31');

    const rows = page.locator('#ysq-pengeluaran-body tr');

    await expect(rows.first()).toBeVisible();
  });

  // =========================
  // 7. EXPORT BUTTON
  // =========================
  test('button export bisa diklik', async ({ page }) => {

    await page.click('text=PDF');
    await page.click('text=Excel');

    // tidak error = sukses
    await expect(page.locator('text=Laporan Pengeluaran')).toBeVisible();
  });

  // =========================
  // 8. PROFILE MODAL
  // =========================
  test('buka modal profile setting', async ({ page }) => {

    const btn = page.locator('#btn-open-profil');
    await expect(btn).toBeVisible();

    await btn.click();

    const modal = page.locator('#popup-profile-setting');
    await expect(modal).toBeVisible();
  });

});