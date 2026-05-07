const { test, expect } = require('@playwright/test');

test('Admin Berhasil Mencari dan Memfilter Daftar Santri', async ({ page }) => {
  // 1. Setup Layar
  await page.setViewportSize({ width: 1280, height: 720 });

  // 2. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. Navigasi ke Daftar Santri
  console.log('Membuka halaman Daftar Santri...');
  await page.goto('http://localhost:8000/dashboard/daftar-santri');
  
  // Tunggu elemen tabel siap
  const tableBody = page.locator('#santriTableBody');
  await page.waitForSelector('#santriTableBody tr', { state: 'visible', timeout: 200000 });

  // 4. Ambil Nama Santri Paling Atas (Dinamis)
  // Kita ambil teks dari kolom nama (cell ke-3 berdasarkan HTML kamu)
  const firstRow = tableBody.locator('tr').first();
  const namaSantriAtas = await firstRow.locator('td').nth(2).innerText();
  console.log(`Santri teratas ditemukan: ${namaSantriAtas}`);

  // 5. Gunakan Nama Tersebut untuk Mencari
  console.log(`Mencoba mencari nama: ${namaSantriAtas}...`);
  const searchInput = page.locator('.santri-search input');
  await searchInput.fill(namaSantriAtas);
  await searchInput.press('Enter');
  await page.waitForTimeout(10000);

  // 6. Verifikasi Hasil Pencarian
  await expect(async () => {
    const text = await tableBody.innerText();
    const rows = await tableBody.locator('tr').count();
    
    // Pastikan nama yang tadi kita ambil muncul di hasil pencarian
    if (!text.includes(namaSantriAtas) || rows === 0) {
      await page.click('.santri-search button'); // Klik manual kalau Enter gagal
      throw new Error('Hasil pencarian belum sesuai');
    }
  }).toPass({ timeout: 200000 });

  console.log(`Pencarian untuk ${namaSantriAtas} berhasil!`);
  await page.waitForTimeout(10000);

  // 7. Test Fitur Ekspor Data
  await expect(page.locator('#btn-export-santri')).toBeVisible();
  
  // 8. Kembali ke Dashboard
  await page.click('.back-btn-absensi');
  await expect(page).toHaveURL(/.*dashboard\/Admin/);

  console.log('Alhamdulillah! Tes Daftar Santri selesai.');
  await page.waitForTimeout(1000);
});