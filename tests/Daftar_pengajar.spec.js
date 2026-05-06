// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pengujian Halaman Daftar Pengajar Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    // Membuka halaman Daftar Pengajar
    await page.goto('http://127.0.0.1:5500/folder-repo-1/daftar_pengajar.html');
  });

  test('1. Verifikasi Elemen Utama dan Pencarian', async ({ page }) => {
    // Pastikan judul halaman benar
    await expect(page.locator('.header-title')).toHaveText('Daftar Pengajar');

    // Cek fitur pencarian (input teks)
    const searchInput = page.locator('.teacher-search-input input');
    await searchInput.fill('David');
    await expect(searchInput).toHaveValue('David');

    // Pastikan tombol pencarian ada
    await expect(page.locator('.search-btn')).toBeVisible();
  });

  test('2. Verifikasi Data Pengajar di Tabel', async ({ page }) => {
    // Verifikasi data pada baris pertama tabel
    const firstRow = page.locator('.teacher-list-table tbody tr').first();
    await expect(firstRow).toContainText('249078561'); // NIM
    await expect(firstRow).toContainText('David');     // Nama
    await expect(firstRow).toContainText('Aktif');     // Status
  });

  test('3. Verifikasi Navigasi ke Detail Pengajar', async ({ page }) => {
    // Klik icon pen (edit/detail) pada baris pertama
    await page.locator('.edit-pengajar-link').first().click();

    // Verifikasi URL berpindah ke halaman detail_pengajar.html
    await expect(page).toHaveURL(/.*detail-pengajar.html/);
  });

  test('4. Verifikasi Navigasi Kembali', async ({ page }) => {
    // Klik tombol Kembali ke Dashboard
    await page.locator('.back-btn').click();
    
    // Pastikan kembali ke halaman utama Admin
    await expect(page).toHaveURL(/.*Admin.html/);
  });

});