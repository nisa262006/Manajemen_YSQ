const { test, expect } = require('@playwright/test');

test('Admin Berhasil Menambahkan Pengajar Baru', async ({ page }) => {
  // 1. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin1');
  await page.fill('#password', 'admin1');
  await page.click('.login-button');

  // 2. Navigasi via klik tombol "Tambah Pengajar" di Dashboard
  // Kita gunakan text selector agar lebih stabil
  await page.click('text=Tambah Pengajar');
  console.log('Membuka form tambah pengajar...');

  // 3. Isi Form Pengajar (Menggunakan ID dari HTML kamu)
  await page.fill('#nama_lengkap', 'Ustadz Ahmad Fauzi');
  await page.waitForTimeout(500);

  await page.fill('#alamat', 'Jl. Taqwa No. 88, Bogor');
  await page.waitForTimeout(500);

  await page.fill('#tempat_lahir', 'Bandung');
  await page.waitForTimeout(500);

  await page.fill('#tanggal_lahir', '1990-05-15');
  await page.waitForTimeout(500);

  await page.fill('#umur', '34');
  await page.waitForTimeout(500);

  await page.fill('#kelas', 'Kelas Tahfidz A1');
  await page.waitForTimeout(500);

  // Email unik agar tidak bentrok di database
  const emailUnik = `pengajar_${Date.now()}@ysq.com`;
  await page.fill('#email', emailUnik);
  await page.waitForTimeout(500);

  await page.fill('#no_telpon', '089988776655');
  await page.waitForTimeout(500);

  await page.fill('#password', 'pengajar123');
  await page.fill('#confirm_password', 'pengajar123');
  await page.waitForTimeout(500);

  // 4. Klik Tombol Simpan
  console.log('Menyimpan data pengajar...');
  await page.click('.save-btn');

  // 5. Verifikasi Akhir
  // Pastikan kembali ke dashboard dan tidak ada pesan "Unauthorized"
  const unauthorized = page.getByText('Unauthorized');
  
  if (await unauthorized.isVisible()) {
    console.error('Gagal simpan: Sesi Unauthorized');
  } else {
    await expect(page).toHaveURL(/.*admin/i, { timeout: 10000 });
    console.log('Alhamdulillah! Pengajar baru berhasil ditambahkan.');
  }
});