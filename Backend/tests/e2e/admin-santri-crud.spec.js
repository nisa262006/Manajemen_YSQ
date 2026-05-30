const { test, expect } = require('@playwright/test');

// ======================================================================
// HELPER: Login sebagai Admin
// ======================================================================
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForSelector('#identifier', { state: 'visible' });
  await page.fill('#identifier', 'admin@ysq.id');
  await page.fill('#password', 'admin123');
  await page.click('.login-button');
  await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
}

// Helper: buka daftar santri dan tunggu tabel siap (ada atau tidak ada data)
async function goToDaftarSantri(page) {
  await page.goto('/dashboard/daftar-santri');
  // Gunakan 'attached' bukan 'visible' — tbody kosong dianggap hidden oleh Playwright
  await page.waitForSelector('#santriTableBody', { state: 'attached' });
  // Tunggu sebentar agar JS sempat fetch data dari API
  await page.waitForTimeout(2000);
}

// ======================================================================
// SANTRI CRUD E2E TESTS
// Data menggunakan fixed timestamp agar konsisten di semua test
// ======================================================================
test.describe('Santri CRUD Operations (Admin)', () => {
  // PENTING: timestamp dinamik agar test repeatable dan tidak bentrok data lama
  const timestamp = Date.now().toString();
  const SANTRI_DATA = {
    nisn: `123${timestamp.slice(-7)}`, // random 10 digit approx
    nama: `Test Santri ${timestamp}`,
    alamat: 'Jl. Testing Santri No. 1',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '2005-08-17',
    no_telpon: '08122334455',
    email: `santritest${timestamp}@mail.com`,
    password: 'TestPassword123',
  };

  const SANTRI_UPDATED = {
    nama: `Updated Santri ${timestamp}`,
    email: `updatedsantri${timestamp}@mail.com`,
    no_telpon: '089988776655',
  };

  test('1. Tambah Santri — isi form lengkap dan simpan', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate ke halaman Tambah Santri (route: /dashboard/tambah-siswa -> tambah_siswa.html)
    await page.goto('/dashboard/tambah-siswa');
    await page.waitForSelector('#form-tambah-siswa', { state: 'visible' });

    // Isi form
    await page.fill('#nisn', SANTRI_DATA.nisn);
    await page.fill('#nama_lengkap', SANTRI_DATA.nama);
    await page.fill('#alamat', SANTRI_DATA.alamat);
    await page.fill('#tempat_lahir', SANTRI_DATA.tempat_lahir);
    await page.fill('#tanggal_lahir', SANTRI_DATA.tanggal_lahir);
    await page.fill('#no_telpon', SANTRI_DATA.no_telpon);
    await page.fill('#email', SANTRI_DATA.email);
    await page.fill('#password', SANTRI_DATA.password);
    await page.fill('#confirm_password', SANTRI_DATA.password);
    await page.check('input#dewasa'); // select Dewasa

    // Handle dialog sukses jika ada
    page.on('dialog', async (dialog) => { await dialog.accept(); });

    // Klik simpan
    await page.click('.save-btn');

    // Wait redirect ke admin dashboard atau daftar santri
    await page.waitForURL(/\/dashboard\/admin|daftar-santri/i, { timeout: 15000 });
  });

  test('2. Verifikasi santri muncul di Daftar Santri', async ({ page }) => {
    await loginAsAdmin(page);
    await goToDaftarSantri(page);

    // Cari baris yang mengandung nama santri baru
    const namaCell = page.locator('#santriTableBody tr').filter({ hasText: SANTRI_DATA.nama });
    await expect(namaCell).toBeVisible({ timeout: 10000 });
  });

  test('3. Edit Santri', async ({ page }) => {
    await loginAsAdmin(page);
    await goToDaftarSantri(page);

    const targetRow = page.locator('#santriTableBody tr').filter({ hasText: SANTRI_DATA.nama });

    const editBtn = targetRow.locator('.edit-btn').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    await page.waitForURL(/\/dashboard\/detail-santri\?id=/, { timeout: 10000 });
    
    // Tunggu tombol edit
    await page.waitForSelector('#btn-edit-santri', { state: 'visible' });
    await page.click('#btn-edit-santri');

    // ID sesuai detail_santri.html
    const namaInput = page.locator('#nama-lengkap');
    await expect(namaInput).toBeEnabled();

    await namaInput.fill(SANTRI_UPDATED.nama);
    const emailInput = page.locator('#email');
    await emailInput.fill(SANTRI_UPDATED.email);
    const noTelpInput = page.locator('#no-telepon');
    await noTelpInput.fill(SANTRI_UPDATED.no_telpon);

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const saveBtn = page.locator('#btn-simpan-santri-footer');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await page.waitForURL(/\/dashboard\/daftar-santri/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-santri/);
  });

  test('4. Verifikasi update Santri', async ({ page }) => {
    await loginAsAdmin(page);
    await goToDaftarSantri(page);

    // Cari baris yang mengandung nama santri yang sudah diupdate
    const updatedNamaCell = page.locator('#santriTableBody tr').filter({ hasText: SANTRI_UPDATED.nama });
    await expect(updatedNamaCell).toBeVisible({ timeout: 10000 });
  });

  test('5. Delete Santri', async ({ page }) => {
    await loginAsAdmin(page);
    await goToDaftarSantri(page);

    const targetRow = page.locator('#santriTableBody tr').filter({ hasText: SANTRI_UPDATED.nama });
    await expect(targetRow).toBeVisible({ timeout: 10000 });

    // Setup dialog handler sebelum klik — accept SEMUA dialog yang muncul
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const deleteBtn = targetRow.locator('.delete-btn').first();
    await expect(deleteBtn).toBeVisible();

    // Tunggu response DELETE dari server sebelum cek tabel
    const deleteResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/santri/') && resp.request().method() === 'DELETE',
      { timeout: 20000 }
    );

    await deleteBtn.click();

    // Tunggu DELETE request selesai
    await deleteResponsePromise;

    // Beri waktu tambahan untuk tabel refresh setelah delete
    await page.waitForTimeout(3000);

    // Verifikasi santri sudah tidak ada di tabel
    const deletedRow = page.locator('#santriTableBody tr').filter({ hasText: SANTRI_UPDATED.nama });
    await expect(deletedRow).toHaveCount(0, { timeout: 8000 });
  });
});
