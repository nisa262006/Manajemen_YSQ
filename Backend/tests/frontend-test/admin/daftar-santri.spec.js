const { test, expect } = require('@playwright/test');

test('Admin Berhasil Mencari dan Memfilter Daftar Santri', async ({ page }) => {
  // 1. Setup Layar (Biar lega pas dilihat)
  await page.setViewportSize({ width: 1280, height: 720 });

  // 2. Login Admin
  console.log('Melakukan login admin...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. Navigasi ke Daftar Santri
  console.log('Membuka halaman Daftar Santri...');
  await page.goto('http://localhost:8000/dashboard/daftar-santri');
  
  // Tunggu tabel siap dan muncul di layar
  const tableBody = page.locator('#santriTableBody');
  await page.waitForSelector('#santriTableBody tr', { state: 'visible', timeout: 30000 });
  
  // Jeda sebentar biar kita bisa lihat tabel awal
  await page.waitForTimeout(1500);

  // 4. Ambil Nama Santri Paling Atas (Dinamis)
  const firstRow = tableBody.locator('tr').first();
  const namaSantriAtas = await firstRow.locator('td').nth(2).innerText();
  console.log(`Santri teratas ditemukan: ${namaSantriAtas}`);

  // Highlight baris yang akan dicari (opsional - biar keren)
  await firstRow.evaluate(el => el.style.backgroundColor = '#ffffcc');
  await page.waitForTimeout(1000);

  // 5. Gunakan Nama Tersebut untuk Mencari (Efek Mengetik Manusia)
  console.log(`Mencoba mencari nama: ${namaSantriAtas}...`);
  const searchInput = page.locator('.santri-search input');
  
  // Membersihkan input jika ada teks sisa
  await searchInput.clear();
  
  // Efek mengetik satu-persatu dengan jeda 150ms
  await searchInput.pressSequentially(namaSantriAtas, { delay: 150 });
  
  // Jeda setelah selesai mengetik sebelum tekan Enter
  await page.waitForTimeout(800);
  await searchInput.press('Enter');

  // 6. Verifikasi Hasil Pencarian
  await expect(async () => {
    const text = await tableBody.innerText();
    const rows = await tableBody.locator('tr').count();
    
    // Validasi apakah nama yang dicari ada di tabel hasil
    if (!text.includes(namaSantriAtas) || rows === 0) {
      // Klik tombol cari manual jika tekan Enter tidak merespon
      await page.click('.santri-search button'); 
      throw new Error('Hasil pencarian belum sesuai atau data tidak muncul');
    }
  }).toPass({ timeout: 15000 });

  console.log(`Alhamdulillah, pencarian untuk ${namaSantriAtas} berhasil!`);
  
  // Beri waktu 3 detik agar Prameswari bisa melihat hasil pencariannya
  await page.waitForTimeout(3000);

  // 7. Test Fitur Ekspor Data
  console.log('Memastikan tombol ekspor tersedia...');
  await expect(page.locator('#btn-export-santri')).toBeVisible();
  
  // 8. Kembali ke Dashboard
  console.log('Kembali ke Dashboard Admin...');
  await page.click('.back-btn-absensi');
  await expect(page).toHaveURL(/.*dashboard\/Admin/);

  console.log('Tes Daftar Santri selesai dengan sempurna!');
  await page.waitForTimeout(2000);
});