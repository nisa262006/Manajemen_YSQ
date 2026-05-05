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

describe('REGISTER API TEST (MOCKED)', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
  });

  describe('POST /api/pendaftar/daftar', () => {
    test('✅ Sukses mendaftar', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // check email
      mockClient.query.mockResolvedValueOnce({ rows: [{ id_pendaftar: 1 }] }); // insert
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send({ 
          nama: 'Test', 
          email: 'test@test.com', 
          alamat: 'Jl. Test',
          no_wa: '081', 
          tanggal_lahir: '2000-01-01',
          tempat_lahir: 'Jakarta'
        });

      expect(res.statusCode).toBe(201);
    });

    test('❌ Gagal - email sudah ada', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [{ id_pendaftar: 1 }], rowCount: 1 }); // check email
      mockClient.query.mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send({ 
          nama: 'Test', email: 'existing@test.com', alamat: 'A',
          no_wa: '1', tanggal_lahir: '2000-01-01', tempat_lahir: 'T'
        });

      expect(res.statusCode).toBe(409);
    });

    test('❌ Gagal - input tidak lengkap', async () => {
      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send({ nama: 'Test' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/pendaftar', () => {
    test('✅ Sukses ambil semua pendaftar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pendaftar: 1 }] });
      const res = await request(app).get('/api/pendaftar');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/pendaftar/:id', () => {
    test('✅ Sukses ambil detail pendaftar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pendaftar: 1 }] });
      const res = await request(app).get('/api/pendaftar/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/pendaftar/terima/:id', () => {
    test('✅ Sukses terima pendaftar', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pendaftar: 1, email: 't@t.com', nama: 'T', tanggal_lahir: '2010-01-01' }] }); // find
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // check email users
      mockClient.query.mockResolvedValueOnce({ rows: [{ max: 1 }] }); // max nis
      mockClient.query.mockResolvedValueOnce({ rows: [{ id_users: 10 }] }); // insert user
      mockClient.query.mockResolvedValueOnce({}); // insert santri
      mockClient.query.mockResolvedValueOnce({}); // update pendaftar
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const res = await request(app).put('/api/pendaftar/terima/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PATCH/PUT /api/pendaftar/tolak/:id', () => {
    test('✅ Sukses tolak pendaftar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).put('/api/pendaftar/tolak/1'); // In route it's PUT or PATCH? Check routes.
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/pendaftar/:id', () => {
    test('✅ Sukses hapus pendaftar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).delete('/api/pendaftar/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/pendaftar/reset/all', () => {
    test('✅ Sukses reset pendaftar', async () => {
      db.query.mockResolvedValueOnce({});
      const res = await request(app).delete('/api/pendaftar/reset/all');
      expect(res.statusCode).toBe(200);
    });
  });

  test('Error Handler 500', async () => {
    db.query.mockRejectedValueOnce(new Error('Fail'));
    const res = await request(app).get('/api/pendaftar');
    expect(res.statusCode).toBe(500);
  });
});
