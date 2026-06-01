const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin, loginSantri } = require('../../helpers/authHelper');
const db = require('../../../src/config/db');

describe('Functional Test: Admin & Santri Keuangan', () => {
  let adminToken;
  let santriToken;
  let idBilling;
  let idPembayaran;
  let idSantri;

  beforeAll(async () => {
    adminToken = await loginAdmin();
    santriToken = await loginSantri();
    await db.query('TRUNCATE TABLE pembayaran CASCADE');
    await db.query('TRUNCATE TABLE billing_santri CASCADE');

    const meRes = await request(app).get('/api/me').set('Authorization', `Bearer ${santriToken}`);
    idSantri = meRes.body.profile.id_santri;
  });

  test('1. Admin membuat tagihan/billing manual untuk santri', async () => {
    const res = await request(app)
      .post('/api/keuangan/billing/manual')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_santri: idSantri,
        id_jadwal: 1,
        tipe: 'SPP',
        jenis: 'INFAQ_BELAJAR',
        periode: 'Func_Ganjil 2026',
        nominal: 150000,
        tanggal_mulai: '2026-05-01',
        tanggal_selesai: '2026-12-31',
        keterangan: 'SPP Bulan Mei'
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
  });

  test('2. Santri mengecek tagihan dan menemukan billing baru', async () => {
    const res = await request(app)
      .get('/api/keuangan/billing/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const targetBilling = res.body.data.find(b => b.keterangan === 'SPP Bulan Mei');
    expect(targetBilling).toBeDefined();
    idBilling = targetBilling.id_billing;
  });

  test('3. Santri melakukan pembayaran (manual transfer)', async () => {
    expect(idBilling).toBeDefined();

    const res = await request(app)
      .post('/api/keuangan/pembayaran')
      .set('Authorization', `Bearer ${santriToken}`)
      .send({
        id_billing: idBilling,
        jumlah_bayar: 150000,
        metode: 'Transfer',
        kategori: 'SPP'
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    // Simpan id_pembayaran jika tersedia
    idPembayaran = res.body.id_pembayaran || (res.body.data && res.body.data.id_pembayaran);
  });

  test('4. Admin mengonfirmasi pembayaran santri menjadi diterima', async () => {
    // Kita perlu mendapatkan id_pembayaran jika belum didapat dari respons submit
    if (!idPembayaran) {
      const getPay = await request(app)
        .get('/api/keuangan/pembayaran/all')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const payFound = getPay.body.data.find(p => p.id_billing === idBilling);
      idPembayaran = payFound.id_pembayaran;
    }

    expect(idPembayaran).toBeDefined();

    const res = await request(app)
      .put(`/api/keuangan/pembayaran/${idPembayaran}/konfirmasi`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'terima' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    if (idBilling) {
      await db.query('DELETE FROM pembayaran WHERE id_billing = $1', [idBilling]);
      await db.query('DELETE FROM billing_santri WHERE id_billing = $1', [idBilling]);
    }
  });

});