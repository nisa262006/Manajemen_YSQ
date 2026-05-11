const { test, expect } = require('@playwright/test');

// ======================================================================
// HELPER: Login sebagai Admin
// ======================================================================
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForSelector('#identifier', { state: 'visible' });
  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');
  await page.click('.login-button');
  await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
}

// ======================================================================
// PENGAJAR CRUD E2E TESTS
// ======================================================================
test.describe('Pengajar CRUD Operations (Admin)', () => {
  // Data unik per run agar tidak konflik
  const timestamp = Date.now();
  const PENGAJAR_DATA = {
    nama: `Test Pengajar ${timestamp}`,
    alamat: 'Jl. Testing No. 123',
    tempat_lahir: 'Bandung',
    tanggal_lahir: '1990-05-15',
    email: `testpengajar${timestamp}@mail.com`,
    no_telpon: '081234567890',
    kelas: 'Tahsin',
    password: 'Test1234',
  };

  const PENGAJAR_UPDATED = {
    nama: `Updated Pengajar ${timestamp}`,
    email: `updated${timestamp}@mail.com`,
    no_telpon: '089999888777',
  };

  // ================================================================
  // TEST 1: Tambah Pengajar
  // ================================================================
  test('1. Tambah Pengajar — isi form lengkap dan simpan', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate ke halaman Tambah Pengajar
    await page.goto('/dashboard/tambah-pengajar');
    await page.waitForSelector('#form-tambah-pengajar', { state: 'visible' });

    // Verifikasi halaman tampil
    const headerTitle = page.locator('.header-title');
    await expect(headerTitle).toContainText('Tambah Pengajar');

    // Isi semua field form
    await page.fill('#nama_lengkap', PENGAJAR_DATA.nama);
    await page.fill('#alamat', PENGAJAR_DATA.alamat);
    await page.fill('#tempat_lahir', PENGAJAR_DATA.tempat_lahir);
    await page.fill('#tanggal_lahir', PENGAJAR_DATA.tanggal_lahir);
    await page.fill('#email', PENGAJAR_DATA.email);
    await page.fill('#no_telpon', PENGAJAR_DATA.no_telpon);
    await page.fill('#kelas', PENGAJAR_DATA.kelas);
    await page.fill('#password', PENGAJAR_DATA.password);
    await page.fill('#confirm_password', PENGAJAR_DATA.password);

    // Verifikasi field sudah terisi
    await expect(page.locator('#nama_lengkap')).toHaveValue(PENGAJAR_DATA.nama);
    await expect(page.locator('#alamat')).toHaveValue(PENGAJAR_DATA.alamat);
    await expect(page.locator('#email')).toHaveValue(PENGAJAR_DATA.email);
    await expect(page.locator('#password')).toHaveValue(PENGAJAR_DATA.password);

    // Klik tombol Simpan
    await page.click('.save-btn');

    // Tunggu redirect ke dashboard admin (setelah berhasil)
    await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/admin/i);
  });

  // ================================================================
  // TEST 2: Verifikasi pengajar muncul di daftar
  // ================================================================
  test('2. Verifikasi pengajar baru muncul di Daftar Pengajar', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate ke Daftar Pengajar
    await page.goto('/dashboard/daftar-pengajar');
    await page.waitForSelector('#pengajarTableBody', { state: 'visible' });

    // Tunggu data dimuat oleh JS
    await page.waitForTimeout(3000);

    // Cari nama pengajar yang baru dibuat di tabel
    const tableBody = page.locator('#pengajarTableBody');
    const namaCell = tableBody.locator(`text=${PENGAJAR_DATA.nama}`);

    // Verifikasi pengajar muncul di tabel
    await expect(namaCell).toBeVisible({ timeout: 10000 });
  });

  // ================================================================
  // TEST 3: Edit Pengajar — buka detail, edit, simpan
  // ================================================================
  test('3. Edit Pengajar — ubah nama dan email', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate ke Daftar Pengajar
    await page.goto('/dashboard/daftar-pengajar');
    await page.waitForSelector('#pengajarTableBody', { state: 'visible' });
    await page.waitForTimeout(3000);

    // Cari baris yang mengandung nama pengajar kita
    const targetRow = page.locator('#pengajarTableBody tr', {
      has: page.locator(`text=${PENGAJAR_DATA.nama}`)
    });

    // Klik tombol edit (icon pen) pada baris tersebut
    const editBtn = targetRow.locator('.edit-btn').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // Tunggu halaman detail pengajar dimuat
    await page.waitForURL(/\/dashboard\/detail-pengajar\?id=/, { timeout: 10000 });
    await page.waitForSelector('#pengajar-detail-form', { state: 'visible' });

    // Verifikasi data pengajar tampil di form (masih disabled)
    const namaInput = page.locator('#pengajar-nama');
    await expect(namaInput).toBeDisabled();
    await expect(namaInput).toHaveValue(PENGAJAR_DATA.nama);

    // Klik tombol Edit untuk mengaktifkan form
    await page.click('#btn-edit-pengajar');

    // Verifikasi form menjadi aktif (enabled)
    await expect(namaInput).toBeEnabled();

    // Ubah data
    await namaInput.fill(PENGAJAR_UPDATED.nama);

    const emailInput = page.locator('#pengajar-email');
    await emailInput.fill(PENGAJAR_UPDATED.email);

    const noTelpInput = page.locator('#pengajar-no-telepon');
    await noTelpInput.fill(PENGAJAR_UPDATED.no_telpon);

    // Verifikasi data sudah berubah di form
    await expect(namaInput).toHaveValue(PENGAJAR_UPDATED.nama);
    await expect(emailInput).toHaveValue(PENGAJAR_UPDATED.email);
    await expect(noTelpInput).toHaveValue(PENGAJAR_UPDATED.no_telpon);

    // Setup handler untuk alert dialog setelah simpan
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('pengajar diperbarui');
      await dialog.accept();
    });

    // Klik tombol Simpan di footer
    const saveBtn = page.locator('#btn-simpan-pengajar-footer');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Tunggu redirect ke daftar pengajar setelah simpan berhasil
    await page.waitForURL(/\/dashboard\/daftar-pengajar/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-pengajar/);
  });

  // ================================================================
  // TEST 4: Verifikasi data terupdate di daftar
  // ================================================================
  test('4. Verifikasi data pengajar berhasil diupdate', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/daftar-pengajar');
    await page.waitForSelector('#pengajarTableBody', { state: 'visible' });
    await page.waitForTimeout(3000);

    // Cari nama pengajar yang sudah diupdate
    const tableBody = page.locator('#pengajarTableBody');
    const updatedNamaCell = tableBody.locator(`text=${PENGAJAR_UPDATED.nama}`);

    // Verifikasi nama baru muncul
    await expect(updatedNamaCell).toBeVisible({ timeout: 10000 });

    // Pastikan nama lama sudah tidak ada
    const oldNamaCell = tableBody.locator(`text=${PENGAJAR_DATA.nama}`);
    await expect(oldNamaCell).toHaveCount(0);
  });

  // ================================================================
  // TEST 5: Delete Pengajar
  // ================================================================
  test('5. Delete Pengajar — hapus data yang telah diupdate', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/daftar-pengajar');
    await page.waitForSelector('#pengajarTableBody', { state: 'visible' });
    await page.waitForTimeout(3000);

    // Cari baris pengajar yang mau dihapus (pakai nama yang sudah diupdate)
    const targetRow = page.locator('#pengajarTableBody tr', {
      has: page.locator(`text=${PENGAJAR_UPDATED.nama}`)
    });

    // Verifikasi baris ditemukan
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    // Setup handler untuk confirm dialog (klik "OK")
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Apakah Anda yakin');
      await dialog.accept();
    });

    // Klik tombol delete pada baris tersebut
    const deleteBtn = targetRow.locator('.delete-btn').first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Tunggu tabel di-refresh setelah penghapusan
    await page.waitForTimeout(3000);

    // Verifikasi pengajar sudah tidak ada di tabel
    const deletedRow = page.locator('#pengajarTableBody tr', {
      has: page.locator(`text=${PENGAJAR_UPDATED.nama}`)
    });
    await expect(deletedRow).toHaveCount(0);
  });

  // ================================================================
  // TEST 6: Validasi form kosong — tidak bisa submit
  // ================================================================
  test('6. Validasi — form kosong tidak bisa disimpan', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/tambah-pengajar');
    await page.waitForSelector('#form-tambah-pengajar', { state: 'visible' });

    // Coba submit form tanpa mengisi apapun
    // Password field di-check oleh JS validation, bukan HTML required
    await page.fill('#password', '');
    await page.fill('#confirm_password', '');

    // Klik simpan
    await page.click('.save-btn');

    // Harus tetap di halaman tambah pengajar (tidak redirect)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard\/tambah-pengajar/);
  });

  // ================================================================
  // TEST 7: Validasi — password tidak sama
  // ================================================================
  test('7. Validasi — password tidak sama menampilkan error', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/tambah-pengajar');
    await page.waitForSelector('#form-tambah-pengajar', { state: 'visible' });

    // Isi form dengan password berbeda
    await page.fill('#nama_lengkap', 'Test Validasi');
    await page.fill('#email', 'validasi@mail.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirm_password', 'password456');

    // Klik simpan
    await page.click('.save-btn');

    // Harus tetap di halaman tambah pengajar
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard\/tambah-pengajar/);
  });
});
