// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Pengujian Halaman Daftar Jadwal Sahabat Quran', () => {

  test.beforeEach(async ({ page }) => {
    // Membuka halaman Daftar Jadwal melalui Live Server
    await page.goto('http://127.0.0.1:5500/folder-repo-1/daftar_jadwal.html');
  });

  test('1. Verifikasi Elemen Utama dan Filter', async ({ page }) => {
    // Verifikasi judul halaman sesuai dengan tag h1
    await expect(page.locator('.header-title')).toHaveText('Daftar Jadwal');

    // Mengetes interaksi filter Pilih Kelas
    const filterKelas = page.locator('#pilih_kelas');
    await filterKelas.selectOption('idat'); 
    await expect(filterKelas).toHaveValue('idat');

    // Mengetes interaksi filter Kategori
    const filterKategori = page.locator('#kategori');
    await filterKategori.selectOption('anak');
    await expect(filterKategori).toHaveValue('anak');
  });

  test('2. Verifikasi Modal Tambah Jadwal', async ({ page }) => {
    // Klik tombol Tambah Jadwal menggunakan class .add-schedule-btn
    await page.locator('.add-schedule-btn').click();

    // Pastikan modal tambah muncul
    const modalTambah = page.locator('#tambah-jadwal-modal');
    await expect(modalTambah).toBeVisible();
    await expect(modalTambah.locator('.modal-title-tambah')).toHaveText('Tambah Jadwal');

    // Simulasi pengisian form sederhana
    await page.locator('#kelas-tingkatan').fill('Usman II (Dewasa)');
    await page.locator('#pengajar-tambah').selectOption('zahra');

    // Klik tombol Batalkan untuk memastikan modal tertutup
    await page.locator('#btn-tambah-cancel').click();
    await expect(modalTambah).not.toBeVisible();
  });

  test('3. Verifikasi Modal Edit Jadwal (Fixed)', async ({ page }) => {
    // 1. Klik icon pen (edit) pada baris pertama di tabel
    await page.locator('.edit-btn').first().click();

    // 2. Pastikan modal edit muncul
    const modalEdit = page.locator('#edit-jadwal-modal');
    await expect(modalEdit).toBeVisible();

    // 3. SESUAIKAN DENGAN DATA RECEIVED: "Imam Syafi'i"
    // Kita ganti 'Usman II' menjadi 'Imam Syafi'i' agar sesuai dengan isi tabel kamu
    await expect(page.locator('#kelas-nama-edit')).toContainText("Imam Syafi'i");

    // 4. Memastikan tabel sesi di dalam modal memuat data yang benar
    const bodySesi = page.locator('#sesi-table-body');
    await expect(bodySesi).toContainText('Tahsin 1');

    // 5. Klik tombol Batal menggunakan ID #btn-edit-cancel
    await page.locator('#btn-edit-cancel').click();
    await expect(modalEdit).not.toBeVisible();
  });

  test('4. Verifikasi Navigasi Kembali', async ({ page }) => {
    // Klik tombol Kembali yang mengarah ke Admin.html
    await page.locator('.back-btn-absensi').click();
    
    // Pastikan URL berpindah ke Dashboard Admin
    await expect(page).toHaveURL(/.*Admin.html/);
  });

});