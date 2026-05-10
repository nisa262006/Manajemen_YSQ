const { test, expect } = require('@playwright/test');

test('Pengajar Berhasil Melihat dan Memfilter Jadwal Kelas', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 720 });

  // 1. Login sebagai Pengajar
  console.log('Melakukan login...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  await page.fill('#password', 'pengajar123');
  await page.click('.login-button');

  // 2. Navigasi ke Halaman Jadwal
  console.log('Navigasi ke halaman Jadwal Kelas...');
  await page.click('a[href="/dashboard/pengajar/jadwal"]');
  await expect(page).toHaveURL(/.*jadwal/);
  await page.waitForLoadState('networkidle');

  // 3. Verifikasi Tabel Memuat Data
  console.log('Memeriksa tabel jadwal...');
  const tableJadwal = page.locator('#table_jadwal');
  // Tunggu sampai tulisan "Memuat jadwal..." hilang
  await expect(tableJadwal).not.toContainText('Memuat jadwal...', { timeout: 10000 });
  
  const jumlahJadwal = await tableJadwal.locator('tr').count();
  console.log(`Ditemukan ${jumlahJadwal} jadwal kelas.`);

  // 4. Tes Filter Tanggal
  console.log('Mencoba filter tanggal...');
  const inputTanggal = page.locator('#filter-tanggal');
  await inputTanggal.fill('2026-05-10'); // Sesuaikan dengan tanggal hari ini di sistem
  await page.waitForTimeout(2000); // Tunggu filter bekerja

  // 5. Tes Filter Kelas
  console.log('Mencoba filter kelas...');
  const selectKelas = page.locator('#filter-kelas');
  
  // Ambil opsi pertama yang tersedia selain "Semua Kelas"
  const options = await selectKelas.locator('option').allInnerTexts();
  if (options.length > 1) {
    console.log(`Memfilter berdasarkan kelas: ${options[1]}`);
    await selectKelas.selectOption({ index: 1 });
    await page.waitForTimeout(2000);
  }

  // 6. Verifikasi Tombol Ekspor Excel
  console.log('Memeriksa tombol ekspor...');
  const btnExport = page.locator('#export-excel');
  await expect(btnExport).toBeVisible();
  
  console.log('✅ SUKSES: Halaman jadwal berfungsi dengan baik.');
  await page.waitForTimeout(3000);
});