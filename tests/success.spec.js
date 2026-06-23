import { test, expect } from '@playwright/test';

const SUCCESS_URL = 'http://127.0.0.1:5500/Backend/public/views/berhasil.html';

test.describe('Halaman Sukses Registrasi', () => {

  test('halaman sukses tampil', async ({ page }) => {
    await page.goto(SUCCESS_URL);

    await expect(page.locator('h2')).toContainText('Pendaftaran Berhasil');
  });

  test('pesan sukses muncul', async ({ page }) => {
    await page.goto(SUCCESS_URL);

    await expect(page.locator('p')).toContainText('Data kamu telah kami terima');
  });

  test('checkmark tampil', async ({ page }) => {
    await page.goto(SUCCESS_URL);

    await expect(page.locator('.checkmark')).toBeVisible();
  });

  test('tombol kembali ada', async ({ page }) => {
    await page.goto(SUCCESS_URL);

    await expect(page.locator('a.btn')).toHaveText(/kembali/i);
  });

});
