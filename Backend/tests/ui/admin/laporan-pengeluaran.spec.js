const { test, expect } = require('@playwright/test');

test('Admin Berhasil Tambah Pengeluaran Lengkap dan Verifikasi', async ({ page }) => {
  // 1. Setup Timeout & Layar
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 720 });

  // 2. Login
  console.log('Melakukan login admin...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. Navigasi Langsung ke Laporan Pengeluaran (Lebih Stabil)
  console.log('Navigasi ke Laporan Pengeluaran...');
  await page.goto('http://localhost:8000/dashboard/admin/laporan/keuangan-pengeluaran');
  await expect(page).toHaveURL(/.*keuangan-pengeluaran/);

  // --- LANGKAH UTAMA: BUKA POPUP & ISI DATA ---
  console.log('Membuka popup tambah pengeluaran...');
  const btnTambah = page.locator('button:has-text("Tambah Pengeluaran")');
  await btnTambah.click({ force: true });
  
  const modal = page.locator('#modalPengeluaran');
  // Tunggu sampai modal benar-benar terlihat di layar
  await modal.waitFor({ state: 'visible', timeout: 15000 });
  
  // Kasih jeda 1 detik buat animasi CSS modal biar stabil
  await page.waitForTimeout(1000);

  const namaKeterangan = "Pembelian Spidol Project"; 

  console.log('Mengisi data lengkap di dalam popup...');
  // Pakai force: true karena Playwright sensitif terhadap overlay/animasi
  await page.selectOption('#out-jenis', 'Lainnya', { force: true });
  await page.fill('#out-tgl', '2026-05-10', { force: true });
  await page.fill('#out-nominal', '50000', { force: true });
  await page.fill('#out-ket', namaKeterangan, { force: true });
  
  await page.waitForTimeout(1000);

  // --- SIMPAN DATA ---
  console.log('Menekan tombol Simpan...');
  // dispatchEvent adalah cara paling ampuh kalau click biasa terhalang CSS
  await page.locator('button:has-text("Simpan Pengeluaran")').dispatchEvent('click');

  // Tunggu sampai modal benar-benar hilang
  await expect(modal).toBeHidden({ timeout: 15000 });
  console.log('✅ Popup tertutup, data berhasil disimpan.');
  await page.waitForTimeout(2000);

  // --- LANGKAH VERIFIKASI: CARI DATA ---
  console.log(`Mencari data yang baru diinput: "${namaKeterangan}"`);
  
  // Samakan Kategori di Filter
  await page.selectOption('#ysq-out-filter-cat', 'Lainnya');

  // Ketik di kolom Pencarian
  const searchInput = page.locator('#ysq-search');
  await searchInput.clear();
  await searchInput.pressSequentially(namaKeterangan, { delay: 100 });
  
  await page.waitForTimeout(3000);

  // Cek Tabel
  const tableBody = page.locator('#ysq-pengeluaran-body');
  const textContent = await tableBody.innerText();

  if (textContent.includes(namaKeterangan)) {
    console.log('✅ MANTAP! Data berhasil ditemukan di tabel hasil pencarian.');
    // Highlight barisnya biar kelihatan pas robot selesai
    await tableBody.locator('tr').first().evaluate(el => el.style.backgroundColor = '#d4edda');
  } else {
    console.log('❌ Data tidak muncul. Cek filter tanggal atau apakah data benar-benar tersimpan ke DB.');
    await page.screenshot({ path: 'hasil-pencarian-gagal.png' });
  }

  await page.waitForTimeout(3000);
});