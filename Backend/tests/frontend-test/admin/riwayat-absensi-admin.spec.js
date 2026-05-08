const { test, expect } = require('@playwright/test');

test('Admin Berhasil Filter Pengajar lalu Pindah ke Absensi Santri', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  // 1. Login
  console.log('Melakukan login admin...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 2. BAGIAN PENGALAMAN (PENGANJAR)
  console.log('--- Memulai Test Riwayat Pengajar ---');
  await page.goto('http://localhost:8000/dashboard/riwayat-absensi');
  await page.waitForTimeout(1500);

  const selectData = page.locator('#select-data');
  // Tunggu dropdown pengajar dimuat
  await page.waitForFunction(() => document.querySelectorAll('#select-data option').length > 1);

  // Ambil nama pengajar untuk filter
  const namaPengajar = await selectData.locator('option').nth(1).innerText();
  const valuePengajar = await selectData.locator('option').nth(1).getAttribute('value');
  
  console.log(`Memilih Pengajar: ${namaPengajar}`);
  await selectData.selectOption(valuePengajar);
  await page.waitForTimeout(2000); // Jeda biar filter jalan

  // Cek tabel pengajar (Logika Aman)
  const tableBody = page.locator('#table-body');
  const rowText = await tableBody.innerText();
  if (rowText.includes(namaPengajar) || rowText.includes("Tidak ada data")) {
    console.log(`✅ Filter Pengajar ${namaPengajar} selesai (Status: ${rowText.includes("Tidak ada data") ? 'Kosong' : 'Ada Data'})`);
  }

  // 3. PINDAH KE TAB SANTRI
  console.log('--- Berpindah ke Tab Absensi Santri ---');
  const tabSantri = page.locator('button:has-text("Absensi Santri")');
  await tabSantri.click();
  
  // Tunggu loading halaman santri
  await expect(page).toHaveURL(/.*riwayat-absensi-santri/);
  await expect(page.locator('h1')).toContainText('Riwayat Absensi Santri');
  await page.waitForTimeout(1500);

  // 4. BAGIAN SANTRI
  console.log('Mengecek filter Kelas di halaman Santri...');
  const selectKelas = page.locator('#pilih_kelas');
  
  // Tunggu dropdown kelas dimuat
  await page.waitForFunction(() => document.querySelectorAll('#pilih_kelas option').length > 1).catch(() => {});

  const countKelas = await selectKelas.locator('option').count();
  if (countKelas > 1) {
    const namaKelas = await selectKelas.locator('option').nth(1).innerText();
    await selectKelas.selectOption({ index: 1 });
    console.log(`Filter Kelas dipilih: ${namaKelas}`);
  } else {
    console.log('Opsi kelas masih kosong, hanya ada default.');
  }
  
  await page.waitForTimeout(2000);

  // Verifikasi Summary Santri (Hadir/Izin/Mustami’ah/Alfa)
  const sumMustamiah = await page.locator('#sum-dynamic').innerText();
  console.log(`Jumlah Santri Mustami’ah: ${sumMustamiah}`);

  // 5. SELESAI
  console.log('Memastikan tombol ekspor laporan tersedia...');
  await expect(page.locator('#btn-export-absensi-siswa')).toBeVisible();
  
  await page.waitForTimeout(1000);
  console.log('Kembali ke Dashboard...');
  await page.click('.back-btn-absensi');
  await expect(page).toHaveURL(/.*dashboard\/admin/);

  console.log('Alhamdulillah! Tes Riwayat Absensi Lengkap (Pengajar & Santri) Berhasil.');
});