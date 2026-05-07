const { test, expect } = require('@playwright/test');

test('Login Admin - Verifikasi Akses Dashboard', async ({ page }) => {
  // 1. Membuka Halaman Login
  await page.goto('http://localhost:8000/login'); 
  console.log('Membuka halaman login untuk Admin...');

  // 2. Masukkan Kredensial Admin
  // Menggunakan id="identifier" dan id="password" sesuai HTML kamu
  await page.fill('#identifier', 'admin1');
  await page.waitForTimeout(1000); // Jeda agar gerakan bot terlihat

  await page.fill('#password', 'admin1');
  await page.waitForTimeout(1000);

  // 3. Klik Tombol Login
  console.log('Klik tombol login admin...');
  await page.click('.login-button');

  // 4. Verifikasi Berhasil Masuk ke Halaman Admin
  // Pastikan URL tujuan setelah login admin mengandung kata 'admin'
  // Gunakan /i agar tidak sensitif terhadap huruf besar/kecil
  await expect(page).toHaveURL(/.*admin/i, { timeout: 10000 });
  
  // Verifikasi apakah ada elemen khas dashboard admin, misalnya judul dashboard
  console.log('Login Admin berhasil! Siap mengonfirmasi registrasi santri.');
});