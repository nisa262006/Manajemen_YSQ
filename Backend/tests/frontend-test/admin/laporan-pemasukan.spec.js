const { test, expect } = require('@playwright/test');

test('Admin Berhasil Memfilter dan Mengecek Laporan Pemasukan', async ({ page }) => {
  // 1. Setup Layar
  await page.setViewportSize({ width: 1280, height: 720 });

  // 2. Login Admin
  console.log('Login admin...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. Navigasi ke Laporan Pemasukan via Sidebar
  console.log('Navigasi ke Laporan Pemasukan...');
  // Klik menu laporan dulu untuk membuka submenu
  await page.click('#laporan-btn'); 
  await page.waitForTimeout(500);
  await page.click('text=Keuangan Pemasukan');
  
  await expect(page).toHaveURL(/.*keuangan-pemasukan/);
  await expect(page.locator('.header-title')).toContainText('Laporan Pemasukan Keuangan');

  // 4. Isi Filter Tanggal
  console.log('Mengisi filter periode...');
  await page.fill('#ysq-date-start', '2026-01-01');
  await page.fill('#ysq-date-end', '2026-12-31');
  await page.waitForTimeout(500);

  // 5. Filter Kategori (Infaq Belajar)
  console.log('Mengubah kategori ke Infaq Belajar...');
  const selectCat = page.locator('#ysq-filter-cat');
  await selectCat.selectOption('iuran'); // 'iuran' sesuai value di HTML
  
  // Klik tombol Tampilkan Data
  await page.click('.ysq-main-generate');
  console.log('Menampilkan data...');
  await page.waitForTimeout(2000); // Jeda agar data termuat

  // 6. Verifikasi Kartu Summary (Angka Nominal)
  console.log('Memverifikasi summary nominal...');
  const totalGross = page.locator('#ysq-total-gross');
  await expect(totalGross).toBeVisible();
  const nominalText = await totalGross.innerText();
  console.log(`Total Pemasukan Gross saat ini: ${nominalText}`);

  // 7. Verifikasi Tabel
  const tableBody = page.locator('#ysq-income-body');
  const rowContent = await tableBody.innerText();
  
  if (rowContent.includes("Rp")) {
    console.log('✅ Data transaksi ditemukan di tabel.');
  } else {
    console.log('ℹ️ Tabel kosong atau data tidak ditemukan untuk periode ini.');
  }

  // 8. Cek Tombol Export (PDF & Excel)
  console.log('Mengecek ketersediaan tombol export...');
  const btnPdf = page.locator('button:has-text("Export PDF")');
  const btnExcel = page.locator('button:has-text("Export Excel")');
  
  await expect(btnPdf).toBeVisible();
  await expect(btnExcel).toBeVisible();
  
  // Highlight tombol export sebentar
  await btnPdf.evaluate(el => el.style.border = '2px solid red');
  await page.waitForTimeout(1000);

  // 9. Selesai
  console.log('Alhamdulillah! Tes Laporan Pemasukan selesai.');
  await page.waitForTimeout(2000);
});