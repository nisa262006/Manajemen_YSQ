const { test, expect } = require('@playwright/test');

test('Admin: Alur Lengkap Manajemen Infaq Belajar (Pemasukan)', async ({ page }) => {

  // Login
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('http://localhost:8000/login');

  await page.fill('#identifier', 'admin2');
  await page.fill('#password', 'admin2');

  await Promise.all([
    page.waitForNavigation(),
    page.click('.login-button')
  ]);

  // Masuk halaman laporan
  await page.goto('http://localhost:8000/dashboard/admin/laporan/keuangan-pemasukan');

  await expect(page).toHaveURL(/keuangan-pemasukan/);

  // Tunggu select siap
  await expect(page.locator('#ysq-filter-cat')).toBeVisible();

  // Ganti kategori ke Infaq Belajar
  await page.selectOption('#ysq-filter-cat', 'iuran');

  // Klik generate
  await page.click('.ysq-main-generate');

  // Tunggu tombol dynamic muncul
  const btnTambah = page.getByRole('button', {
    name: /Tambah Infaq Belajar/i
  });

  await expect(btnTambah).toBeVisible({ timeout: 15000 });

  // Klik tombol tambah
  await btnTambah.click();

  // Modal tampil
  const modalSpp = page.locator('#sppModal');

  await expect(modalSpp).toBeVisible();

  // Tunggu dropdown kelas terisi
  await page.waitForFunction(() => {
    const select = document.querySelector('#spp-kelas');
    return select && select.options.length > 0;
  });

  // Isi form
  await page.selectOption('#spp-kelas', { index: 0 });

  await page.fill('#spp-nominal', '350000');

  await page.fill('#spp-tgl-mulai', '2026-07-01');
  await page.fill('#spp-tgl-akhir', '2026-07-31');

  // Handle alert
  page.once('dialog', async dialog => {
    console.log(dialog.message());
    await dialog.accept();
  });

  // Simpan
  await page.click('#sppModal .ysq-inc-btn-primary');

  // Modal hilang
  await expect(modalSpp).toBeHidden({ timeout: 10000 });

  // Tunggu tabel reload
  await page.waitForLoadState('networkidle');

  // Cari data baru
  const rowBaru = page.locator('#ysq-income-body tr').filter({
    hasText: '350.000'
  }).first();

  await expect(rowBaru).toBeVisible({ timeout: 10000 });

  // Klik konfirmasi
  const btnKonfirmasi = rowBaru.getByRole('button', {
    name: /Konfirmasi/i
  });

  await expect(btnKonfirmasi).toBeVisible();

  await btnKonfirmasi.click();

  // Modal detail
  const modalDetail = page.locator('#detailBillingModal');

  await expect(modalDetail).toBeVisible();

  await expect(modalDetail).toContainText('Detail Pembayaran Santri');

  await expect(
    modalDetail.locator('#detail-billing-body')
  ).toBeVisible();

  // Tutup modal
  await page.locator('.ysq-close-modal').first().click();

  await expect(modalDetail).toBeHidden();
});