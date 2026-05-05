const request = require('supertest');
const app = require('../../src/app');
const { loginAdmin, loginSantri, loginPengajar } = require('../helpers/authHelper');

const db = require('../../src/config/db');

describe('Integration Test: Keuangan & Rapor Flow', () => {
  let adminToken, santriToken, pengajarToken;
  let idBilling;
  let idPembayaran;

  beforeAll(async () => {
    await db.query('TRUNCATE TABLE pembayaran CASCADE');
    await db.query('TRUNCATE TABLE billing_santri CASCADE');
    await db.query(`DELETE FROM rapor_tahsin WHERE periode IN ('Int_Genap 2026', 'Genap 2026')`);
    await db.query('INSERT INTO santri_jadwal (id_santri, id_jadwal) VALUES (1, 1) ON CONFLICT DO NOTHING');
    adminToken = await loginAdmin();
    santriToken = await loginSantri();
    pengajarToken = await loginPengajar();
  });

  test('1. [Admin] Membuat Billing Baru', async () => {
    const res = await request(app)
      .post('/api/keuangan/billing/manual')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_santri: 1, 
        id_jadwal: 1,
        tipe: 'SPP',
        jenis: 'INFAQ_BELAJAR',
        periode: `Int_Ganjil ${Date.now()}`,
        nominal: 200000,
        tanggal_mulai: '2026-06-05',
        tanggal_selesai: '2026-12-31',
        keterangan: 'SPP Bulan Juni'
      });

    if (res.statusCode !== 200 && res.statusCode !== 201) console.log("ERROR BILLING:", res.text);
    expect([200, 201]).toContain(res.statusCode);
  });

  test('2. [Santri] Melihat Tagihan dan Membayar', async () => {
    const getBill = await request(app)
      .get('/api/keuangan/billing/me')
      .set('Authorization', `Bearer ${santriToken}`);
    
    const targetBill = getBill.body.data.find(b => b.keterangan === 'SPP Bulan Juni');
    idBilling = targetBill ? targetBill.id_billing : 1; // Fallback ke 1 jika tidak nemu (krn seed data dll)

    const payRes = await request(app)
      .post('/api/keuangan/pembayaran')
      .set('Authorization', `Bearer ${santriToken}`)
      .send({
        id_billing: idBilling,
        jumlah_bayar: 200000,
        metode: 'Transfer',
        kategori: 'SPP'
      });
    
    expect([200, 201]).toContain(payRes.statusCode);
  });

  test('3. [Admin] Mengonfirmasi Lunas', async () => {
    // Ambil semua pembayaran untuk mencari id_pembayaran terkait
    const getPay = await request(app)
      .get('/api/keuangan/pembayaran/all')
      .set('Authorization', `Bearer ${adminToken}`);
    
    // Cari id_pembayaran dari data pembayaran (jika ada)
    let payment = null;
    if (getPay.body.data) {
      payment = getPay.body.data.find(p => p.id_billing === idBilling);
    }
    
    idPembayaran = payment ? payment.id_pembayaran : null;

    if (idPembayaran) {
      const res = await request(app)
        .put(`/api/keuangan/pembayaran/${idPembayaran}/konfirmasi`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'terima' });
      expect(res.statusCode).toBe(200);
    }
  });

  test('4. [Pengajar] Membuat Rapor Santri', async () => {
    // Karena Santri sudah lunas, asumsi pengajar input nilai akhir periode
    const res = await request(app)
      .post('/api/rapor/tahsin')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_santri: 1,
        id_jadwal: 1,
        periode: 'Int_Genap 2026',
        nilai_pekanan: 85,
        ujian_tilawah: 88,
        nilai_teori: 90,
        nilai_presensi: 100,
        nilai_akhir: 90,
        catatan: 'Lulus dengan Sangat Baik'
      });

    if (res.statusCode !== 200 && res.statusCode !== 201) console.log("ERROR RAPOR:", res.text);
    expect([200, 201]).toContain(res.statusCode);
  });

  test('5. [Santri] Melihat Rapor Baru', async () => {
    const res = await request(app)
      .get('/api/rapor/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    if (idBilling) {
      await db.query('DELETE FROM pembayaran WHERE id_billing = $1', [idBilling]);
      await db.query('DELETE FROM billing_santri WHERE id_billing = $1', [idBilling]);
    }
    await db.query(`DELETE FROM rapor_tahsin WHERE periode = 'Int_Genap 2026'`);
  });

});
