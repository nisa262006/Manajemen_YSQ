import { test, expect } from '@playwright/test';

const ADMIN_URL = `http://127.0.0.1:5500/Backend/public/views/Admin.html`;

test.describe('E2E ADMIN YSQ', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(ADMIN_URL);
  });

  // ================= DASHBOARD =================
  test('halaman admin tampil', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('sidebar tampil', async ({ page }) => {
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('stats card tampil', async ({ page }) => {
    await expect(page.locator('#total_santri_dewasa')).toBeVisible();
  });

  test('aksi cepat tampil', async ({ page }) => {
    await expect(page.getByText('Tambah Santri')).toBeVisible();
  });

  // ================= POPUP PROFIL =================
  test('buka popup profil', async ({ page }) => {
    await page.click('#btn-open-profil');
    await expect(page.locator('#popup-profile-setting')).toBeVisible();
  });

  test('tutup popup profil', async ({ page }) => {
    // pastikan awalnya hidden (penting)
    await expect(page.locator('#popup-profile-setting')).toBeHidden();

    // buka dulu
    await page.click('#btn-open-profil');
    await expect(page.locator('#popup-profile-setting')).toBeVisible();

    // tutup
    await page.click('#btn-close-profil-x');

    // tunggu sampai benar-benar hidden
    await expect(page.locator('#popup-profile-setting')).toBeHidden();
  });

  // ================= LOGOUT =================
  test('tombol logout ada', async ({ page }) => {
    await expect(page.getByText('Keluar')).toBeVisible();
  });

});