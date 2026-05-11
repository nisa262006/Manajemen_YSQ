const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('Login as Admin → redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });

    // Fill the login form with correct seeded credentials
    await page.fill('#identifier', 'admin2');
    await page.fill('#password', 'admin2');

    // Click login
    await page.click('.login-button');

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/dashboard\/admin/i, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/admin/i);
  });

  test('Login as Pengajar → redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });

    await page.fill('#identifier', 'YSQ25PGJ001_riska');
    await page.fill('#password', 'riska');
    await page.click('.login-button');

    await page.waitForURL(/\/dashboard\/pengajar/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/pengajar/);
  });

  test('Login as Santri → redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });

    await page.fill('#identifier', 'YSQ26DWS011_santri1');
    await page.fill('#password', 'santri1123');
    await page.click('.login-button');

    await page.waitForURL(/\/dashboard\/santri/i, { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard\/santri/i);
  });

  test('Login gagal dengan password salah → tampilkan error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });

    await page.fill('#identifier', 'admin2');
    await page.fill('#password', 'passwordsalah');
    await page.click('.login-button');

    // Harus tetap di halaman login (tidak redirect)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login gagal tanpa mengisi form → tampilkan error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#identifier', { state: 'visible' });

    // Click login tanpa mengisi form
    await page.click('.login-button');

    // Tetap di halaman login
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });
});
