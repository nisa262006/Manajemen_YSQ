const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {

  // ================= ADMIN LOGIN =================
  test('Login as Admin → redirect ke dashboard admin', async ({ page }) => {

    await page.goto('http://localhost:8000/login');

    await page.waitForSelector('#identifier', {
      state: 'visible'
    });

    // isi form login
    await page.fill('#identifier', 'admin2');
    await page.fill('#password', 'admin2');

    // klik login
    await page.click('.login-button');

    // tunggu redirect
    await page.waitForURL(/\/dashboard\/admin/i, {
      timeout: 15000
    });

    // validasi URL
    await expect(page).toHaveURL(/\/dashboard\/admin/i);

    // tunggu biar kelihatan
    await page.waitForTimeout(3000);
  });

  // ================= PENGAJAR LOGIN =================
  test('Login as Pengajar → redirect ke dashboard pengajar', async ({ page }) => {

    await page.goto('http://localhost:8000/login');

    await page.waitForSelector('#identifier', {
      state: 'visible'
    });

    await page.fill('#identifier', 'YSQ25PGJ001_riska');
    await page.fill('#password', 'riska');

    await page.click('.login-button');

    await page.waitForURL(/\/dashboard\/pengajar/i, {
      timeout: 15000
    });

    await expect(page).toHaveURL(/\/dashboard\/pengajar/i);

    await page.waitForTimeout(3000);
  });

  // ================= SANTRI LOGIN =================
  test('Login as Santri → redirect ke dashboard santri', async ({ page }) => {

    await page.goto('http://localhost:8000/login');

    await page.waitForSelector('#identifier', {
      state: 'visible'
    });

    await page.fill('#identifier', 'YSQ26DWS011_santri1');
    await page.fill('#password', 'santri1123');

    await page.click('.login-button');

    await page.waitForURL(/\/dashboard\/santri/i, {
      timeout: 15000
    });

    await expect(page).toHaveURL(/\/dashboard\/santri/i);

    await page.waitForTimeout(3000);
  });

  // ================= LOGIN GAGAL PASSWORD =================
  test('Login gagal dengan password salah', async ({ page }) => {

    await page.goto('http://localhost:8000/login');

    await page.waitForSelector('#identifier', {
      state: 'visible'
    });

    await page.fill('#identifier', 'admin2');
    await page.fill('#password', 'passwordSalah');

    await page.click('.login-button');

    // tunggu response
    await page.waitForTimeout(2000);

    // harus tetap di login
    await expect(page).toHaveURL(/\/login/i);
  });

  // ================= LOGIN GAGAL FORM KOSONG =================
  test('Login gagal tanpa isi form', async ({ page }) => {

    await page.goto('http://localhost:8000/login');

    await page.waitForSelector('#identifier', {
      state: 'visible'
    });

    // klik login tanpa isi
    await page.click('.login-button');

    // tetap di login
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/login/i);
  });

});