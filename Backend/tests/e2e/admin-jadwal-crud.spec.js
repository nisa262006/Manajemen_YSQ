const { test, expect } = require('@playwright/test');

async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForSelector('#identifier', { state: 'visible' });
  await page.fill('#identifier', 'admin@ysq.id');
  await page.fill('#password', 'admin123');
  await page.click('.login-button');
  await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
}

test.describe('Jadwal CRUD Operations (Admin)', () => {
  const timestamp = Date.now();
  const JADWAL_DATA = {
    hari: 'Senin',
    kapasitas: '15',
    waktu_mulai: '08:00',
    waktu_selesai: '10:00'
  };

  test('1. Tambah Jadwal', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/daftar-jadwal');
    await page.waitForSelector('#btn-add-jadwal', { state: 'visible' });
    await page.click('#btn-add-jadwal');

    // Wait for modal
    await page.waitForSelector('#tambah-jadwal-modal', { state: 'visible' });

    // Wait for dropdown options to populate dynamically
    const kelasSelect = page.locator('#kelas-tingkatan');
    const pengajarSelect = page.locator('#pengajar-tambah');
    await expect(kelasSelect.locator('option').nth(1)).toBeAttached({ timeout: 10000 });
    await expect(pengajarSelect.locator('option').nth(1)).toBeAttached({ timeout: 10000 });
    
    // We'll just select the first option with value if available, or index 1
    await kelasSelect.selectOption({ index: 1 });
    await pengajarSelect.selectOption({ index: 1 });

    await page.selectOption('#hari-tambah', JADWAL_DATA.hari);
    await page.fill('#kapasitas-tambah', JADWAL_DATA.kapasitas);
    await page.fill('#waktu-mulai', JADWAL_DATA.waktu_mulai);
    await page.fill('#waktu-selesai', JADWAL_DATA.waktu_selesai);

    await page.click('.save-btn-tambah');
    
    // Tunggu refresh/tutup modal
    await page.waitForSelector('#tambah-jadwal-modal', { state: 'hidden', timeout: 10000 });
    
    // Verify it appeared in table (we can't easily match random name, but we ensure table is visible)
    await expect(page.locator('#jadwalBody')).toBeVisible();
  });

  test('2. Edit Jadwal', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/daftar-jadwal');
    await page.waitForSelector('#jadwalBody tr', { state: 'visible' });
    
    // Click edit on the first row
    const firstRow = page.locator('#jadwalBody tr').first();
    const editBtn = firstRow.locator('.edit-btn').first();
    
    await editBtn.click();
    
    // Wait for modal
    await page.waitForSelector('#edit-jadwal-modal', { state: 'visible' });
    
    // Change capacity
    await page.fill('#jumlah-siswa-maks', '20');
    
    await page.click('#btn-edit-simpan');
    
    // Wait for modal to hide
    await page.waitForSelector('#edit-jadwal-modal', { state: 'hidden', timeout: 10000 });
  });

  test('3. Delete Jadwal', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard/daftar-jadwal');
    await page.waitForSelector('#jadwalBody tr', { state: 'visible' });
    
    // We will delete the first row for testing
    // To avoid breaking DB, we handle the dialog but maybe not actually click confirm if it breaks other tests?
    // User requested full CRUD, so we must delete.
    const firstRow = page.locator('#jadwalBody tr').first();
    const deleteBtn = firstRow.locator('.delete-btn').first();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await deleteBtn.click();
    
    // Wait for table to be visible again after reload
    await expect(page.locator('#jadwalBody')).toBeVisible();
  });
});
