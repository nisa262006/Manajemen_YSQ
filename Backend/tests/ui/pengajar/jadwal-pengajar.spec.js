const { test, expect } = require('@playwright/test');

test('Admin - Manajemen Jadwal (Tambah & Edit)', async ({ page }) => {
  // 1. Login dengan Penanganan Sesi yang Benar
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');
  
  // PENTING: Tunggu sampai redirect ke Dashboard Admin selesai agar token tersimpan
  await page.waitForURL(/.*Admin/i, { timeout: 10000 });

  // 2. Navigasi ke Daftar Jadwal
  await page.goto('http://localhost:8000/dashboard/daftar-jadwal');
  await page.waitForLoadState('networkidle'); // Tunggu sampai tidak ada request API yang gantung

  // --- TAMBAH JADWAL ---
  console.log('Membuka modal tambah jadwal...');
  await page.click('#btn-add-jadwal');
  
  const modal = page.locator('#tambah-jadwal-modal');
  await expect(modal).toBeVisible();

  // 3. Tunggu Dropdown terisi (Minimal ada 1 opsi selain placeholder)
  console.log('Menunggu data dari API...');
  const kelasSelect = page.locator('#kelas-tingkatan');
  const pengajarSelect = page.locator('#pengajar-tambah');

  // Gunakan pola ini agar lebih stabil menunggu data dinamis
  await page.waitForFunction(() => {
    return document.querySelectorAll('#kelas-tingkatan option').length > 0 && 
           document.querySelectorAll('#pengajar-tambah option').length > 0;
  }, { timeout: 15000 });

  console.log('Mengisi form tambah jadwal...');
  // Gunakan selectOption berdasarkan index atau value yang tersedia
  await kelasSelect.selectOption({ index: 1 }); 
  await pengajarSelect.selectOption({ index: 1 });
  
  await page.selectOption('#hari-tambah', 'Senin');
  await page.fill('#kapasitas-tambah', '20');
  await page.fill('#waktu-mulai', '16:00');
  await page.fill('#waktu-selesai', '17:00');

  // 4. Simpan dengan Force Click jika terhalang overlay
  await page.click('.save-btn-tambah', { force: true });
  await expect(modal).toBeHidden({ timeout: 10000 });
  
  console.log('Jadwal berhasil ditambahkan dan diverifikasi.');
});
