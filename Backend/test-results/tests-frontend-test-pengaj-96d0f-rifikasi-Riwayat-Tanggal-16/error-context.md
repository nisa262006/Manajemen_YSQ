# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\frontend-test\pengajar\absensi-pengajar.spec.js >> Alur Lengkap: Absensi dan Verifikasi Riwayat Tanggal 16
- Location: tests\frontend-test\pengajar\absensi-pengajar.spec.js:3:1

# Error details

```
Error: locator.selectOption: options[0].label: expected string, got object
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - img "Sahabat Quran" [ref=e5]
    - navigation [ref=e6]:
      - list [ref=e7]:
        - listitem [ref=e8]:
          - link " Dashboard" [ref=e9] [cursor=pointer]:
            - /url: /dashboard/pengajar
            - generic [ref=e10]: 
            - generic [ref=e11]: Dashboard
        - listitem [ref=e12]:
          - link " Jadwal Kelas" [ref=e13] [cursor=pointer]:
            - /url: /dashboard/pengajar/jadwal
            - generic [ref=e14]: 
            - generic [ref=e15]: Jadwal Kelas
        - listitem [ref=e16]:
          - link " Absensi" [ref=e17] [cursor=pointer]:
            - /url: /dashboard/pengajar/absensi
            - generic [ref=e18]: 
            - generic [ref=e19]: Absensi
        - listitem [ref=e20]:
          - link " Materi Ajar" [ref=e21] [cursor=pointer]:
            - /url: /dashboard/pengajar/materi-ajar
            - generic [ref=e22]: 
            - generic [ref=e23]: Materi Ajar
        - listitem [ref=e24]:
          - link " Rapor" [ref=e25] [cursor=pointer]:
            - /url: /dashboard/pengajar/rapor
            - generic [ref=e26]: 
            - generic [ref=e27]: Rapor
        - listitem [ref=e28]:
          - link " Laporan" [ref=e29] [cursor=pointer]:
            - /url: /dashboard/pengajar/laporan
            - generic [ref=e30]: 
            - generic [ref=e31]: Laporan
    - list [ref=e33]:
      - listitem [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: 
        - text: Keluar
  - main [ref=e36]:
    - generic [ref=e37]:
      - text: 
      - heading "Riwayat Kehadiran" [level=1] [ref=e38]
      - generic [ref=e39] [cursor=pointer]:
        - generic [ref=e40]: Ustadz Ahmad Fauzi
        - generic [ref=e41]: 
      - text:   
    - generic [ref=e42]:
      - generic [ref=e43]:
        - generic [ref=e44]:
          - generic [ref=e45]:
            - generic [ref=e46]:
              - generic [ref=e47]: 
              - text: Pilih Kelas
            - combobox [ref=e48] [cursor=pointer]:
              - option "-- Semua Kelas --" [selected]
              - option "Tahsin B - 0566 (Senin)"
          - generic [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e51]: 
              - text: Tanggal
            - textbox [ref=e52] [cursor=pointer]: 2026-05-10
        - button " Export Laporan" [ref=e53] [cursor=pointer]:
          - generic [ref=e54]: 
          - text: Export Laporan
      - generic [ref=e55]:
        - generic [ref=e56]:
          - generic [ref=e58]: 
          - generic [ref=e59]:
            - paragraph [ref=e60]: Total Hadir
            - heading "0" [level=3] [ref=e61]
        - generic [ref=e62]:
          - generic [ref=e64]: 
          - generic [ref=e65]:
            - paragraph [ref=e66]: Total Izin/Sakit
            - heading "0" [level=3] [ref=e67]
        - generic [ref=e68]:
          - generic [ref=e70]: 
          - generic [ref=e71]:
            - paragraph [ref=e72]: Materi Terakhir
            - heading "-" [level=3] [ref=e73]
      - table [ref=e75]:
        - rowgroup [ref=e76]:
          - row "NO NAMA HARI / TANGGAL JAM KEHADIRAN CATATAN SANTRI MATERI KELAS" [ref=e77]:
            - columnheader "NO" [ref=e78]
            - columnheader "NAMA" [ref=e79]
            - columnheader "HARI / TANGGAL" [ref=e80]
            - columnheader "JAM" [ref=e81]
            - columnheader "KEHADIRAN" [ref=e82]
            - columnheader "CATATAN SANTRI" [ref=e83]
            - columnheader "MATERI KELAS" [ref=e84]
        - rowgroup [ref=e85]:
          - row "Data tidak ditemukan" [ref=e86]:
            - cell "Data tidak ditemukan" [ref=e87]
      - link " Kembali ke Absensi" [ref=e89] [cursor=pointer]:
        - /url: /dashboard/pengajar/absensi
        - generic [ref=e90]: 
        - text: Kembali ke Absensi
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | test('Alur Lengkap: Absensi dan Verifikasi Riwayat Tanggal 16', async ({ page }) => {
  4   |   // 1. SETUP: Timeout diperpanjang agar tidak buru-buru
  5   |   test.setTimeout(150000); 
  6   |   await page.setViewportSize({ width: 1280, height: 720 });
  7   | 
  8   |   const TANGGAL_TEST = '2026-05-16'; // Sabtu
  9   |   const NAMA_KELAS_LENGKAP = 'Tahsin B - 0566 (Senin: 16:00:00 - 17:30:00)'; 
  10  |   const KEYWORD_KELAS_RIWAYAT = 'Tahsin B - 0566'; // Nama pendek di halaman riwayat
  11  | 
  12  |   // 2. LOGIN
  13  |   console.log('Melakukan login pengajar...');
  14  |   await page.goto('http://localhost:8000/login');
  15  |   await page.fill('#identifier', 'pengajar_1778129609518@ysq.com'); 
  16  |   await page.fill('#password', 'pengajar123');
  17  |   await page.click('.login-button');
  18  |   await page.waitForLoadState('networkidle');
  19  | 
  20  |   // 3. NAVIGASI KE ABSENSI
  21  |   console.log('Membuka halaman Absensi...');
  22  |   await page.waitForTimeout(2000);
  23  |   await page.click('a[href="/dashboard/pengajar/absensi"]');
  24  |   await page.waitForLoadState('domcontentloaded');
  25  | 
  26  |   // 4. INPUT TANGGAL 16 DI ABSENSI
  27  |   console.log(`Langkah 1: Input tanggal ${TANGGAL_TEST}...`);
  28  |   const inputTglAbsen = page.locator('#tanggalAbsensiPengajar');
  29  |   await inputTglAbsen.fill(TANGGAL_TEST);
  30  |   await inputTglAbsen.dispatchEvent('change');
  31  |   await page.waitForTimeout(3000); // Tunggu sistem stabil
  32  | 
  33  |   // 5. PILIH KELAS DI ABSENSI
  34  |   console.log('Langkah 2: Memilih kelas...');
  35  |   const kelasSelect = page.locator('#kelasSelect');
  36  |   // Tunggu sampai dropdown kelas ada isinya dari database
  37  |   await page.waitForFunction(() => document.querySelectorAll('#kelasSelect option').length > 1);
  38  |   await kelasSelect.selectOption({ label: NAMA_KELAS_LENGKAP });
  39  |   await kelasSelect.dispatchEvent('change');
  40  |   console.log('Menunggu tabel santri dimuat...');
  41  |   await page.waitForTimeout(7000); 
  42  | 
  43  |   // 6. ABSENSI PENGAJAR & SIMPAN (SIMPAN PERTAMA)
  44  |   console.log('Langkah 3: Simpan absen pengajar...');
  45  |   await page.selectOption('#statusAbsensiPengajar', 'Hadir');
  46  |   await page.waitForTimeout(1000);
  47  |   await page.click('#simpanAbsenPengajar'); 
  48  |   
  49  |   // Tunggu sampai jam input muncul di box jadwal (tanda sukses)
  50  |   await page.waitForFunction(() => {
  51  |     const txt = document.getElementById('jamAbsenDisplay').innerText;
  52  |     return txt !== '--.-- - --.--' && txt !== '';
  53  |   }, { timeout: 15000 });
  54  |   console.log('✅ Absen pengajar tersimpan dan jam muncul.');
  55  | 
  56  |   // 7. ABSEN SEMUA SANTRI
  57  |   console.log('Langkah 4: Mengabsen semua santri di tabel...');
  58  |   const allSelects = page.locator('#absensiBody select');
  59  |   const count = await allSelects.count();
  60  |   for (let i = 0; i < count; i++) {
  61  |     await allSelects.nth(i).selectOption('Hadir');
  62  |     console.log(`Santri ke-${i+1} diabsen.`);
  63  |     await page.waitForTimeout(1000); // Jeda tiap baris
  64  |   }
  65  | 
  66  |   // 8. SCROLL & SIMPAN ABSENSI SANTRI (SIMPAN KEDUA)
  67  |   console.log('Langkah 5: Simpan absensi santri...');
  68  |   const btnSimpanSantri = page.locator('#btnSimpanAbsensi');
  69  |   await btnSimpanSantri.scrollIntoViewIfNeeded(); 
  70  |   await page.waitForTimeout(1000);
  71  |   await btnSimpanSantri.click({ force: true });
  72  |   console.log('✅ Absensi santri tersimpan.');
  73  |   await page.waitForTimeout(2000);
  74  | 
  75  |   // 9. PINDAH KE HALAMAN RIWAYAT
  76  |   console.log('Langkah 6: Pindah ke halaman riwayat...');
  77  |   const btnRiwayat = page.locator('a[href="/dashboard/pengajar/riwayat-absensi"]');
  78  |   await btnRiwayat.scrollIntoViewIfNeeded();
  79  |   await btnRiwayat.click({ force: true });
  80  |   await page.waitForLoadState('networkidle');
  81  |   console.log('✅ Sudah berada di halaman Riwayat.');
  82  | 
  83  |   // 10. FILTER DI HALAMAN RIWAYAT (DENGAN TUNGGU EKSTRA)
  84  |   console.log(`Langkah 7: Verifikasi data tanggal ${TANGGAL_TEST}...`);
  85  |   
  86  |   const riwayatKelas = page.locator('#riwayatKelasSelect');
  87  |   const riwayatTgl = page.locator('#riwayatTanggal');
  88  | 
  89  |   // Tunggu sampai nama kelas muncul di dropdown riwayat (Maks 30 detik)
  90  |   console.log(`Menunggu kata kunci "${KEYWORD_KELAS_RIWAYAT}" muncul di dropdown...`);
  91  |   await page.waitForFunction((keyword) => {
  92  |     const options = Array.from(document.querySelectorAll('#riwayatKelasSelect option'));
  93  |     return options.some(opt => opt.text.includes(keyword));
  94  |   }, KEYWORD_KELAS_RIWAYAT, { timeout: 30000 });
  95  | 
  96  |   // Pilih Kelas menggunakan RegExp agar fleksibel
> 97  |   await riwayatKelas.selectOption({ label: new RegExp(KEYWORD_KELAS_RIWAYAT) });
      |                      ^ Error: locator.selectOption: options[0].label: expected string, got object
  98  |   await riwayatKelas.dispatchEvent('change');
  99  |   await page.waitForTimeout(3000);
  100 | 
  101 |   // Input Tanggal 16
  102 |   console.log(`Mengisi tanggal ${TANGGAL_TEST} di riwayat...`);
  103 |   await riwayatTgl.fill(TANGGAL_TEST);
  104 |   await riwayatTgl.dispatchEvent('input');
  105 |   await riwayatTgl.dispatchEvent('change');
  106 |   
  107 |   // 11. VERIFIKASI AKHIR TABEL RIWAYAT
  108 |   console.log('Menunggu tabel riwayat memuat data (8 detik)...');
  109 |   await page.waitForTimeout(8000); 
  110 |   
  111 |   const riwayatBody = page.locator('#riwayatBody');
  112 |   const isiTabel = await riwayatBody.innerText();
  113 | 
  114 |   if (isiTabel.includes('Hadir') && !isiTabel.includes('Memuat')) {
  115 |     console.log('✅ SUKSES BESAR! Data tanggal 16 terlihat di Riwayat.');
  116 |     await page.screenshot({ path: 'riwayat-final-sukses-tgl16.png' });
  117 |   } else {
  118 |     console.log('❌ Data tidak muncul. Mencoba sentil ulang filter tanggal...');
  119 |     await riwayatTgl.dispatchEvent('change');
  120 |     await page.waitForTimeout(4000);
  121 |     await page.screenshot({ path: 'cek-riwayat-tgl16.png' });
  122 |   }
  123 | });
```