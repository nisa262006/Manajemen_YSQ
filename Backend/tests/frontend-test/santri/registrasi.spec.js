const { test, expect } = require('@playwright/test');

test('Flow Registrasi Santri sampai Halaman Berhasil', async ({ page }) => {
  // 1. Membuka Halaman Pendaftaran
  await page.goto('http://localhost:8000/Daftar'); 
  console.log('Membuka halaman pendaftaran...');

  // 2. Proses Pengisian Form (dengan jeda agar tidak terlalu cepat)
  await page.fill('#nama_lengkap', 'Prameswari Kirana');
  await page.waitForTimeout(500); // Jeda diperpendek sedikit agar tetap nyaman ditonton

  await page.fill('#alamat', 'Jl. Sahabat Qur\'an No. 123');
  await page.waitForTimeout(500);

  await page.fill('#tempat_lahir', 'Jakarta');
  await page.waitForTimeout(500);
  
  await page.fill('#tanggal_lahir', '2005-05-20');
  await page.waitForTimeout(500);
  
  await page.fill('#nomor_telepon', '081234567890');
  await page.waitForTimeout(500);

  // TIPS: Gunakan email unik setiap kali test dijalankan agar tidak Error Duplikat
  const emailUnik = `kirana_${Date.now()}@example.com`;
  await page.fill('#email', emailUnik);
  await page.waitForTimeout(500);

  // 3. Menyetujui Syarat & Ketentuan
  await page.check('#syarat_ketentuan');
  console.log('Menyetujui syarat dan ketentuan...');
  await page.waitForTimeout(500);

  // 4. Eksekusi Pendaftaran dengan Menunggu Navigasi
  console.log('Klik daftar, menunggu perpindahan halaman...');
  
  // Kita bungkus dalam Promise.all agar bot tidak "ketinggalan" saat halaman pindah
  await Promise.all([
    page.waitForNavigation({ url: /.*berhasil/, timeout: 10000 }), // Tunggu sampai URL berubah ke Berhasil
    page.click('.daftar-btn'), // Klik tombolnya
  ]);

  // 5. Verifikasi Halaman Berhasil.html
  // Memastikan teks "Alhamdulillah" muncul di layar setelah pindah halaman
  const suksesText = page.locator('h2');
  await expect(suksesText).toContainText('Alhamdulillah');
  console.log('Verifikasi Sukses: Halaman Berhasil ditemukan!');

  // 6. Mencoba Tombol Kembali ke Beranda
  await page.waitForTimeout(2000); 
  await page.click('text=kembali');
  
  // Memastikan kembali ke halaman utama (/)
  await expect(page).toHaveURL('http://localhost:8000/');
  
  await page.waitForTimeout(2000);
  console.log('Test selesai! Seluruh alur pendaftaran valid.');
});