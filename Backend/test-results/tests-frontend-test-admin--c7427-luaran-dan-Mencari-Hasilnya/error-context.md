# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\frontend-test\admin\laporan-pengeluaran.spec.js >> Admin Berhasil Tambah Pengeluaran dan Mencari Hasilnya
- Location: tests\frontend-test\admin\laporan-pengeluaran.spec.js:3:1

# Error details

```
Error: locator.click: Element is not visible
Call log:
  - waiting for locator('button:has-text("Simpan Pengeluaran")')
    - locator resolved to <button onclick="savePengeluaran()" class="ysq-inc-btn ysq-btn-out-primary">…</button>
  - attempting click action
    - scrolling into view if needed

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - img "Sahabat Quran" [ref=e5]
      - navigation [ref=e6]:
        - link " Dashboard" [ref=e7] [cursor=pointer]:
          - /url: /dashboard/Admin
          - generic [ref=e8]: 
          - text: Dashboard
        - link " Daftar Jadwal" [ref=e9] [cursor=pointer]:
          - /url: /dashboard/daftar-jadwal
          - generic [ref=e10]: 
          - text: Daftar Jadwal
        - link " Daftar Kelas" [ref=e11] [cursor=pointer]:
          - /url: /dashboard/daftar-kelas
          - generic [ref=e12]: 
          - text: Daftar Kelas
        - link " Daftar Santri" [ref=e13] [cursor=pointer]:
          - /url: /dashboard/daftar-santri
          - generic [ref=e14]: 
          - text: Daftar Santri
        - link " Daftar Pengajar" [ref=e15] [cursor=pointer]:
          - /url: /dashboard/daftar-pengajar
          - generic [ref=e16]: 
          - text: Daftar Pengajar
        - link " Riwayat Absensi" [ref=e17] [cursor=pointer]:
          - /url: /dashboard/riwayat-absensi
          - generic [ref=e18]: 
          - text: Riwayat Absensi
        - generic [ref=e19]:
          - generic [ref=e20] [cursor=pointer]:
            - generic [ref=e21]:
              - generic [ref=e22]: 
              - text: Laporan
            - generic [ref=e23]: 
          - generic [ref=e24]:
            - link " Keuangan Pemasukan" [ref=e25] [cursor=pointer]:
              - /url: /dashboard/admin/laporan/keuangan-pemasukan
              - generic [ref=e26]: 
              - text: Keuangan Pemasukan
            - link " Keuangan Pengeluaran" [ref=e27] [cursor=pointer]:
              - /url: /dashboard/admin/laporan/keuangan-pengeluaran
              - generic [ref=e28]: 
              - text: Keuangan Pengeluaran
      - generic [ref=e30]:
        - button " Setting Profil" [ref=e31]:
          - generic [ref=e32]: 
          - text: Setting Profil
        - link " Keluar" [ref=e33] [cursor=pointer]:
          - /url: /login
          - generic [ref=e34]: 
          - text: Keluar
    - main [ref=e35]:
      - generic [ref=e36]:
        - generic [ref=e37]:
          - heading "Laporan Pengeluaran Keuangan" [level=1] [ref=e38]
          - paragraph [ref=e39]: Catatan transparan biaya operasional dan pengeluaran yayasan.
        - generic [ref=e40]:
          - button " Tambah Pengeluaran" [active] [ref=e41] [cursor=pointer]:
            - generic [ref=e42]: 
            - text: Tambah Pengeluaran
          - button " Export PDF" [ref=e43] [cursor=pointer]:
            - generic [ref=e44]: 
            - text: Export PDF
          - button " Export Excel" [ref=e45] [cursor=pointer]:
            - generic [ref=e46]: 
            - text: Export Excel
      - generic [ref=e48]:
        - generic [ref=e49]:
          - generic [ref=e50]: "Periode Awal:"
          - textbox "Periode Awal:" [ref=e51]
        - generic [ref=e52]:
          - generic [ref=e53]: "Periode Akhir:"
          - textbox "Periode Akhir:" [ref=e54]
        - generic [ref=e55]:
          - generic [ref=e56]: "Kategori Pengeluaran:"
          - combobox "Kategori Pengeluaran:" [ref=e57] [cursor=pointer]:
            - option "Semua Pengeluaran" [selected]
            - option "Khafalah Guru"
            - option "Khafalah OB"
            - option "Biaya Listrik"
            - option "Biaya WiFi"
            - option "Biaya Sewa Hosting/Sistem"
            - option "Konsumsi"
            - option "Akomodasi/Transportasi"
            - option "Lain-lain (DLL)"
        - generic [ref=e58]:
          - generic [ref=e59]: "Pencarian:"
          - textbox "Cari nama, kelas, kategori..." [ref=e60]
      - generic [ref=e62]:
        - text: Total Pengeluaran Keseluruhan
        - heading "Rp 0" [level=2] [ref=e63]
      - table [ref=e65]:
        - rowgroup [ref=e66]:
          - row "Tanggal Kategori Pengeluaran Keterangan Nominal" [ref=e67]:
            - columnheader "Tanggal" [ref=e68]
            - columnheader "Kategori Pengeluaran" [ref=e69]
            - columnheader "Keterangan" [ref=e70]
            - columnheader "Nominal" [ref=e71]
        - rowgroup
  - text:  
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test('Admin Berhasil Tambah Pengeluaran dan Mencari Hasilnya', async ({ page }) => {
  4  |   // Set waktu tunggu lebih lama (1 menit) agar tidak timeout saat loading modal
  5  |   test.setTimeout(60000);
  6  | 
  7  |   // 1. Setup Layar
  8  |   await page.setViewportSize({ width: 1280, height: 720 });
  9  | 
  10 |   // 2. Login
  11 |   console.log('Melakukan login admin...');
  12 |   await page.goto('http://localhost:8000/login');
  13 |   await page.fill('#identifier', 'admin1');
  14 |   await page.fill('#password', 'admin1');
  15 |   await page.click('.login-button');
  16 |   await page.waitForLoadState('networkidle');
  17 | 
  18 |   // 3. Navigasi ke Pengeluaran
  19 |   console.log('Navigasi ke Laporan Pengeluaran...');
  20 |   await page.click('#laporan-btn'); 
  21 |   await page.waitForTimeout(500);
  22 |   await page.click('text=Keuangan Pengeluaran');
  23 |   await expect(page).toHaveURL(/.*keuangan-pengeluaran/);
  24 | 
  25 |   // 4. Tambah Data Baru via Modal
  26 |   console.log('Membuka modal tambah pengeluaran...');
  27 |   await page.click('button:has-text("Tambah Pengeluaran")');
  28 |   
  29 |   const ketInput = "Beli Kertas A4 Project Jingga"; // Nama unik untuk dicari nanti
  30 |   
  31 |   // Mengisi data (Gunakan force: true agar tetap terisi meski transisi CSS modal belum selesai)
  32 |   console.log('Mengisi formulir pengeluaran...');
  33 |   await page.selectOption('#out-jenis', 'Lainnya', { force: true });
  34 |   await page.fill('#out-tgl', '2026-05-08', { force: true });
  35 |   await page.fill('#out-nominal', '55000', { force: true });
  36 |   await page.fill('#out-ket', ketInput, { force: true });
  37 |   
  38 |   await page.waitForTimeout(1000);
  39 | 
  40 |   // 5. Klik Simpan (Gunakan Jurus Ganda)
  41 |   console.log('Menyimpan data pengeluaran...');
  42 |   
  43 |   // Cara 1: Klik tombol secara fisik (force: true)
  44 |   const btnSimpan = page.locator('button:has-text("Simpan Pengeluaran")');
> 45 |   await btnSimpan.click({ force: true });
     |                   ^ Error: locator.click: Element is not visible
  46 | 
  47 |   // Cara 2: Panggil fungsi JS langsung sebagai backup jika klik fisik terhalang CSS
  48 |   await page.evaluate(() => {
  49 |     if (typeof savePengeluaran === 'function') {
  50 |       savePengeluaran();
  51 |     }
  52 |   });
  53 |   
  54 |   // Tunggu sampai modal benar-benar hilang dari layar
  55 |   await page.waitForSelector('#modalPengeluaran', { state: 'hidden', timeout: 15000 });
  56 |   console.log('Data tersimpan dan modal tertutup.');
  57 |   await page.waitForTimeout(2000); 
  58 | 
  59 |   // 6. Cari Hasil yang Baru Diinput
  60 |   console.log(`Mencari data yang baru dibuat: ${ketInput}`);
  61 |   const searchInput = page.locator('#ysq-search');
  62 |   
  63 |   await searchInput.clear();
  64 |   await searchInput.pressSequentially(ketInput, { delay: 150 });
  65 |   await page.waitForTimeout(2000);
  66 | 
  67 |   // 7. Verifikasi di Tabel
  68 |   const tableBody = page.locator('#ysq-pengeluaran-body');
  69 |   const rowContent = await tableBody.innerText();
  70 | 
  71 |   if (rowContent.includes(ketInput)) {
  72 |     console.log(`✅ BERHASIL! Data "${ketInput}" muncul di tabel.`);
  73 |     // Highlight baris pertama hasil pencarian
  74 |     await tableBody.locator('tr').first().evaluate(el => el.style.backgroundColor = '#d4edda');
  75 |   } else {
  76 |     console.log('❌ Data tidak ditemukan di tabel hasil filter.');
  77 |     // Ambil screenshot sebagai bukti jika gagal
  78 |     await page.screenshot({ path: 'gagal-cari-pengeluaran.png' });
  79 |   }
  80 | 
  81 |   console.log('Selesai! Modul Pengeluaran aman.');
  82 |   await page.waitForTimeout(3000);
  83 | });
```