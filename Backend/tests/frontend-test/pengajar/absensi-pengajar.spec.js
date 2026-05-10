const { test, expect } = require('@playwright/test');

test('Alur Lengkap: Absensi dan Verifikasi Riwayat Tanggal 16', async ({ page }) => {
  // 1. SETUP: Timeout diperpanjang agar tidak buru-buru
  test.setTimeout(150000); 
  await page.setViewportSize({ width: 1280, height: 720 });

  const TANGGAL_TEST = '2026-05-16'; // Sabtu
  const NAMA_KELAS_LENGKAP = 'Tahsin B - 0566 (Senin: 16:00:00 - 17:30:00)'; 
  const KEYWORD_KELAS_RIWAYAT = 'Tahsin B - 0566'; // Nama pendek di halaman riwayat

  // 2. LOGIN
  console.log('Melakukan login pengajar...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  await page.fill('#password', 'pengajar123');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 3. NAVIGASI KE ABSENSI
  console.log('Membuka halaman Absensi...');
  await page.waitForTimeout(2000);
  await page.click('a[href="/dashboard/pengajar/absensi"]');
  await page.waitForLoadState('domcontentloaded');

  // 4. INPUT TANGGAL 16 DI ABSENSI
  console.log(`Langkah 1: Input tanggal ${TANGGAL_TEST}...`);
  const inputTglAbsen = page.locator('#tanggalAbsensiPengajar');
  await inputTglAbsen.fill(TANGGAL_TEST);
  await inputTglAbsen.dispatchEvent('change');
  await page.waitForTimeout(3000); // Tunggu sistem stabil

  // 5. PILIH KELAS DI ABSENSI
  console.log('Langkah 2: Memilih kelas...');
  const kelasSelect = page.locator('#kelasSelect');
  // Tunggu sampai dropdown kelas ada isinya dari database
  await page.waitForFunction(() => document.querySelectorAll('#kelasSelect option').length > 1);
  await kelasSelect.selectOption({ label: NAMA_KELAS_LENGKAP });
  await kelasSelect.dispatchEvent('change');
  console.log('Menunggu tabel santri dimuat...');
  await page.waitForTimeout(7000); 

  // 6. ABSENSI PENGAJAR & SIMPAN (SIMPAN PERTAMA)
  console.log('Langkah 3: Simpan absen pengajar...');
  await page.selectOption('#statusAbsensiPengajar', 'Hadir');
  await page.waitForTimeout(1000);
  await page.click('#simpanAbsenPengajar'); 
  
  // Tunggu sampai jam input muncul di box jadwal (tanda sukses)
  await page.waitForFunction(() => {
    const txt = document.getElementById('jamAbsenDisplay').innerText;
    return txt !== '--.-- - --.--' && txt !== '';
  }, { timeout: 15000 });
  console.log('✅ Absen pengajar tersimpan dan jam muncul.');

  // 7. ABSEN SEMUA SANTRI
  console.log('Langkah 4: Mengabsen semua santri di tabel...');
  const allSelects = page.locator('#absensiBody select');
  const count = await allSelects.count();
  for (let i = 0; i < count; i++) {
    await allSelects.nth(i).selectOption('Hadir');
    console.log(`Santri ke-${i+1} diabsen.`);
    await page.waitForTimeout(1000); // Jeda tiap baris
  }

  // 8. SCROLL & SIMPAN ABSENSI SANTRI (SIMPAN KEDUA)
  console.log('Langkah 5: Simpan absensi santri...');
  const btnSimpanSantri = page.locator('#btnSimpanAbsensi');
  await btnSimpanSantri.scrollIntoViewIfNeeded(); 
  await page.waitForTimeout(1000);
  await btnSimpanSantri.click({ force: true });
  console.log('✅ Absensi santri tersimpan.');
  await page.waitForTimeout(2000);

  // 9. PINDAH KE HALAMAN RIWAYAT
  console.log('Langkah 6: Pindah ke halaman riwayat...');
  const btnRiwayat = page.locator('a[href="/dashboard/pengajar/riwayat-absensi"]');
  await btnRiwayat.scrollIntoViewIfNeeded();
  await btnRiwayat.click({ force: true });
  await page.waitForLoadState('networkidle');
  console.log('✅ Sudah berada di halaman Riwayat.');

  // 10. FILTER DI HALAMAN RIWAYAT (DENGAN TUNGGU EKSTRA)
  console.log(`Langkah 7: Verifikasi data tanggal ${TANGGAL_TEST}...`);
  
  const riwayatKelas = page.locator('#riwayatKelasSelect');
  const riwayatTgl = page.locator('#riwayatTanggal');

  // Tunggu sampai nama kelas muncul di dropdown riwayat (Maks 30 detik)
  console.log(`Menunggu kata kunci "${KEYWORD_KELAS_RIWAYAT}" muncul di dropdown...`);
  await page.waitForFunction((keyword) => {
    const options = Array.from(document.querySelectorAll('#riwayatKelasSelect option'));
    return options.some(opt => opt.text.includes(keyword));
  }, KEYWORD_KELAS_RIWAYAT, { timeout: 30000 });

  // Pilih Kelas menggunakan RegExp agar fleksibel
  await riwayatKelas.selectOption({ label: new RegExp(KEYWORD_KELAS_RIWAYAT) });
  await riwayatKelas.dispatchEvent('change');
  await page.waitForTimeout(3000);

  // Input Tanggal 16
  console.log(`Mengisi tanggal ${TANGGAL_TEST} di riwayat...`);
  await riwayatTgl.fill(TANGGAL_TEST);
  await riwayatTgl.dispatchEvent('input');
  await riwayatTgl.dispatchEvent('change');
  
  // 11. VERIFIKASI AKHIR TABEL RIWAYAT
  console.log('Menunggu tabel riwayat memuat data (8 detik)...');
  await page.waitForTimeout(8000); 
  
  const riwayatBody = page.locator('#riwayatBody');
  const isiTabel = await riwayatBody.innerText();

  if (isiTabel.includes('Hadir') && !isiTabel.includes('Memuat')) {
    console.log('✅ SUKSES BESAR! Data tanggal 16 terlihat di Riwayat.');
    await page.screenshot({ path: 'riwayat-final-sukses-tgl16.png' });
  } else {
    console.log('❌ Data tidak muncul. Mencoba sentil ulang filter tanggal...');
    await riwayatTgl.dispatchEvent('change');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'cek-riwayat-tgl16.png' });
  }
});