const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: req.headers['x-role'] || 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
}));

describe('SANTRI API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/santri', () => {
    test('✅ Sukses ambil semua santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1, nama: 'Santri' }] }); // santriQuery
      db.query.mockResolvedValueOnce({ rows: [{ count: 1 }] }); // countQuery

      const res = await request(app).get('/api/santri?page=1&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.total_data).toBe(1);
    });
  });

  describe('GET /api/santri/:id', () => {
    test('✅ Sukses ambil detail santri', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1 }] });

      const res = await request(app).get('/api/santri/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id_santri).toBe(1);
    });

    test('❌ Gagal - tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).get('/api/santri/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/santri/:id', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      db.connect.mockResolvedValue(mockClient);
    });

    test('✅ Sukses update santri', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, email: 'old@test.com' }] }) // check old
        .mockResolvedValueOnce({}) // update status user
        .mockResolvedValueOnce({}) // update santri
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .put('/api/santri/1')
        .send({ nama: 'Baru', status: 'aktif' });

      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal - santri tidak ditemukan', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0 }); // check old

      const res = await request(app).put('/api/santri/999');
      expect(res.statusCode).toBe(500); // Controller throws error and catches it
    });
  });

  describe('DELETE /api/santri/:id', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      db.connect.mockResolvedValue(mockClient);
    });

    test('✅ Sukses hapus santri', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // 1. checkBilling
      mockClient.query.mockResolvedValueOnce({}); // 2. BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, email: 't@t.com' }] }); // 3. checkUser
      mockClient.query.mockResolvedValue({}); // cascade deletes...
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .delete('/api/santri/1')
        .send({ confirm_backup: true });

      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal - ada tunggakan tanpa konfirmasi', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ jenis: 'Infaq', jml: 1 }] });

      const res = await request(app).delete('/api/santri/1');
      expect(res.statusCode).toBe(400);
      expect(res.body.type).toBe('VALIDATION_TUNGGAKAN');
    });
  });

  test('Error Handler 500', async () => {
    db.query.mockRejectedValueOnce(new Error('Fail'));
    const res = await request(app).get('/api/santri');
    expect(res.statusCode).toBe(500);
  });
});
