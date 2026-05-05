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
    req.user = { id_users: 1, role: 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
}));

describe('KEUANGAN API TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/keuangan/billing/all', () => {
    test('✅ Berhasil ambil semua billing (admin)', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id_billing: 1, nama: 'Santri Test' }]
      });

      const res = await request(app)
        .get('/api/keuangan/billing/all')
        .set('Authorization', 'Bearer mock-token');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('❌ Gagal ambil semua billing (DB Error)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/keuangan/billing/all')
        .set('Authorization', 'Bearer mock-token');

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/keuangan/billing/spp-massal', () => {
    test('✅ Berhasil generate SPP massal', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 5 });

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
      expect(res.body.success).toBe(true);
    });

    test('❌ Gagal generate SPP massal (DB Error)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .post('/api/keuangan/billing/spp-massal')
        .send({
          periode: '2024-05',
          nominal_dewasa: 150000,
          nominal_anak: 100000,
          tgl_mulai: '2024-05-01',
          tgl_selesai: '2024-05-31'
        });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/keuangan/pembayaran', () => {
    // Override user role to santri for this test group
    beforeEach(() => {
        require('../../src/middleware/auth').onlySantri = (req, res, next) => next();
    });

    test('✅ Berhasil membuat pembayaran (santri)', async () => {
      // 1. Mock select billing
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_santri: 1, sisa: 100000, jenis: 'INFAQ_BELAJAR', tipe: 'infaq_belajar' }]
      });
      // 2. Mock check pending
      db.query.mockResolvedValueOnce({
        rows: [{ total_pending: 0 }]
      });
      // 3. Mock insert pembayaran
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      // 4. Mock update billing status
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      // 5. Mock email details
      db.query.mockResolvedValueOnce({ rows: [{ nama: 'Santri', nama_kelas: 'Kelas A' }] });
      // 6. Mock admin email
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ email: 'admin@test.com' }] });

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

    test('❌ Gagal buat pembayaran - Billing tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .send({ id_billing: 999, jumlah_bayar: 1000, metode: 'Cash' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Billing tidak ditemukan');
    });

    test('❌ Gagal buat pembayaran - Jumlah tidak valid (melebihi sisa)', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ sisa: 50000 }]
      });
      db.query.mockResolvedValueOnce({
        rows: [{ total_pending: 0 }]
      });

      const res = await request(app)
        .post('/api/keuangan/pembayaran')
        .send({ id_billing: 1, jumlah_bayar: 60000, metode: 'Cash' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Jumlah bayar tidak valid');
    });
  });

  describe('PUT /api/keuangan/pembayaran/:id/konfirmasi', () => {
    test('✅ Berhasil konfirmasi pembayaran (admin)', async () => {
      // 1. Get payment
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_billing: 1, jumlah_bayar: 100000 }]
      });
      // 2. Update payment status
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      // 3. Cancel other pending
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      // 4. Get total lunas
      db.query.mockResolvedValueOnce({ rows: [{ total_lunas: 100000 }] });
      // 5. Get billing nominal
      db.query.mockResolvedValueOnce({ rows: [{ nominal: 100000 }] });
      // 6. Update billing
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .put('/api/keuangan/pembayaran/1/konfirmasi');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Gagal konfirmasi - Pembayaran tidak ditemukan/sudah dikonfirmasi', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .put('/api/keuangan/pembayaran/999/konfirmasi');

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/keuangan/billing/manual', () => {
    test('✅ Berhasil tambah billing manual', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).post('/api/keuangan/billing/manual').send({
        id_santri: 1, jenis: 'SPP', tipe: 'bulanan', periode: '2024-05', nominal: 100000
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/billing/me', () => {
    test('✅ Berhasil ambil billing saya (santri)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_billing: 1 }] });
      const res = await request(app).get('/api/keuangan/billing/me');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/keuangan/pengeluaran', () => {
    test('✅ Berhasil catat pengeluaran', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).post('/api/keuangan/pengeluaran').send({
        tanggal: '2024-05-01', kategori: 'Listrik', nominal: 50000, keterangan: 'Bulan Mei'
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
      expect(res.body.saldo).toBe(50000);
    });
  });

  describe('POST /api/keuangan/billing/manual-kelas', () => {
    test('✅ Berhasil tambah billing kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1, id_jadwal: 1 }] });
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
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }, { id_santri: 2 }] });
      db.query.mockResolvedValue({ rowCount: 1 });
      const res = await request(app).post('/api/keuangan/billing/lainnya').send({
        nama_pembayaran: 'Infaq', nominal: 50000, tanggal_mulai: '2024-05-01', keterangan: 'Tes'
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/billing/lainnya/detail', () => {
    test('✅ Berhasil ambil detail billing lainnya', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/billing/lainnya/detail?tipe=Infaq&periode=2024-05');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/laporan/pemasukan/detail', () => {
    test('✅ Berhasil ambil detail pemasukan', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/laporan/pemasukan/detail');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/pengeluaran', () => {
    test('✅ Berhasil ambil daftar pengeluaran', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/pengeluaran');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/laporan/pengeluaran', () => {
    test('✅ Berhasil ambil laporan pengeluaran', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/laporan/pengeluaran');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/admin/santri/:id_santri', () => {
    test('✅ Berhasil ambil data keuangan santri (admin)', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // billing
      db.query.mockResolvedValueOnce({ rows: [] }); // pembayaran
      const res = await request(app).get('/api/keuangan/admin/santri/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/keuangan/billing/:id_billing/santri', () => {
    test('✅ Berhasil ambil pembayaran per billing (Infaq Belajar)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ jenis: 'INFAQ_BELAJAR', tipe: 'bulanan', periode: '2024-05' }] });
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/billing/1/santri');
      expect(res.statusCode).toBe(200);
    });

    test('✅ Berhasil ambil pembayaran per billing (Infaq Lainnya)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ jenis: 'INFAQ_LAINNYA', tipe: 'Infaq', periode: '2024-05' }] });
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/keuangan/billing/1/santri');
      expect(res.statusCode).toBe(200);
    });
  });

});
