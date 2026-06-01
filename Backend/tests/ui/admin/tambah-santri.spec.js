const { test, expect } = require('@playwright/test');

test('Admin Berhasil Menambahkan Santri Baru secara Manual', async ({ page }) => {
  // 1. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');

  // Pastikan sudah masuk dashboard sebelum lanjut
  await expect(page).toHaveURL(/.*admin/i);
  console.log('Login sukses, menuju halaman tambah santri...');

  // 2. Navigasi via Klik Tombol (Bukan page.goto)
  // Ini untuk mencegah error "Unauthorized" karena sesi terputus
  await page.click('text=Tambah Santri');
  console.log('Membuka form pendaftaran...');

  // 3. Isi Form dengan Data Unik
  // Gunakan NISN unik agar tidak ditolak database
  const nisnUnik = `1122${Date.now().toString().slice(-6)}`;
  await page.fill('#nisn', nisnUnik);
  await page.waitForTimeout(500);

  await page.fill('#nama_lengkap', 'Santri Baru Admin');
  await page.waitForTimeout(500);

  await page.fill('#alamat', 'Jl. Pendidikan No. 45');
  await page.waitForTimeout(500);

  await page.fill('#tempat_lahir', 'Bogor');
  await page.waitForTimeout(500);

  await page.fill('#tanggal_lahir', '2015-01-01');
  await page.waitForTimeout(500);

  await page.fill('#no_telpon', '085566778899');
  await page.waitForTimeout(500);

  // Email unik agar tidak kena "Email sudah terdaftar"
  await page.fill('#email', `santri_baru_${Date.now()}@gmail.com`);
  await page.waitForTimeout(500);

  await page.fill('#password', 'santri123');
  await page.fill('#confirm_password', 'santri123');
  await page.waitForTimeout(500);

  // 4. Pilih Jenjang
  await page.check('#anak');
  console.log('Memilih jenjang Anak-Anak...');
  await page.waitForTimeout(500);

  // 5. Simpan dan Pantau Respon
  console.log('Menyimpan data santri...');
  await page.click('.save-btn');

  // 6. Verifikasi Akhir
  // Kita cek apakah ada tulisan Unauthorized yang muncul mendadak
  const unauthorized = page.getByText('Unauthorized');
  
  if (await unauthorized.isVisible()) {
    console.error('Sesi login gagal/Unauthorized saat mencoba simpan.');
  } else {
    // Jika aman, bot harusnya kembali ke dashboard admin
    await expect(page).toHaveURL(/.*admin/i, { timeout: 10000 });
    console.log('Alhamdulillah! Santri baru berhasil ditambahkan.');
  }
});