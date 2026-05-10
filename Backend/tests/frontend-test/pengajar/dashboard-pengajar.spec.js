const { test, expect } = require('@playwright/test');

test('Pengajar Berhasil Login dan Cek Mini Profil', async ({ page }) => {
  // 1. Setup global timeout (60 detik)
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 720 });

  // 2. Login sebagai Pengajar
  console.log('Melakukan login sebagai Pengajar...');
  await page.goto('http://localhost:8000/login');
  
  // Gunakan kredensial yang kamu berikan
  await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  await page.fill('#password', 'pengajar123');
  await page.click('.login-button');

  // Tunggu dashboard muat sempurna
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/.*dashboard\/pengajar/);
  console.log('Berhasil masuk ke Dashboard Pengajar.');

  // 3. Cek Statistik Dashboard
  console.log('Memeriksa statistik kehadiran...');
  const kehadiran = page.locator('.persentase-kehadiran');
  await expect(kehadiran).toBeVisible();
  const textKehadiran = await kehadiran.innerText();
  console.log(`Persentase Kehadiran: ${textKehadiran}`);

  // 4. Buka Mini Profil di Header
  console.log('Mencoba membuka kartu profil mini...');
  
  // Pakai force click untuk memicu fungsi toggleMiniProfil()
  const userProfileBtn = page.locator('.user-profile');
  await userProfileBtn.click({ force: true });
  
  // Tunggu kartu profil mini (miniProfilCard) muncul
  const miniCard = page.locator('#miniProfilCard');
  
  // Karena animasinya mungkin lambat, kita pakai waitFor state attached/visible
  await miniCard.waitFor({ state: 'attached', timeout: 5000 });
  
  // Beri jeda 2 detik biar Prameswari bisa lihat kartunya muncul di layar
  await page.waitForTimeout(2000);

  // 5. Verifikasi Data di Mini Profil
  console.log('Memverifikasi data di mini profil...');
  const miniNama = await page.locator('#mini-nama').innerText();
  const miniEmail = await page.locator('#mini-email').innerText();
  
  console.log(`Nama di Profil: ${miniNama}`);
  console.log(`Email di Profil: ${miniEmail}`);

  // 6. Cek Tabel Jadwal
  const tableBody = page.locator('#dashboard-body');
  const textTable = await tableBody.innerText();
  
  if (textTable.includes('Memuat data...')) {
    console.log('Status: Tabel sedang memuat atau kosong.');
  } else {
    console.log('✅ SUKSES: Jadwal hari ini tampil di tabel.');
  }

  await page.waitForTimeout(3000);
});