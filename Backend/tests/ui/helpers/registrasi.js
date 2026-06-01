const { test, expect } = require('@playwright/test');

test.describe('Registrasi / Pendaftaran Santri', () => {

  // =========================================
  // ✅ Registrasi Berhasil
  // =========================================
  test('Registrasi berhasil dengan data valid', async ({ page }) => {

    await page.goto('http://localhost:8000/register');

    // isi form
    await page.fill('#nama', 'Santri Testing');
    await page.fill('#email', `santri${Date.now()}@gmail.com`);
    await page.fill('#alamat', 'Bogor');
    await page.fill('#no_wa', '081234567890');
    await page.fill('#tempat_lahir', 'Bogor');
    await page.fill('#tanggal_lahir', '2010-01-01');

    // klik daftar
    await page.click('.register-button');

    // tunggu response
    await page.waitForTimeout(3000);

    // validasi berhasil
    await expect(page.locator('body')).toContainText(/berhasil|success/i);

    console.log('✅ Registrasi berhasil');
  });


  // =========================================
  // ❌ Registrasi gagal - field kosong
  // =========================================
  test('Registrasi gagal jika field kosong', async ({ page }) => {

    await page.goto('http://localhost:8000/register');

    // langsung submit
    await page.click('.register-button');

    await page.waitForTimeout(2000);

    // tetap di halaman register
    await expect(page).toHaveURL(/register/i);

    console.log('❌ Validasi field kosong berhasil');
  });


  // =========================================
  // ❌ Registrasi gagal - email sudah ada
  // =========================================
  test('Registrasi gagal jika email sudah terdaftar', async ({ page }) => {

    await page.goto('http://localhost:8000/register');

    // gunakan email yang SUDAH ADA di database
    await page.fill('#nama', 'Santri Lama');
    await page.fill('#email', 'admin1@gmail.com');

    await page.fill('#alamat', 'Bogor');
    await page.fill('#no_wa', '081234567890');
    await page.fill('#tempat_lahir', 'Bogor');
    await page.fill('#tanggal_lahir', '2010-01-01');

    await page.click('.register-button');

    await page.waitForTimeout(3000);

    // validasi muncul error
    await expect(page.locator('body'))
      .toContainText(/email sudah terdaftar/i);

    console.log('❌ Email duplicate berhasil ditest');
  });


  // =========================================
  // ❌ Registrasi gagal - email kosong
  // =========================================
  test('Registrasi gagal jika email kosong', async ({ page }) => {

    await page.goto('http://localhost:8000/register');

    await page.fill('#nama', 'Testing');
    await page.fill('#alamat', 'Bogor');
    await page.fill('#no_wa', '081234567890');
    await page.fill('#tempat_lahir', 'Bogor');
    await page.fill('#tanggal_lahir', '2010-01-01');

    await page.click('.register-button');

    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/register/i);

    console.log('❌ Email kosong berhasil ditest');
  });


  // =========================================
  // ❌ Registrasi gagal - nomor WA kosong
  // =========================================
  test('Registrasi gagal jika nomor WA kosong', async ({ page }) => {

    await page.goto('http://localhost:8000/register');

    await page.fill('#nama', 'Testing');
    await page.fill('#email', `test${Date.now()}@gmail.com`);
    await page.fill('#alamat', 'Bogor');
    await page.fill('#tempat_lahir', 'Bogor');
    await page.fill('#tanggal_lahir', '2010-01-01');

    await page.click('.register-button');

    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/register/i);

    console.log('❌ No WA kosong berhasil ditest');
  });

});