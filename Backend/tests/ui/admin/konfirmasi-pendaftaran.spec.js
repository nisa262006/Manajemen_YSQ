const { test, expect } = require('@playwright/test');

test('Full Flow - Registrasi Santri Baru dan Konfirmasi Admin', async ({ page }) => {
  const uniqueId = Date.now();
  const namaSantri = `Santri Otomatis ${uniqueId}`;
  const emailSantri = `test${uniqueId}@gmail.com`;

  // --- LANGKAH 1: REGISTRASI SANTRI ---
  console.log('1. Membuka halaman pendaftaran...');
  await page.goto('http://localhost:8000/daftar');
  
  // Tunggu form siap
  const form = page.locator('#registrationForm');
  await expect(form).toBeVisible({ timeout: 10000 });

  console.log('Mengisi form registrasi...');
  await page.fill('#nama_lengkap', namaSantri); // FIX SELECTOR
  await page.fill('#alamat', 'Jl. Test No. 123');
  await page.fill('#tempat_lahir', 'Bogor');
  await page.fill('#tanggal_lahir', '2015-05-20');
  await page.fill('#nomor_telepon', '08123456789'); // FIX SELECTOR
  await page.fill('#email', emailSantri);
  
  // WAJIB: Centang Syarat & Ketentuan
  await page.check('#syarat_ketentuan');
  
  console.log('Klik daftar...');
  await page.click('.daftar-btn'); // FIX SELECTOR

  // Tunggu notifikasi atau redirect
  await page.waitForTimeout(2000); 
  console.log('Registrasi selesai.');

  // --- LANGKAH 2: ADMIN LOGIN ---
  console.log('2. Login sebagai Admin...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');

  // Pastikan masuk dashboard
  await expect(page).toHaveURL(/.*Admin/);
  console.log('Admin berhasil masuk dashboard.');

  // --- LANGKAH 3: KONFIRMASI PENDAFTAR ---
  console.log('3. Mencari pendaftar baru di tabel...');
  
  // Tunggu tabel memuat data (tunggu sampai row dengan nama muncul)
  const pendaftarRow = page.locator('#table-pendaftar-body tr', { hasText: namaSantri });
  await expect(pendaftarRow).toBeVisible({ timeout: 15000 });

  console.log('Pendaftar ditemukan, membuka detail...');
  await pendaftarRow.locator('.btn-detail').click();

  // Tunggu modal muncul
  const modalDetail = page.locator('#popup-detail-pendaftar');
  await expect(modalDetail).toBeVisible();

  console.log('Klik tombol Diterima...');
  await modalDetail.locator('.btn-diterima').click();

  // Validasi toast/notifikasi sukses jika ada
  console.log('Alhamdulillah! Santri berhasil dikonfirmasi.');
});
