const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard & CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });
    await page.fill('#identifier', 'admin@ysq.id');
    await page.fill('#password', 'admin123');
    await page.click('.login-button');
    await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
  });

  test('Dashboard loads with stat cards', async ({ page }) => {
    // Verify we are on the admin dashboard
    await expect(page).toHaveURL(/\/dashboard\/admin/i);

    // Check stat cards are visible
    const totalSantriDewasa = page.locator('#total_santri_dewasa');
    const totalSantriAnak = page.locator('#total_santri_anak');
    const totalPengajar = page.locator('#total_pengajar');
    const totalKelas = page.locator('#total_kelas');

    // Wait for the stat cards to be populated with numbers
    await expect(totalSantriDewasa).toHaveText(/[0-9]+/, { timeout: 10000 });

    await expect(totalSantriDewasa).toBeVisible();
    await expect(totalSantriAnak).toBeVisible();
    await expect(totalPengajar).toBeVisible();
    await expect(totalKelas).toBeVisible();
  });

  test('Navigate to Daftar Santri', async ({ page }) => {
    const santriLink = page.locator('a[href*="daftar-santri"]').first();
    await expect(santriLink).toBeVisible();
    await santriLink.click();
    await page.waitForURL(/\/dashboard\/daftar-santri/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-santri/);
    
    // Verify tabel daftar santri exists
    const tableBody = page.locator('#santriTableBody');
    await expect(tableBody).toBeVisible();
  });

  test('Navigate to Daftar Pengajar', async ({ page }) => {
    const pengajarLink = page.locator('a[href*="daftar-pengajar"]').first();
    await expect(pengajarLink).toBeVisible();
    await pengajarLink.click();
    await page.waitForURL(/\/dashboard\/daftar-pengajar/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-pengajar/);

    // Verify tabel daftar pengajar exists
    const tableBody = page.locator('#pengajarTableBody');
    await expect(tableBody).toBeVisible();
  });

  test('Navigate to Daftar Kelas', async ({ page }) => {
    const kelasLink = page.locator('a[href*="daftar-kelas"]').first();
    await expect(kelasLink).toBeVisible();
    await kelasLink.click();
    await page.waitForURL(/\/dashboard\/daftar-kelas/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-kelas/);
    
    // Selector aktual di daftar_kelas.html: .class-list-table tbody
    const tableBody = page.locator('.class-list-table tbody');
    await expect(tableBody).toBeAttached();
  });

  test('Navigate to Daftar Jadwal', async ({ page }) => {
    const jadwalLink = page.locator('a[href*="daftar-jadwal"]').first();
    await expect(jadwalLink).toBeVisible();
    await jadwalLink.click();
    await page.waitForURL(/\/dashboard\/daftar-jadwal/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-jadwal/);
    
    // Selector aktual di daftar_jadwal.html: #jadwalBody
    const tableBody = page.locator('#jadwalBody');
    await expect(tableBody).toBeAttached();
  });

  test('Navigate to Daftar Registrasi', async ({ page }) => {
    const regLink = page.locator('a[href*="daftar-registrasi"]').first();
    await expect(regLink).toBeVisible();
    await regLink.click();
    await page.waitForURL(/\/dashboard\/daftar-registrasi/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/daftar-registrasi/);
    
    // Selector aktual di daftar_registrasi.html: #table-registrasi-body
    const tableBody = page.locator('#table-registrasi-body');
    await expect(tableBody).toBeAttached();
  });

  test('Navigate to Billing', async ({ page }) => {
    const billingLink = page.locator('a[href*="billing"]').first();
    if (await billingLink.isVisible()) {
      await billingLink.click();
      await page.waitForURL(/\/dashboard\/billing/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/billing/);
    }
  });
});
