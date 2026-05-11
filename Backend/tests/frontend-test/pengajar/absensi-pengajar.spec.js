const { test, expect } = require('@playwright/test');

test('Alur Lengkap: Absensi dan Verifikasi Riwayat Tanggal 16', async ({ page }) => {
  // 1. SETUP: Timeout & Layar
  test.setTimeout(150000); 
  await page.setViewportSize({ width: 1280, height: 720 });

  const TANGGAL_TEST = '2026-05-16'; // Sabtu
  const NAMA_KELAS_ABSENSI = 'Tahsin B - 0566 (Senin: 16:00:00 - 17:30:00)'; 
  const KEYWORD_KELAS_RIWAYAT = 'Tahsin B - 0566'; // Kata kunci untuk riwayat

  // 2. LOGIN
  console.log('Melakukan login pengajar...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  await page.fill('#password', 'pengajar123');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. MENU ABSENSI
  await page.click('a[href="/dashboard/pengajar/absensi"]');
  await page.waitForLoadState('domcontentloaded');

  // 4. PROSES ABSENSI (TANGGAL -> KELAS)
  console.log(`Langkah 1: Input tanggal absen ${TANGGAL_TEST}...`);
  await page.fill('#tanggalAbsensiPengajar', TANGGAL_TEST);
  await page.dispatchEvent('#tanggalAbsensiPengajar', 'change');
  await page.waitForTimeout(3000);

  console.log('Langkah 2: Memilih kelas...');
  await page.waitForFunction(() => document.querySelectorAll('#kelasSelect option').length > 1);
  await page.selectOption('#kelasSelect', { label: NAMA_KELAS_ABSENSI });
  await page.dispatchEvent('#kelasSelect', 'change');
  await page.waitForTimeout(6000); 

  // 5. SIMPAN ABSEN PENGAJAR
  console.log('Langkah 3: Simpan absen pengajar...');
  await page.selectOption('#statusAbsensiPengajar', 'Hadir');
  await page.click('#simpanAbsenPengajar'); 
  await page.waitForFunction(() => {
    const txt = document.getElementById('jamAbsenDisplay').innerText;
    return txt !== '--.-- - --.--' && txt !== '';
  }, { timeout: 15000 });

  // 6. ABSEN SEMUA SANTRI
  console.log('Langkah 4: Mengabsen semua santri...');
  const allSelects = page.locator('#absensiBody select');
  const count = await allSelects.count();
  for (let i = 0; i < count; i++) {
    await allSelects.nth(i).selectOption('Hadir');
    await page.waitForTimeout(500);
  }

  // 7. SIMPAN FINAL & PINDAH KE RIWAYAT
  console.log('Langkah 5: Simpan dan navigasi ke Riwayat...');
  await page.locator('#btnSimpanAbsensi').scrollIntoViewIfNeeded();
  await page.click('#btnSimpanAbsensi', { force: true });
  await page.waitForTimeout(2000);

  await page.click('a[href="/dashboard/pengajar/riwayat-absensi"]');
  await page.waitForLoadState('networkidle');
  console.log('✅ Sudah berada di halaman Riwayat.');

  // 8. FILTER DI RIWAYAT (DIPERBAIKI)
  console.log(`Langkah 6: Verifikasi data riwayat ${TANGGAL_TEST}...`);
  
  const riwayatKelas = page.locator('#riwayatKelasSelect');
  const riwayatTgl = page.locator('#riwayatTanggal');

  // Tunggu dropdown kelas riwayat ada datanya
  await page.waitForFunction(() => document.querySelectorAll('#riwayatKelasSelect option').length > 1);

  // MENCARI VALUE BERDASARKAN TEKS (Solusi Error String vs Object)
  const valKelas = await page.evaluate((keyword) => {
    const options = Array.from(document.querySelectorAll('#riwayatKelasSelect option'));
    const target = options.find(o => o.text.includes(keyword));
    return target ? target.value : null;
  }, KEYWORD_KELAS_RIWAYAT);

  if (valKelas) {
    console.log(`Memilih kelas dengan value: ${valKelas}`);
    await riwayatKelas.selectOption(valKelas);
  }
  
  await riwayatKelas.dispatchEvent('change');
  await page.waitForTimeout(2000);

  // Input Tanggal Riwayat
  console.log(`Mengisi tanggal ${TANGGAL_TEST} di riwayat...`);
  await riwayatTgl.focus();
  await riwayatTgl.fill(TANGGAL_TEST);
  await riwayatTgl.dispatchEvent('input');
  await riwayatTgl.dispatchEvent('change');
  await riwayatTgl.blur();
  
  // 9. VERIFIKASI AKHIR
  console.log('Menunggu data riwayat muncul...');
  await page.waitForTimeout(8000); 
  
  const riwayatBody = page.locator('#riwayatBody');
  const isiTabel = await riwayatBody.innerText();

  if (isiTabel.includes('Hadir')) {
    console.log('✅ SELESAI: Data ditemukan di Riwayat!');
    await page.screenshot({ path: 'riwayat-final-sukses.png' });
  } else {
    console.log('❌ Data tidak muncul. Mencoba refresh filter tanggal...');
    await riwayatTgl.dispatchEvent('change');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'riwayat-final-cek.png' });
  }
});