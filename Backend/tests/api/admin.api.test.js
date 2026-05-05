const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'admin', id_pengajar: 1 };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
}));

describe('ADMIN API TEST (MOCKED)', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
  });

  describe('GET /api/admin/stats', () => {
    test('✅ Sukses ambil stats', async () => {
      db.query.mockResolvedValue({ rows: [{ count: '10' }] });
      const res = await request(app).get('/api/admin/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.total_santri).toBe(10);
    });
  });

  describe('GET /api/admin/profile/:id', () => {
    test('✅ Sukses ambil profile', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_admin: 1, nama: 'Admin' }] });
      const res = await request(app).get('/api/admin/profile/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/admin/profile/:id', () => {
    test('✅ Sukses update profile', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1 }] }); // old
      mockClient.query.mockResolvedValueOnce({ rows: [{ id_admin: 1 }] }); // update admin
      mockClient.query.mockResolvedValueOnce({}); // update user
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const res = await request(app).put('/api/admin/profile/1').send({ nama: 'Baru' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('ANNOUNCEMENT API', () => {
    test('✅ Sukses create announcement', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_announcement: 1 }] });
      const res = await request(app).post('/api/admin/announcement').send({ tanggal: '2025-01-01', isi: 'Test' });
      expect(res.statusCode).toBe(201);
    });

    test('✅ Sukses get all announcements', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).get('/api/admin/announcement');
      expect(res.statusCode).toBe(200);
    });
  });

  test('Error Handler 500', async () => {
    db.query.mockRejectedValueOnce(new Error('Fail'));
    const res = await request(app).get('/api/admin/stats');
    expect(res.statusCode).toBe(500);
  });
});
