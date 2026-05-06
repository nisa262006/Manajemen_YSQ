const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

// ================= MOCK =================
jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    const role = req.headers['x-role'] || 'admin';
    const id_users = Number(req.headers['x-id-users'] || '1');
    req.user = { id_users, role };
    next();
  },
  onlyAdmin:   (req, res, next) => next(),
  onlySantri:  (req, res, next) => next(),
  onlyPengajar:(req, res, next) => next(),
}));

describe('💰 KEUANGAN API (FULL TEST)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================================================
  // 🔵 GET ALL BILLING
  // ======================================================
  describe('GET /billing/all', () => {

    test('✅ sukses ambil semua billing', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id_billing: 1, nama: 'Santri A' }]
      });

      const res = await request(app).get('/api/keuangan/billing/all');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ gagal database error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB ERROR'));

      const res = await request(app).get('/api/keuangan/billing/all');

      expect(res.statusCode).toBe(500);
    });
  });

  // ======================================================
  // 🟢 CREATE PEMBAYARAN
  // ======================================================
  describe('POST /pembayaran', () => {

    test('✅ sukses bayar', async () => {
      db.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_santri: 1, sisa: 100000, jenis: 'SPP', tipe: 'bulanan' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_pending: 0 }]
        })
        .mockResolvedValueOnce({}) // insert pembayaran
        .mockResolvedValueOnce({}) // update billing
        .mockResolvedValueOnce({ rows: [{ nama: 'A', nama_kelas: 'B' }] })
        .mockResolvedValueOnce({ rows: [{ email: 'admin@test.com' }] });

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .send({
          id_billing: 1,
          jumlah_bayar: 50000,
          metode: 'Transfer'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ gagal jika billing tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .send({
          id_billing: 99,
          jumlah_bayar: 50000,
          metode: 'Transfer'
        });

      expect(res.statusCode).toBe(400);
    });

    test('❌ gagal jika jumlah > sisa', async () => {
      db.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_santri: 1, sisa: 50000, jenis: 'SPP', tipe: 'bulanan' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_pending: 0 }]
        });

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .send({
          id_billing: 1,
          jumlah_bayar: 100000,
          metode: 'Transfer'
        });

      expect(res.statusCode).toBe(400);
    });

    test('❌ gagal jika jumlah = 0', async () => {
      db.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_santri: 1, sisa: 50000, jenis: 'SPP', tipe: 'bulanan' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_pending: 0 }]
        });

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .send({
          id_billing: 1,
          jumlah_bayar: 0,
          metode: 'Transfer'
        });

      expect(res.statusCode).toBe(400);
    });

  });

  // ======================================================
  // 🟣 KONFIRMASI PEMBAYARAN
  // ======================================================
  describe('PUT /pembayaran/:id/konfirmasi', () => {

    test('✅ sukses konfirmasi', async () => {
      db.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_billing: 1, jumlah_bayar: 100000 }]
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{ total_lunas: 100000 }]
        })
        .mockResolvedValueOnce({
          rows: [{ nominal: 100000 }]
        })
        .mockResolvedValueOnce({});

      const res = await request(app)
        .put('/api/keuangan/pembayaran/1/konfirmasi');

      expect(res.statusCode).toBe(200);
    });

    test('❌ gagal jika pembayaran tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .put('/api/keuangan/pembayaran/1/konfirmasi');

      expect(res.statusCode).toBe(400);
    });

  });

  // ======================================================
  // 🟡 GENERATE SPP MASSAL
  // ======================================================
  describe('POST /billing/spp-massal', () => {

    test('✅ sukses generate spp', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/api/keuangan/billing/spp-massal')
        .send({
          periode: '2024-05',
          nominal_dewasa: 150000,
          nominal_anak: 100000,
          tgl_mulai: '2024-05-01',
          tgl_selesai: '2024-05-31'
        });

      expect(res.statusCode).toBe(200);
    });

  });

  // ======================================================
  // 🔴 PENGELUARAN
  // ======================================================
  describe('POST /pengeluaran', () => {

    test('✅ sukses tambah pengeluaran', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/api/keuangan/pengeluaran')
        .send({
          tanggal: '2024-05-01',
          kategori: 'Listrik',
          nominal: 50000
        });

      expect(res.statusCode).toBe(200);
    });

  });

  // ======================================================
  // 📊 LAPORAN RINGKASAN
  // ======================================================
  describe('GET /laporan/ringkasan', () => {

    test('✅ sukses ambil ringkasan', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: 100000 }] })
        .mockResolvedValueOnce({ rows: [{ total: 50000 }] });

      const res = await request(app)
        .get('/api/keuangan/laporan/ringkasan');

      expect(res.statusCode).toBe(200);
      expect(res.body.saldo).toBe(50000);
    });

  });

});