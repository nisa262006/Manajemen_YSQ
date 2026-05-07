const { test, expect } = require('@playwright/test');

test('Admin Berhasil Menerima Pendaftaran Santri Baru', async ({ page }) => {
  // 1. Login sebagai Admin (Syarat masuk ke dashboard)
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');

  // 2. Pastikan sudah di Dashboard Admin
  await expect(page).toHaveURL(/.*admin/i);
  console.log('Login sukses, mencari data santri di tabel...');

// 3. Mencari & Mengklik Tombol "Lihat Detail" pada baris santri
  // Kita cari barisnya dulu
  const rowSantri = page.locator('#table-pendaftar-body tr', { hasText: 'Prameswari Kirana' }).first();
  
  // Pastikan baris ada, lalu klik tombol "Lihat Detail" yang ada di dalamnya
  const btnDetail = rowSantri.getByRole('button', { name: /Lihat Detail/i });
  
  await expect(btnDetail).toBeVisible({ timeout: 10000 });
  await btnDetail.click();
  console.log('Tombol Lihat Detail diklik, menunggu popup...');

  // 4. Verifikasi Popup Modal (Tambahkan force agar lebih yakin)
  const modal = page.locator('#popup-detail-pendaftar');
  await expect(modal).toBeVisible({ timeout: 7000 });

  // Pastikan detail nama yang muncul di modal sudah benar
  const detailName = page.locator('#detail-name');
  await expect(detailName).toHaveText('Prameswari Kirana');
  
  await page.waitForTimeout(1000);

  // Klik tombol "Diterima"
  await page.click('.btn-diterima');
  console.log('Tombol Diterima diklik!');

  // 5. Verifikasi Akhir
  // Pastikan popup tertutup otomatis setelah klik tombol terima
  await expect(modal).not.toBeVisible();
  console.log('Pendaftaran Prameswari Kirana sukses diterima oleh Admin.');
  
  await page.waitForTimeout(2000);
});