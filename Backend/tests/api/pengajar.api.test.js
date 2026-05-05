const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const bcrypt = require('bcrypt');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw')
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

describe('PENGAJAR API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pengajar/tambah', () => {
    test('✅ Sukses tambah pengajar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // cek email
      db.query.mockResolvedValueOnce({ rows: [{ max: 1 }] }); // get max nip
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // cek username
      db.query.mockResolvedValueOnce({ rows: [{ id_users: 10 }] }); // insert user
      db.query.mockResolvedValueOnce({}); // insert pengajar

      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send({
          nama: 'Ustadz Test',
          email: 'ustadz@test.com',
          password: 'pw',
          confirmPassword: 'pw'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.nip).toBeDefined();
    });

    test('❌ Gagal - password tidak sama', async () => {
      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send({ password: '1', confirmPassword: '2' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/pengajar', () => {
    test('✅ Sukses ambil semua pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      const res = await request(app).get('/api/pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/pengajar/:id', () => {
    test('✅ Sukses ambil detail pengajar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] });
      const res = await request(app).get('/api/pengajar/1');
      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal - tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).get('/api/pengajar/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/pengajar/:id', () => {
    test('✅ Sukses update pengajar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, email: 'old@test.com' }] }); // check
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update pengajar...

      const res = await request(app)
        .put('/api/pengajar/1')
        .send({ nama: 'Updated Name' });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/pengajar/:id', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      db.connect.mockResolvedValue(mockClient);
    });

    test('✅ Sukses hapus pengajar', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 10 }] }); // check
      mockClient.query.mockResolvedValue({}); // update jadwal, delete user...
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const res = await request(app).delete('/api/pengajar/1');
      expect(res.statusCode).toBe(200);
    });
  });

  test('Error Handler 500', async () => {
    db.query.mockRejectedValueOnce(new Error('Fail'));
    const res = await request(app).get('/api/pengajar');
    expect(res.statusCode).toBe(500);
  });
});
