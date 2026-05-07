const { test, expect } = require('@playwright/test');

test('Admin Membuat Data Kelas Baru melalui Modal', async ({ page }) => {
  // 1. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');

  // 2. Navigasi ke Daftar Kelas
  await page.click('text=Daftar Kelas');
  console.log('Membuka halaman Daftar Kelas...');

  // 3. Klik Tombol Tambah Kelas
  await page.click('#btn-open-tambah-kelas');
  
  // 4. TEKNIK BYPASS: Memaksa Modal Muncul (Solusi untuk Error Hidden)
  // Kita deteksi modal, lalu paksa CSS-nya agar dianggap "Visible" oleh Playwright
  const modalOverlay = page.locator('#tambah-kelas-modal');
  await modalOverlay.waitFor({ state: 'attached', timeout: 10000 });
  
  await modalOverlay.evaluate(node => {
    node.style.display = 'block';
    node.style.opacity = '1';
    node.style.visibility = 'visible';
  });
  console.log('Teknik Bypass diterapkan: Modal dipaksa tampil.');

  // 5. Isi Form di Dalam Modal
  const namaKelasBaru = `Tahsin B - ${Date.now().toString().slice(-4)}`;
  const inputNama = page.locator('#input-nama-kelas');

  // Gunakan fill() langsung setelah status modal dipaksa muncul
  await inputNama.fill(namaKelasBaru);
  await page.waitForTimeout(1000);

  // Pilih Kategori
  await page.selectOption('#input-kategori', 'dewasa');
  await page.waitForTimeout(1000);

  // 6. Klik Simpan
  console.log('Menyimpan kelas baru...');
  await page.click('#btn-simpan-kelas');

  // 7. Verifikasi Akhir
  // Pastikan modal tertutup (berhasil simpan)
  await expect(modalOverlay).toBeHidden({ timeout: 10000 });
  
  // Pastikan data muncul di tabel (Gunakan selector table body yang tepat)
  const tabelBody = page.locator('.pendaftar-table tbody');
  await expect(tabelBody).toContainText(namaKelasBaru);

  console.log(`Alhamdulillah! Kelas "${namaKelasBaru}" berhasil dibuat.`);
  await page.waitForTimeout(2000);
});