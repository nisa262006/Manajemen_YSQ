const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

// ✅ MOCK DATABASE
jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

// ✅ MOCK AUTH MIDDLEWARE
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    const role = req.headers['x-role'] || 'admin';
    const id_users = Number(req.headers['x-id-users'] || '1');
    req.user = { id_users, role };
    next();
  },
  onlyAdmin:   (req, res, next) => req.user.role === 'admin'    ? next() : res.status(403).json({ message: 'Admin only' }),
  onlySantri:  (req, res, next) => req.user.role === 'santri'   ? next() : res.status(403).json({ message: 'Santri only' }),
  onlyPengajar:(req, res, next) => req.user.role === 'pengajar' ? next() : res.status(403).json({ message: 'Pengajar only' }),
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe('KEUANGAN API YSQ (Mocked)', () => {

  // ============================================================
  // POST /api/keuangan/billing/manual - Admin Membuat Tagihan Manual
  // ============================================================
  describe('POST /api/keuangan/billing/manual', () => {
    test('✅ Admin berhasil membuat tagihan manual', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'aktif' }] }) // cek santri
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_billing: 99 }] }); // insert billing

      const res = await request(app)
        .post('/api/keuangan/billing/manual')
        .set('x-role', 'admin')
        .send({
          id_santri: 10,
          id_jadwal: 5,
          tipe: 'Buku',
          nominal: 50000,
          tanggal_mulai: '2025-01-01',
          keterangan: 'Buku Tahsin'
        });

      expect([200, 201]).toContain(res.statusCode);
    });

    test('❌ Santri tidak bisa membuat tagihan manual (403)', async () => {
      const res = await request(app)
        .post('/api/keuangan/billing/manual')
        .set('x-role', 'santri')
        .send({});

      expect(res.statusCode).toBe(403);
    });
  });

  // ============================================================
  // GET /api/keuangan/billing/me - Santri Melihat Tagihannya
  // ============================================================
  describe('GET /api/keuangan/billing/me', () => {
    test('✅ Santri berhasil melihat tagihannya sendiri', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id_billing: 1, tipe: 'SPP', nominal: 100000 }]
      });

      const res = await request(app)
        .get('/api/keuangan/billing/me')
        .set('x-role', 'santri')
        .set('x-id-users', '5');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    test('❌ Pengajar tidak bisa akses endpoint billing santri (403)', async () => {
      const res = await request(app)
        .get('/api/keuangan/billing/me')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(403);
    });
  });

  // ============================================================
  // POST /api/keuangan/pembayaran - Santri Melakukan Pembayaran
  // ============================================================
  describe('POST /api/keuangan/pembayaran', () => {
    test('✅ Santri berhasil input pembayaran', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_billing: 1, id_santri: 10, sisa: 100000 }] }) // get billing
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 10 }] }) // get id santri dari user
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pembayaran: 1 }] }) // insert pembayaran
        .mockResolvedValueOnce({ rowCount: 1 }); // update billing status

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .set('x-role', 'santri')
        .set('x-id-users', '5')
        .send({
          id_billing: 1,
          jumlah_bayar: 100000,
          metode: 'Transfer',
          kategori: 'SPP'
        });

      if (res.statusCode === 400) console.log('ERROR PEMBAYARAN API:', res.text);
      expect([200, 201]).toContain(res.statusCode);
    });
  });

  // ============================================================
  // PUT /api/keuangan/pembayaran/:id/konfirmasi - Admin Konfirmasi Pembayaran
  // ============================================================
  describe('PUT /api/keuangan/pembayaran/:id/konfirmasi', () => {
    test('✅ Admin berhasil mengonfirmasi pembayaran', async () => {
      db.query = jest.fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_billing: 1, jumlah_bayar: 100000, status: 'menunggu' }] }) // get pembayaran
        .mockResolvedValueOnce({ rowCount: 1 }) // update pembayaran lunas
        .mockResolvedValueOnce({ rowCount: 1 }) // batalkan pembayaran menunggu lainnya
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ total_lunas: 100000 }] }) // hitung total
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ nominal: 200000 }] }) // ambil nominal asli
        .mockResolvedValueOnce({ rowCount: 1 }); // update billing sisa/status

      const res = await request(app)
        .put('/api/keuangan/pembayaran/1/konfirmasi')
        .set('x-role', 'admin')
        .send({ action: 'terima' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

});
