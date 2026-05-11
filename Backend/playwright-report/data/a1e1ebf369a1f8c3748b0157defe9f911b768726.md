# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: santri.spec.js >> Santri Dashboard & Activities >> Navigate to Rapor Santri
- Location: tests\e2e\santri.spec.js:29:3

# Error details

```
Error: page.waitForURL: net::ERR_ABORTED; maybe frame was detached?
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('Santri Dashboard & Activities', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Login as santri
  6  |     await page.goto('/login');
  7  |     await page.waitForSelector('#identifier', { state: 'visible' });
  8  |     await page.fill('#identifier', 'YSQ26DWS011_santri1');
  9  |     await page.fill('#password', 'santri1123');
  10 |     await page.click('.login-button');
> 11 |     await page.waitForURL(/\/dashboard\/santri/i, { timeout: 15000 });
     |                ^ Error: page.waitForURL: net::ERR_ABORTED; maybe frame was detached?
  12 |   });
  13 | 
  14 |   test('Dashboard santri loads', async ({ page }) => {
  15 |     await expect(page).toHaveURL(/\/dashboard\/santri/i);
  16 |     const body = page.locator('body');
  17 |     await expect(body).toBeVisible();
  18 |   });
  19 | 
  20 |   test('Navigate to Materi Santri', async ({ page }) => {
  21 |     const materiLink = page.locator('a[href*="materi-santri"]').first();
  22 |     if (await materiLink.isVisible()) {
  23 |       await materiLink.click();
  24 |       await page.waitForURL(/\/dashboard\/materi-santri/, { timeout: 10000 });
  25 |       await expect(page).toHaveURL(/\/dashboard\/materi-santri/);
  26 |     }
  27 |   });
  28 | 
  29 |   test('Navigate to Rapor Santri', async ({ page }) => {
  30 |     const raporLink = page.locator('a[href*="santri/rapor"]').first();
  31 |     if (await raporLink.isVisible()) {
  32 |       await raporLink.click();
  33 |       await page.waitForURL(/\/dashboard\/santri\/rapor/, { timeout: 10000 });
  34 |       await expect(page).toHaveURL(/\/dashboard\/santri\/rapor/);
  35 |     }
  36 |   });
  37 | 
  38 |   test('Navigate to Riwayat Absensi Santri', async ({ page }) => {
  39 |     const riwayatLink = page.locator('a[href*="riwayat-absensi-santri"]').first();
  40 |     if (await riwayatLink.isVisible()) {
  41 |       await riwayatLink.click();
  42 |       await page.waitForURL(/\/dashboard\/riwayat-absensi-santri/, { timeout: 10000 });
  43 |       await expect(page).toHaveURL(/\/dashboard\/riwayat-absensi-santri/);
  44 |     }
  45 |   });
  46 | 
  47 |   test('API: Get profile santri via /api/me', async ({ page }) => {
  48 |     const response = await page.evaluate(async () => {
  49 |       const token = localStorage.getItem('token');
  50 |       const res = await fetch('/api/me', {
  51 |         headers: { 'Authorization': `Bearer ${token}` }
  52 |       });
  53 |       const data = await res.json();
  54 |       return { status: res.status, role: data.role, success: data.success };
  55 |     });
  56 | 
  57 |     if (response.status === 200) {
  58 |       expect(response.success).toBe(true);
  59 |       expect(response.role).toBe('santri');
  60 |     }
  61 |   });
  62 | 
  63 |   test('API: Get jadwal santri via /api/jadwal/santri/me', async ({ page }) => {
  64 |     const response = await page.evaluate(async () => {
  65 |       const token = localStorage.getItem('token');
  66 |       const res = await fetch('/api/jadwal/santri/me', {
  67 |         headers: { 'Authorization': `Bearer ${token}` }
  68 |       });
  69 |       return { status: res.status, ok: res.ok };
  70 |     });
  71 | 
  72 |     expect([200, 401]).toContain(response.status);
  73 |   });
  74 | 
  75 |   test('API: Get kelas santri via /api/kelas/santri/me', async ({ page }) => {
  76 |     const response = await page.evaluate(async () => {
  77 |       const token = localStorage.getItem('token');
  78 |       const res = await fetch('/api/kelas/santri/me', {
  79 |         headers: { 'Authorization': `Bearer ${token}` }
  80 |       });
  81 |       return { status: res.status, ok: res.ok };
  82 |     });
  83 | 
  84 |     expect([200, 401]).toContain(response.status);
  85 |   });
  86 | 
  87 |   test('API: Get riwayat absensi santri via /api/absensi/santri/me', async ({ page }) => {
  88 |     const response = await page.evaluate(async () => {
  89 |       const token = localStorage.getItem('token');
  90 |       const res = await fetch('/api/absensi/santri/me', {
  91 |         headers: { 'Authorization': `Bearer ${token}` }
  92 |       });
  93 |       return { status: res.status, ok: res.ok };
  94 |     });
  95 | 
  96 |     expect([200, 401]).toContain(response.status);
  97 |   });
  98 | });
  99 | 
```