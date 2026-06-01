const { test, expect } = require('@playwright/test');

test('Admin Berhasil Mencari Daftar Pengajar secara Dinamis', async ({ page }) => {
  // 1. Setup Layar
  await page.setViewportSize({ width: 1280, height: 720 });

  // 2. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. Navigasi ke Daftar Pengajar
  console.log('Membuka halaman Daftar Pengajar...');
  await page.goto('http://localhost:8000/dashboard/daftar-pengajar');

  // Tunggu tabel dimuat
  const tableBody = page.locator('#pengajarTableBody');
  await page.waitForSelector('#pengajarTableBody tr', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000); // Jeda visual agar mata bisa melihat tabel

  // 4. Ambil Nama Pengajar Teratas (Kolom ke-3: NO, NIP, Nama)
  const firstRow = tableBody.locator('tr').first();
  const namaPengajarAtas = await firstRow.locator('td').nth(2).innerText();
  console.log(`Pengajar teratas ditemukan: ${namaPengajarAtas}`);

  // Beri highlight sedikit biar keren pas demo
  await firstRow.evaluate(el => el.style.backgroundColor = '#e1f5fe');
  await page.waitForTimeout(1000);

  // 5. Fitur Pencarian Nama (Mengetik Manusiawi)
  console.log(`Mencari nama pengajar: ${namaPengajarAtas}...`);
  const searchInput = page.locator('.teacher-search-input input');

  // Ketik satu-satu biar robotnya nggak balapan
  await searchInput.pressSequentially(namaPengajarAtas, { delay: 150 });
  await page.waitForTimeout(500);
  await searchInput.press('Enter');

  // 6. Verifikasi Hasil di Tabel
  await expect(async () => {
    const text = await tableBody.innerText();
    const rows = await tableBody.locator('tr').count();

    if (!text.includes(namaPengajarAtas) || rows === 0) {
      // Klik tombol search manual sebagai cadangan
      await page.click('.search-btn');
      throw new Error('Hasil pencarian pengajar belum muncul');
    }
  }).toPass({ timeout: 15000 });

  console.log(`Pencarian untuk ${namaPengajarAtas} Berhasil!`);
  await page.waitForTimeout(2000);

  // 7. Test Fitur Edit Pengajar
  console.log('Mencoba mengedit data pengajar...');
  const editBtn = firstRow.locator('.edit-btn');
  await editBtn.click();

  // Tunggu halaman detail pengajar
  await expect(page).toHaveURL(/.*detail-pengajar.*/);
  console.log('Berhasil masuk ke halaman detail pengajar.');

  // Klik tombol Edit untuk mengaktifkan form
  await page.click('#btn-edit-pengajar');
  console.log('Form edit diaktifkan.');

  // Ubah alamat sebagai contoh
  const alamatBaru = 'Alamat Pengajar Baru ' + Date.now();
  await page.fill('#pengajar-alamat', alamatBaru);

  // Ubah status jika perlu
  await page.selectOption('#pengajar-status', 'aktif');

  console.log('Menyimpan perubahan pengajar...');

  // Handler untuk menutup alert secara otomatis agar redirect bisa berjalan
  page.once('dialog', async dialog => {
    console.log(`Alert muncul: ${dialog.message()}`);
    await dialog.accept();
  });

  await page.click('#btn-simpan-pengajar-footer');

  // Tunggu redirect kembali ke daftar pengajar (Sudah diperbaiki di admin_data.js)
  await expect(page).toHaveURL(/.*dashboard\/daftar-pengajar/, { timeout: 15000 });
  console.log('Alhamdulillah! Edit pengajar berhasil dan kembali ke daftar pengajar.');

  // 8. Kembali ke Dashboard
  console.log('Kembali ke Dashboard...');
  await page.goto('http://localhost:8000/dashboard/Admin');
  await expect(page).toHaveURL(/.*dashboard\/Admin/);

  console.log('Alhamdulillah! Tes Daftar Pengajar selesai.');
  await page.waitForTimeout(2000);
});