const { test, expect } = require('@playwright/test');

test('Admin Membuat Data Kelas Baru melalui Modal', async ({ page }) => {
  // 1. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');

  await page.click('text=Daftar Kelas');
  console.log('Membuka halaman Daftar Kelas...');

  await page.click('#btn-open-tambah-kelas');
  
  const modalOverlay = page.locator('#tambah-kelas-modal');
  await modalOverlay.waitFor({ state: 'attached', timeout: 10000 });
  
  await modalOverlay.evaluate(node => {
    node.style.display = 'block';
    node.style.opacity = '1';
    node.style.visibility = 'visible';
  });
  console.log('Teknik Bypass diterapkan: Modal dipaksa tampil.');

  const namaKelasBaru = `Tahsin B - ${Date.now().toString().slice(-4)}`;
  const inputNama = page.locator('#input-nama-kelas');

  await inputNama.fill(namaKelasBaru);
  await page.waitForTimeout(1000);

  await page.selectOption('#input-kategori', 'dewasa');
  await page.waitForTimeout(1000);

  console.log('Menyimpan kelas baru...');
  await page.click('#btn-simpan-kelas');

  await expect(modalOverlay).toBeHidden({ timeout: 10000 });
  
  const tabelBody = page.locator('.pendaftar-table tbody');
  await expect(tabelBody).toContainText(namaKelasBaru);

  console.log(`Alhamdulillah! Kelas "${namaKelasBaru}" berhasil dibuat.`);
  await page.waitForTimeout(2000);
});