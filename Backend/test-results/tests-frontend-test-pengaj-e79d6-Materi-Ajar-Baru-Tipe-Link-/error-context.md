# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\frontend-test\pengajar\materi-ajar.spec.js >> Pengajar Berhasil Menambah Materi Ajar Baru (Tipe Link)
- Location: tests\frontend-test\pengajar\materi-ajar.spec.js:3:1

# Error details

```
Error: page.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('a[href="/dashboard/pengajar/materi-ajar"]')

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Pengajar Berhasil Menambah Materi Ajar Baru (Tipe Link)', async ({ page }) => {
  4  |   test.setTimeout(90000);
  5  |   await page.setViewportSize({ width: 1280, height: 720 });
  6  | 
  7  |   // 1. LOGIN
  8  |   console.log('Login sebagai pengajar...');
  9  |   await page.goto('http://localhost:8000/login');
  10 |   await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  11 |   await page.fill('#password', 'pengajar123');
  12 |   await page.click('.login-button');
  13 |   await page.waitForLoadState('networkidle');
  14 | 
  15 |   // 2. NAVIGASI KE MATERI AJAR
  16 |   console.log('Membuka halaman Materi Ajar...');
> 17 |   await page.click('a[href="/dashboard/pengajar/materi-ajar"]');
     |              ^ Error: page.click: Target page, context or browser has been closed
  18 |   await page.waitForLoadState('domcontentloaded');
  19 | 
  20 |   // 3. FILTER KELAS (DIPERBAIKI)
  21 |   console.log('Mengatur filter kelas...');
  22 |   const selectKelas = page.locator('#materiKelasSelect');
  23 |   await page.waitForFunction(() => document.querySelectorAll('#materiKelasSelect option').length > 1);
  24 |   
  25 |   // Ambil value berdasarkan teks "Tahsin B"
  26 |   const valKelas = await page.evaluate(() => {
  27 |     const options = Array.from(document.querySelectorAll('#materiKelasSelect option'));
  28 |     const target = options.find(o => o.text.includes('Tahsin B'));
  29 |     return target ? target.value : null;
  30 |   });
  31 | 
  32 |   if (valKelas) {
  33 |     await selectKelas.selectOption(valKelas); // Pilih pakai String/Value murni
  34 |     console.log(`✅ Berhasil pilih kelas dengan value: ${valKelas}`);
  35 |   }
  36 |   
  37 |   await page.fill('#materiTanggal', '2026-05-11');
  38 |   await page.waitForTimeout(2000);
  39 | 
  40 |   // 4. BUKA MODAL
  41 |   console.log('Membuka modal tambah materi...');
  42 |   await page.click('.btn-buat-materi-utama');
  43 |   await expect(page.locator('#modalMateri')).toBeVisible();
  44 | 
  45 |   // 5. ISI FORM
  46 |   console.log('Mengisi formulir...');
  47 |   await page.fill('#judulMateri', 'Materi Tajwid Dasar: Nun Sukun');
  48 |   await page.fill('#deskripsiMateri', 'Pembahasan mendalam hukum Nun Sukun.');
  49 |   
  50 |   // Pilih Tipe Link
  51 |   await page.selectOption('#tipeMateri', 'link');
  52 |   
  53 |   const linkInput = page.locator('#linkMateri');
  54 |   await linkInput.waitFor({ state: 'visible' });
  55 |   await linkInput.fill('https://drive.google.com/file/d/contoh-materi');
  56 | 
  57 |   // 6. SIMPAN
  58 |   console.log('Menyimpan materi...');
  59 |   // Pakai dispatchEvent karena tombol submit kadang butuh dipicu langsung
  60 |   await page.locator('#formMateri button[type="submit"]').click();
  61 | 
  62 |   // 7. VERIFIKASI
  63 |   console.log('Verifikasi di tabel...');
  64 |   await page.waitForTimeout(5000);
  65 |   
  66 |   const tableBody = page.locator('#materiTableBody');
  67 |   const textBody = await tableBody.innerText();
  68 |   
  69 |   if (textBody.includes('Tajwid Dasar')) {
  70 |     console.log('✅ SELESAI: Materi berhasil masuk tabel!');
  71 |     await page.screenshot({ path: 'materi-sukses.png' });
  72 |   } else {
  73 |     console.log('⚠️ Materi mungkin tersimpan tapi tabel belum reload. Cek screenshot.');
  74 |     await page.screenshot({ path: 'materi-cek-manual.png' });
  75 |   }
  76 | });
```