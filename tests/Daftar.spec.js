const { test, expect } = require('@playwright/test');
const path = require('path');

test('Fitur Registrasi Santri Baru - Yayasan Sahabat Qur\'an', async ({ page }) => {
  // 1. Alamat file (Gunakan path absolut agar tidak kena 404 lagi)
  const filePath = `file://${path.resolve(__dirname, '../Backend/public/views/Daftar.html')}`;
  await page.goto(filePath);

  // 2. Verifikasi Header (UI Check)
  await expect(page.locator('.title')).toHaveText('Registrasi Santri Baru');
  await expect(page.locator('.subtitle')).toContainText('Yayasan Sahabat Qur\'an');

  // 3. Isi Form Pendaftaran
  // Menggunakan ID yang sesuai dengan atribut 'id' di input HTML kamu
  await page.fill('#nama_lengkap', 'Prameswari Kirana Jingga'); 
  await page.fill('#alamat', 'Bogor, Jawa Barat');
  await page.fill('#tempat_lahir', 'Bogor');
  await page.fill('#tanggal_lahir', '2005-01-01'); // Format YYYY-MM-DD untuk input type="date"
  await page.fill('#nomor_telepon', '081234567890');
  await page.fill('#email', 'kirana@student.tazkia.ac.id');

  // 4. Centang Syarat & Ketentuan
  // checkbox ini punya id="syarat_ketentuan" dan status 'required'
  await page.check('#syarat_ketentuan');

  // 5. Klik Tombol Daftar
  // Tombol kamu punya class="btn daftar-btn"
  const submitBtn = page.locator('.daftar-btn');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // 6. Validasi setelah klik (Opsional)
  // Karena ada <script src="/js/register.js"></script>, 
  // Playwright akan menunggu proses dari script tersebut.
});