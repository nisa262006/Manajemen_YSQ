const { test, expect } = require('@playwright/test');

test.describe('Pengujian Halaman Daftar Jadwal Sahabat Quran', () => {
    
    // Ganti URL dengan URL lokal atau staging Anda
    const URL = 'http://localhost:8000/dashboard/daftar-jadwal';

    test.beforeEach(async ({ page }) => {
        await page.goto(URL);
    });

    test('Harus menampilkan judul halaman dan sidebar aktif', async ({ page }) => {
        await expect(page.locator('h1.header-title')).toHaveText('Daftar Jadwal');
        
        // Memastikan menu 'Daftar Jadwal' memiliki class active
        const activeMenu = page.locator('a.menu-item.active');
        await expect(activeMenu).toContainText('Daftar Jadwal');
    });

    test('Harus bisa melakukan filter berdasarkan kategori', async ({ page }) => {
        const selectKategori = page.locator('#kategori');
        
        // Pilih kategori Anak
        await selectKategori.selectOption('anak');
        await expect(selectKategori).toHaveValue('anak');

        // Pilih kategori Dewasa
        await selectKategori.selectOption('dewasa');
        await expect(selectKategori).toHaveValue('dewasa');
    });

    test('Harus bisa membuka dan menutup modal Tambah Jadwal', async ({ page }) => {
        const btnTambah = page.locator('#btn-add-jadwal');
        const modalTambah = page.locator('#tambah-jadwal-modal');

        // Klik tombol tambah
        await btnTambah.click();
        await expect(modalTambah).toBeVisible();

        // Isi form contoh
        await page.locator('#hari-tambah').selectOption('Senin');
        await page.locator('#kapasitas-tambah').fill('20');
        await page.locator('#waktu-mulai').fill('08:00');
        await page.locator('#waktu-selesai').fill('10:00');

        // Klik tombol batalkan untuk menutup
        await page.locator('#btn-tambah-cancel').click();
        await expect(modalTambah).not.toBeVisible();
    });

    test('Harus bisa membuka modal Setting Profil', async ({ page }) => {
        await page.locator('#btn-open-profil').click();
        
        const modalProfil = page.locator('#popup-profile-setting');
        await expect(modalProfil).toBeVisible();

        // Cek input nama di dalam modal profil
        await expect(page.locator('#profile-name-input')).toBeVisible();
        
        // Tutup modal
        await page.locator('#btn-close-profil-x').click();
        await expect(modalProfil).not.toBeVisible();
    });

    test('Navigasi Sidebar - Laporan Submenu Toggle', async ({ page }) => {
        const laporanBtn = page.locator('#laporan-btn');
        const submenu = page.locator('#laporan-submenu');

        // Secara default submenu mungkin tersembunyi atau terlihat tergantung CSS awal
        // Kita simulasikan klik untuk interaksi
        await laporanBtn.click();
        
        // Pastikan link di dalamnya ada
        await expect(page.locator('text=Keuangan Pemasukan')).toBeVisible();
        await expect(page.locator('text=Keuangan Pengeluaran')).toBeVisible();
    });

    test('Cek Tabel Jadwal', async ({ page }) => {
        // Memastikan tabel ada
        const table = page.locator('table.schedule-list-table');
        await expect(table).toBeVisible();
        
        // Memastikan header tabel benar
        const headers = table.locator('thead th');
        await expect(headers.nth(1)).toHaveText('Kelas');
        await expect(headers.nth(3)).toHaveText('Hari');
    });
});