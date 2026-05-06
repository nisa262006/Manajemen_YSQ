const { test, expect } = require('@playwright/test');

test('Visual Check - Halaman Berhasil Pendaftaran', async ({ page }) => {
  // Arahkan langsung ke alamat server backend
  // Karena file kamu ada di Backend/public/views/berhasil.html, 
  // biasanya diakses via URL berikut:
  await page.goto('http://localhost:8000/views/berhasil.html');

  // 1. Pastikan Title Browser sudah benar
  await expect(page).toHaveTitle(/Pendaftaran Berhasil - Yayasan Sahabat Qur'an/);

  // 2. Pastikan Logo YSQ muncul
  const logo = page.locator('.success-logo');
  await expect(logo).toBeVisible();
  
  // 3. Cek apakah teks utama "Alhamdulillah" ada
  const heading = page.locator('h2');
  await expect(heading).toContainText('Alhamdulillah');
});
