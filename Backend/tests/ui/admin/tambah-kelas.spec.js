const { test, expect } = require('@playwright/test');

test('Admin Berhasil Plotting Santri ke dalam Kelas dan Sesi', async ({ page }) => {
  // 1. Setup Tampilan agar Konsisten
  await page.setViewportSize({ width: 1280, height: 720 }); // Gunakan ukuran standar agar tidak "penyok"

  // 2. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');
  
  // Tunggu sesi login stabil
  await page.waitForLoadState('networkidle');

  // 3. Navigasi ke Halaman Tambah Kelas
  console.log('Membuka halaman Plotting...');
  await page.goto('http://localhost:8000/dashboard/tambah-kelas');
  
  // Tunggu CSS dan elemen utama muncul
  await page.waitForSelector('#kelas', { state: 'visible' });
  await page.waitForLoadState('domcontentloaded');

  // 4. Filter Santri (Logika Pancingan Kamu)
  await page.selectOption('#kelas', 'menunggu');
  
  const tableData = page.locator('table').last();
  await expect(async () => {
    const text = await tableData.innerText();
    if (text.includes('Tidak ada santri') || text.includes('Gagal')) {
      // Pancing ulang filternya sesuai logika kamu
      await page.selectOption('#kelas', 'semua');
      await page.waitForTimeout(1500);
      await page.selectOption('#kelas', 'menunggu');
      throw new Error('Menunggu data dari API...');
    }
  }).toPass({ timeout: 30000 });
  console.log('Data santri muncul!');

  // Mengambil value kelas secara dinamis (mencari yang mengandung Tahsin B DAN Dewasa)
  const plottingOption = page.locator('#id_kelas option').filter({ hasText: /Tahsin B - .* Dewasa/ }).first();
  const valuePlotting = await plottingOption.getAttribute('value');
  await page.selectOption('#id_kelas', valuePlotting);
  
  const selectSesi = page.locator('#id_jadwal');
  await expect(async () => {
    const count = await selectSesi.locator('option').count();
    if (count <= 1) throw new Error('Sesi masih kosong');
  }).toPass({ timeout: 20000 });

  await selectSesi.selectOption({ index: 1 });
  console.log('Kelas dan Sesi berhasil dipilih.');

  // 6. Ceklis & Simpan
  // Pastikan klik checkbox pertama di tabel data
  await tableData.locator('input[type="checkbox"]').first().check();
  await page.waitForTimeout(1500); // Jeda pendek agar aman
  await page.click('#btn-simpan-kelas-selection');

  // 7. Verifikasi Hasil
  const toast = page.locator('#notification-toast');
  await expect(toast).toBeVisible({ timeout: 20000 });
  
  console.log('Alhamdulillah! Plotting Sukses.');
  await page.waitForTimeout(2000);
});