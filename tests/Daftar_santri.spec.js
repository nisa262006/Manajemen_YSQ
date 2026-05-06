// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pengujian Halaman Daftar Santri Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    // Membuka halaman Daftar Santri melalui Live Server
    await page.goto('http://127.0.0.1:5500/folder-repo-1/daftar_santri.html');
  });

  test('1. Verifikasi Elemen Utama dan Filter Santri', async ({ page }) => {
    // Pastikan judul halaman adalah Daftar Santri
    await expect(page.locator('.header-title')).toHaveText('Daftar Santri');

    // Mengetes filter Pilih Kelas Santri
    const filterKelas = page.locator('#pilih_kelas_santri');
    await filterKelas.selectOption('idat');
    await expect(filterKelas).toHaveValue('idat');

    // Mengetes filter Kategori Santri
    const filterKategori = page.locator('#kategori_santri');
    await filterKategori.selectOption('anak');
    await expect(filterKategori).toHaveValue('anak');
  });

  test('2. Verifikasi Fitur Pencarian dan Ekspor Data', async ({ page }) => {
    // Simulasi pengisian nama santri di kotak pencarian
    const searchBox = page.locator('.santri-search input');
    await searchBox.fill('David');
    await expect(searchBox).toHaveValue('David');

    // Memastikan tombol ekspor data tersedia
    await expect(page.locator('.export-santri-btn')).toBeVisible();
  });

  test('3. Verifikasi Data Santri pada Tabel', async ({ page }) => {
    // Mengambil baris pertama pada tabel santri
    const barisPertama = page.locator('.santri-list-table tbody tr').first();

    // Verifikasi NIM, Nama, dan Status
    await expect(barisPertama).toContainText('249078561');
    await expect(barisPertama).toContainText('David');
    await expect(barisPertama).toContainText('Aktif');

    // Verifikasi badge jenjang (Anak/Dewasa)
    await expect(barisPertama.locator('.status-anak')).toBeVisible();
  });

  test('4. Verifikasi Navigasi ke Detail Santri', async ({ page }) => {
    // Klik ikon pen (edit/detail) untuk santri pertama
    await page.locator('.edit-santri-link').first().click();

    // Pastikan halaman berpindah ke detail-santri.html
    await expect(page).toHaveURL(/.*detail-santri.html/);
  });

  test('5. Verifikasi Navigasi Kembali ke Dashboard', async ({ page }) => {
    // Klik tombol Kembali di bagian footer
    await page.locator('.back-btn-absensi').click();
    
    // Pastikan URL kembali ke halaman Admin
    await expect(page).toHaveURL(/.*Admin.html/);
  });

});