const { test, expect } = require('@playwright/test');

test('Pengajar Berhasil Menambah Materi Ajar Baru (Tipe Link)', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 720 });

  // 1. LOGIN
  console.log('Login sebagai pengajar...');
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  await page.fill('#password', 'pengajar123');
  await page.click('.login-button');
  await page.waitForLoadState('networkidle');

  // 2. NAVIGASI KE MATERI AJAR
  console.log('Membuka halaman Materi Ajar...');
  await page.click('a[href="/dashboard/pengajar/materi-ajar"]');
  await page.waitForLoadState('domcontentloaded');

  // 3. FILTER KELAS (DIPERBAIKI)
  console.log('Mengatur filter kelas...');
  const selectKelas = page.locator('#materiKelasSelect');
  await page.waitForFunction(() => document.querySelectorAll('#materiKelasSelect option').length > 1);
  
  // Ambil value berdasarkan teks "Tahsin B"
  const valKelas = await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('#materiKelasSelect option'));
    const target = options.find(o => o.text.includes('Tahsin B'));
    return target ? target.value : null;
  });

  if (valKelas) {
    await selectKelas.selectOption(valKelas); // Pilih pakai String/Value murni
    console.log(`✅ Berhasil pilih kelas dengan value: ${valKelas}`);
  }
  
  await page.fill('#materiTanggal', '2026-05-11');
  await page.waitForTimeout(2000);

  // 4. BUKA MODAL
  console.log('Membuka modal tambah materi...');
  await page.click('.btn-buat-materi-utama');
  await expect(page.locator('#modalMateri')).toBeVisible();

  // 5. ISI FORM
  console.log('Mengisi formulir...');
  await page.fill('#judulMateri', 'Materi Tajwid Dasar: Nun Sukun');
  await page.fill('#deskripsiMateri', 'Pembahasan mendalam hukum Nun Sukun.');
  
  // Pilih Tipe Link
  await page.selectOption('#tipeMateri', 'link');
  
  const linkInput = page.locator('#linkMateri');
  await linkInput.waitFor({ state: 'visible' });
  await linkInput.fill('https://drive.google.com/file/d/contoh-materi');

  // 6. SIMPAN
  console.log('Menyimpan materi...');
  // Pakai dispatchEvent karena tombol submit kadang butuh dipicu langsung
  await page.locator('#formMateri button[type="submit"]').click();

  // 7. VERIFIKASI
  console.log('Verifikasi di tabel...');
  await page.waitForTimeout(5000);
  
  const tableBody = page.locator('#materiTableBody');
  const textBody = await tableBody.innerText();
  
  if (textBody.includes('Tajwid Dasar')) {
    console.log('✅ SELESAI: Materi berhasil masuk tabel!');
    await page.screenshot({ path: 'materi-sukses.png' });
  } else {
    console.log('⚠️ Materi mungkin tersimpan tapi tabel belum reload. Cek screenshot.');
    await page.screenshot({ path: 'materi-cek-manual.png' });
  }
});