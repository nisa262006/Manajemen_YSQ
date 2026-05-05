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
  onlyAdmin:   (req, res, next) => next(),
  onlySantri:  (req, res, next) => next(),
  onlyPengajar:(req, res, next) => next(),
}));

describe('KEUANGAN API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/keuangan/billing/all', () => {
    test('✅ Berhasil ambil semua billing (admin)', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id_billing: 1, nama: 'Santri Test' }]
      });
      const res = await request(app).get('/api/keuangan/billing/all');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/keuangan/billing/spp-massal', () => {
    test('✅ Berhasil generate SPP massal', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 5 });
      const res = await request(app).post('/api/keuangan/billing/spp-massal').send({
        periode: '2024-05', nominal_dewasa: 150000, nominal_anak: 100000, tgl_mulai: '2024-05-01', tgl_selesai: '2024-05-31'
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/keuangan/pembayaran', () => {
    test('✅ Berhasil membuat pembayaran', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1, sisa: 100000, jenis: 'SPP', tipe: 'bulanan' }] });
      db.query.mockResolvedValueOnce({ rows: [{ total_pending: 0 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update
      db.query.mockResolvedValueOnce({ rows: [{ nama: 'S', nama_kelas: 'K' }] }); // details
      db.query.mockResolvedValueOnce({ rows: [{ email: 'admin@test.com' }] }); // admin

      const res = await request(app).post('/api/keuangan/pembayaran').send({
        id_billing: 1, jumlah_bayar: 50000, metode: 'Transfer'
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/keuangan/pembayaran/:id/konfirmasi', () => {
    test('✅ Berhasil konfirmasi pembayaran', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_billing: 1, jumlah_bayar: 100000 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // cancel pending
      db.query.mockResolvedValueOnce({ rows: [{ total_lunas: 100000 }] }); // total
      db.query.mockResolvedValueOnce({ rows: [{ nominal: 100000 }] }); // nominal
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update billing
      const res = await request(app).put('/api/keuangan/pembayaran/1/konfirmasi');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/keuangan/billing/manual', () => {
    test('✅ Berhasil tambah billing manual', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'aktif' }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).post('/api/keuangan/billing/manual').send({
        id_santri: 1, tipe: 'Buku', nominal: 50000
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/billing/me', () => {
    test('✅ Berhasil ambil billing saya', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_billing: 1 }] });
      const res = await request(app).get('/api/keuangan/billing/me').set('x-role', 'santri');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/keuangan/pengeluaran', () => {
    test('✅ Berhasil catat pengeluaran', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).post('/api/keuangan/pengeluaran').send({
        tanggal: '2024-05-01', kategori: 'Listrik', nominal: 50000
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/laporan/ringkasan', () => {
    test('✅ Berhasil ambil ringkasan', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ total: 100000 }] });
      db.query.mockResolvedValueOnce({ rows: [{ total: 50000 }] });
      const res = await request(app).get('/api/keuangan/laporan/ringkasan');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/keuangan/billing/manual-kelas', () => {
    test('✅ Berhasil tambah billing kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // cek existing
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert
      const res = await request(app).post('/api/keuangan/billing/manual-kelas').send({
        id_kelas: 1, tipe: 'bulanan', periode_awal: '2024-05', periode_akhir: '2024-05', nominal: 100000
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/keuangan/billing/lainnya', () => {
    test('✅ Berhasil tambah billing lainnya', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }] });
      db.query.mockResolvedValue({ rowCount: 1 });
      const res = await request(app).post('/api/keuangan/billing/lainnya').send({
        nama_pembayaran: 'Infaq', nominal: 50000
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/admin/santri/:id_santri', () => {
    test('✅ Berhasil ambil data keuangan santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // billing
      db.query.mockResolvedValueOnce({ rows: [] }); // pembayaran
      const res = await request(app).get('/api/keuangan/admin/santri/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/billing/:id_billing/santri', () => {
    test('✅ Berhasil ambil pembayaran per billing', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ jenis: 'INFAQ_BELAJAR' }] });
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/billing/1/santri');
      expect(res.statusCode).toBe(200);
    });
  });
});
