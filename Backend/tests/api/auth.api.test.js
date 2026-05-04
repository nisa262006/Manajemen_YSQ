const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const bcrypt = require('bcrypt');

// ✅ MOCK DATABASE
jest.mock('../../src/config/db', () => {
  const mClient = {
    query: jest.fn(),
    release: jest.fn()
  };
  return {
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve(mClient))
  };
});

// ✅ MOCK BCRYPT
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

describe('AUTH API YSQ', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    db.connect.mockResolvedValue({
      query: jest.fn(),
      release: jest.fn()
    });
  });

  // ================= LOGIN =================
  describe('LOGIN', () => {

    test('Login berhasil', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 1,
          password_hash: '$2b$10$hashedpassword',
          role: 'admin',
          status_user: 'aktif'
        }]
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin2', password: 'admin2' });

      expect(res.statusCode).toBe(200);
    });

    test('Login gagal - password salah', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 1,
          password_hash: '$2b$10$hashedpassword',
          role: 'admin',
          status_user: 'aktif'
        }]
      });
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin2', password: 'salah' });

      expect(res.statusCode).toBe(400);
    });

    test('Login gagal - user tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'wrong', password: 'bebas' });

      expect(res.statusCode).toBe(404);
    });

  });

  // ================= REGISTER =================
  describe('REGISTER PENDAFTAR', () => {

    test('Register berhasil', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // checkEmail
          .mockResolvedValueOnce({ rows: [{ id_pendaftar: 1 }] }) // INSERT
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };
      db.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send({
          nama: 'Test User',
          email: 'test@mail.com',
          alamat: 'Bogor',
          no_wa: '08123',
          tanggal_lahir: '2000-01-01',
          tempat_lahir: 'Bogor'
        });

      expect(res.statusCode).toBe(201);
    });

  });

  // ================= FORGOT & RESET PASSWORD =================
  describe('FORGOT & RESET PASSWORD', () => {

    test('Reset Password - Token tidak valid', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // token check
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn()
      };
      db.connect.mockResolvedValueOnce(mockClient);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect(res.statusCode).toBe(400);
    });

  });

});