// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pengujian Halaman Daftar Registrasi Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    // Membuka halaman Daftar Registrasi melalui Live Server
    await page.goto('http://127.0.0.1:5500/folder-repo-1/daftar_registrasi.html');
  });

  test('1. Verifikasi Statistik Registrasi (Fixed)', async ({ page }) => {
    // Pastikan judul header sesuai
    await expect(page.locator('.header-title')).toHaveText('Daftar Registrasi');

    // Verifikasi kartu statistik pendaftaran dengan pencarian teks yang presisi
    // Menambahkan { exact: true } untuk menghindari duplikasi dengan teks di modal detail
    await expect(page.getByText('Menunggu verifikasi', { exact: true })).toBeVisible();
    await expect(page.getByText('Sisa Kuota')).toBeVisible();
    
    // Verifikasi nilai statistik (angka 12)
    const statValue = page.locator('.stat-value').first();
    await expect(statValue).toHaveText('12');
  });

  test('2. Verifikasi Pencarian dan Ekspor', async ({ page }) => {
    // Cek input pencarian untuk nama 'Jingga'
    const searchInput = page.locator('.search-box input');
    await searchInput.fill('Jingga');
    await expect(searchInput).toHaveValue('Jingga');

    // Pastikan tombol ekspor laporan tersedia
    await expect(page.locator('.export-btn')).toBeVisible();
  });

  test('3. Verifikasi Modal Detail Pendaftar', async ({ page }) => {
    // Klik tombol 'Lihat Detail' pada baris pertama
    await page.locator('.btn-lihat-detail').first().click();

    // Pastikan modal detail muncul
    const modalDetail = page.locator('#detail-pendaftar-modal');
    await expect(modalDetail).toBeVisible();
    await expect(modalDetail.locator('.modal-title')).toHaveText('Detail Pendaftar');

    // Verifikasi tombol aksi 'Diterima' dan 'Ditolak' di dalam modal
    await expect(page.locator('.action-button.diterima')).toBeVisible();
    await expect(page.locator('.action-button.ditolak')).toBeVisible();

    // Tutup modal menggunakan tombol close (x)
    await page.locator('.close-button').click();
    await expect(modalDetail).not.toBeVisible();
  });

  test('4. Verifikasi Keamanan Reset Pendaftaran', async ({ page }) => {
    // Klik tombol Reset Pendaftaran Tahunan
    await page.locator('.reset-btn').click();

    // Pastikan modal konfirmasi keamanan muncul
    const modalReset = page.locator('#konfirmasi-reset-modal');
    await expect(modalReset).toBeVisible();
    await expect(modalReset.locator('.reset-title')).toContainText('Konfirmasi Reset');

    // Klik tombol Batalkan untuk memastikan data aman (tidak terhapus)
    await page.locator('#btn-reset-cancel').click();
    await expect(modalReset).not.toBeVisible();
  });

  test('5. Verifikasi Navigasi Kembali', async ({ page }) => {
    // Klik tombol Kembali ke Dashboard Admin
    await page.locator('.back-btn').click();
    await expect(page).toHaveURL(/.*Admin.html/);
  });

});