// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pengujian Halaman Daftar Kelas Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    // Membuka halaman Daftar Kelas
    await page.goto('http://127.0.0.1:5500/folder-repo-1/daftar_kelas.html');
  });

  test('1. Verifikasi Filter dan Tabel Kelas', async ({ page }) => {
    // Pastikan judul halaman benar
    await expect(page.locator('.header-title')).toHaveText('Daftar Kelas');

    // Cek filter dropdown
    const filterTingkat = page.locator('#kelas_tingkatan');
    await filterTingkat.selectOption('tingkat_a');
    await expect(filterTingkat).toHaveValue('tingkat_a');

    // Verifikasi data di tabel (baris pertama)
    const row = page.locator('.class-list-table tbody tr').first();
    await expect(row).toContainText('Idat Awal');
    await expect(row).toContainText('SITI');
  });

  test('2. Verifikasi Modal Tambah Kelas', async ({ page }) => {
    // Klik tombol 'Tambah Kelas' menggunakan ID
    await page.locator('#btn-open-tambah-kelas').click();

    // Pastikan modal muncul
    const modal = page.locator('#tambah-kelas-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.modal-title-tambah-kelas')).toHaveText('Tambah Kelas');

    // Simulasi isi form
    await page.locator('#input-kelas-tingkatan').fill('Usman II (Dewasa)');
    await page.locator('#select-pengajar-kelas').selectOption('zahra');
    await page.locator('#input-kapasitas').fill('15');

    // Klik 'Batalkan' dan pastikan modal tertutup
    await page.locator('#btn-cancel-kelas').click();
    await expect(modal).not.toBeVisible();
  });

  test('3. Verifikasi Modal Lihat Santri', async ({ page }) => {
    // Klik icon mata (Lihat Santri) pada baris pertama
    await page.locator('.view-santri-btn').first().click();

    // Pastikan modal santri muncul
    const modalSantri = page.locator('#santri-modal');
    await expect(modalSantri).toBeVisible();
    await expect(page.locator('#modal-title')).toContainText('Daftar Santri Kelas');

    // Klik tombol close (x) pada modal
    await modalSantri.locator('.close-btn').click();
    await expect(modalSantri).not.toBeVisible();
  });

  test('4. Verifikasi Navigasi Kembali', async ({ page }) => {
    // Klik tombol Kembali ke Dashboard
    await page.locator('.back-btn').click();
    await expect(page).toHaveURL(/.*Admin.html/);
  });

});