import { test, expect } from '@playwright/test';

const URL = 'http://127.0.0.1:5500/Backend/public/views/daftar.html';

test.describe('E2E Register Santri', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
  });

  // =========================
  // 1. HALAMAN TAMPIL
  // =========================
  test('halaman register tampil', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Registrasi Santri');
    await expect(page.locator('form')).toBeVisible();
  });

  // =========================
  // 2. ISI FORM NORMAL
  // =========================
  test('user bisa isi form register', async ({ page }) => {
    await page.fill('#nama_lengkap', 'Rizka Test');
    await page.fill('#alamat', 'Jakarta');
    await page.fill('#tempat_lahir', 'Bogor');
    await page.fill('#tanggal_lahir', '2000-01-01');
    await page.fill('#nomor_telepon', '08123456789');
    await page.fill('#email', 'test@mail.com');

    await page.check('#syarat_ketentuan');

    await expect(page.locator('#nama_lengkap')).toHaveValue('Rizka Test');
    await expect(page.locator('#syarat_ketentuan')).toBeChecked();
  });

  // =========================
  // 3. SUBMIT TANPA ISI
  // =========================
  test('tidak bisa submit jika form kosong', async ({ page }) => {
    await page.click('button[type="submit"]');

    // cek masih di halaman yang sama
    await expect(page).toHaveURL(URL);

    // cek input tetap kosong
    await expect(page.locator('#nama_lengkap')).toHaveValue('');
  });

  // =========================
  // 4. EMAIL INVALID
  // =========================
  test('email invalid ditolak', async ({ page }) => {
    await page.fill('#email', 'email-salah');
    await page.click('button[type="submit"]');

    // HTML5 validation biasanya akan block submit
    const emailInput = page.locator('#email');

    // cek tetap di halaman
    await expect(page).toHaveURL(URL);

    await expect(emailInput).toHaveValue('email-salah');
  });

  // =========================
  // 5. CHECKBOX WAJIB
  // =========================
  test('checkbox wajib harus dicentang', async ({ page }) => {
    await page.fill('#nama_lengkap', 'Test User');
    await page.fill('#alamat', 'Jakarta');
    await page.fill('#tempat_lahir', 'Bogor');
    await page.fill('#tanggal_lahir', '2000-01-01');
    await page.fill('#nomor_telepon', '08123456789');
    await page.fill('#email', 'test@mail.com');

    // TIDAK centang checkbox
    await page.click('button[type="submit"]');

    await expect(page.locator('#syarat_ketentuan')).not.toBeChecked();

    // tetap di halaman (tidak submit)
    await expect(page).toHaveURL(URL);
  });

  // =========================
  // 6. SUCCESS FLOW (PENTING!)
  // =========================
  test('register berhasil (happy case)', async ({ page }) => {
    await page.fill('#nama_lengkap', 'User Valid');
    await page.fill('#alamat', 'Bandung');
    await page.fill('#tempat_lahir', 'Bandung');
    await page.fill('#tanggal_lahir', '2000-01-01');
    await page.fill('#nomor_telepon', '08123456789');
    await page.fill('#email', 'valid@mail.com');

    await page.check('#syarat_ketentuan');

    await page.click('button[type="submit"]');

    // 🔥 GANTI ini sesuai behavior kamu:
    // contoh kalau redirect ke login
    await expect(page).not.toHaveURL(URL);

    // atau kalau ada toast sukses:
    // await expect(page.locator('.toast-success')).toBeVisible();
  });

});