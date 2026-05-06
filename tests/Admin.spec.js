// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('E2E Test - Dashboard Admin Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    // Membuka halaman Admin.html (pastikan huruf A besar sesuai file kamu)
    await page.goto('http://127.0.0.1:5500/folder-repo-1/Admin.html');
  });

  test('1. Verifikasi Statistik Dashboard', async ({ page }) => {
    // Verifikasi teks label statistik
    await expect(page.getByText('Total Santri Dewasa')).toBeVisible();
    await expect(page.getByText('Total Pengajar')).toBeVisible();
    
    // Verifikasi nilai statistik (angka 12)
    const statValue = page.locator('.stat-value').first();
    await expect(statValue).toHaveText('12');
  });

  test('2. Verifikasi Tombol Aksi Cepat', async ({ page }) => {
    // Mengetes navigasi ke halaman Tambah Siswa
    await page.getByRole('link', { name: 'Tambah Siswa' }).click();
    await expect(page).toHaveURL(/.*tambah_siswa.html/);
  });

  test('3. Verifikasi Tabel Pendaftar dan Modal Detail', async ({ page }) => {
    // Cek apakah tabel berisi data David
    const tabel = page.locator('.dashboard-pendaftar-table');
    await expect(tabel).toContainText('David');

    // Klik tombol 'Lihat Detail' pada baris pertama
    await page.locator('.btn-lihat-detail').first().click();

    // Verifikasi apakah modal muncul dengan judul 'Detail Pendaftar'
    await expect(page.locator('.modal-title')).toBeVisible();
    await expect(page.locator('.modal-title')).toHaveText('Detail Pendaftar');

    // Cek apakah tombol aksi di dalam modal muncul
    await expect(page.locator('.action-button.diterima')).toBeVisible();
    await expect(page.locator('.action-button.ditolak')).toBeVisible();
  });

  test('4. Verifikasi Navigasi Sidebar', async ({ page }) => {
    // Mengetes navigasi ke Daftar Jadwal
    await page.getByRole('link', { name: 'Daftar Jadwal' }).click();
    await expect(page).toHaveURL(/.*daftar_jadwal.html/);
  });

});