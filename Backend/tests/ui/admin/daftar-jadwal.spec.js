const { test, expect } = require('@playwright/test');

test('Admin Berhasil Menambahkan dan Mengedit Jadwal', async ({ page }) => {
  // 1. Login Admin
  await page.goto('http://localhost:8000/login');
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');

  // 2. Navigasi ke Daftar Jadwal
  await page.click('text=Daftar Jadwal');
  console.log('Membuka halaman Daftar Jadwal...');
  await page.waitForTimeout(1000);

  // --- BAGIAN TAMBAH JADWAL ---
  await page.click('#btn-add-jadwal');
  
  const modalTambah = page.locator('#tambah-jadwal-modal');
  await modalTambah.waitFor({ state: 'attached' });
  
  // Bypass agar modal muncul meskipun di pojok
  await modalTambah.evaluate(node => {
    node.style.display = 'block';
    node.style.opacity = '1';
    node.style.visibility = 'visible';
  });

  console.log('Mengisi form tambah jadwal...');
  
  // Ambil value kelas secara dinamis menggunakan regex
  const kelasOption = page.locator('#kelas-tingkatan option').filter({ hasText: /^Tahsin B - .*/ }).first();
  const valueKelas = await kelasOption.getAttribute('value');
  await page.selectOption('#kelas-tingkatan', valueKelas); 

  // Ambil value pengajar secara dinamis
  const pengajarOption = page.locator('#pengajar-tambah option').filter({ hasText: /Ustadz Ahmad Fauzi/ }).first();
  const valuePengajar = await pengajarOption.getAttribute('value');
  await page.selectOption('#pengajar-tambah', valuePengajar);
  await page.selectOption('#hari-tambah', 'Senin');
  await page.fill('#kapasitas-tambah', '25');
  await page.fill('#waktu-mulai', '16:00'); // 04:00 PM
  await page.fill('#waktu-selesai', '17:30'); // 05:30 PM
  
  await page.waitForTimeout(1000);
  await page.click('#form-tambah-jadwal button[type="submit"]');
  await expect(modalTambah).toBeHidden({ timeout: 10000 });
  console.log('Jadwal baru berhasil dibuat.');
  await page.waitForTimeout(1500);

  // --- BAGIAN EDIT JADWAL ---
  console.log('Mencari jadwal untuk diedit...');
  
  // Mencari baris yang baru dibuat (berdasarkan nama kelas, tanpa ^ karena ada nomor urut)
  const rowJadwal = page.locator('#jadwalBody tr').filter({ hasText: /Tahsin B - .*/ }).first();
  await rowJadwal.locator('.edit-btn, .icon-btn, .fa-edit, .fa-pencil-alt').first().click();

  const modalEdit = page.locator('#edit-jadwal-modal');
  await modalEdit.waitFor({ state: 'attached' });
  
  // Bypass popup edit
  await modalEdit.evaluate(node => {
    node.style.display = 'block';
    node.style.opacity = '1';
    node.style.visibility = 'visible';
  });
  
  console.log('Modal Edit terbuka.');
  await page.waitForTimeout(1500);

  // Update data di Modal Edit (Sesuai gambar yang kamu kirim)
  console.log('Mengubah data di form edit...');
  await page.fill('#jumlah-siswa-maks', '30'); // Ubah kapasitas
  await page.waitForTimeout(500);
  await page.fill('#edit-mulai', '16:30');      // Ubah jam (04:30 PM)
  await page.waitForTimeout(500);
  await page.selectOption('#edit-hari', 'Selasa'); // Ubah hari

  await page.waitForTimeout(2000); // Jeda biar bisa kelihatan perubahannya

  // Klik Simpan Perubahan
  await page.click('#btn-edit-simpan');

  // Verifikasi modal edit tertutup
  await expect(modalEdit).toBeHidden({ timeout: 10000 });
  
  // Verifikasi data terbaru di tabel utama
  const bodyTabel = page.locator('#jadwalBody');
  await expect(bodyTabel).toContainText('Selasa');
  await expect(bodyTabel).toContainText('16:30');

  console.log('Alhamdulillah! Tambah dan Edit Jadwal sukses dijalankan.');
  await page.waitForTimeout(3000);
});