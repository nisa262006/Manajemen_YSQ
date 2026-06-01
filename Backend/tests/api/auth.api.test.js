const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// ✅ SET ENV VARS
process.env.JWT_SECRET = 'test_secret';
process.env.EMAIL_SENDER = 'test@gmail.com';
process.env.EMAIL_PASSWORD = 'password';
process.env.BASE_URL = 'http://localhost:8000';

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

// ✅ MOCK NODEMAILER
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true)
  })
}));

// ✅ MOCK AUTH MIDDLEWARE (untuk getMe)
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next()
}));

describe('AUTH API COMPREHENSIVE TEST', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
    db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  // ================= LOGIN =================
  describe('POST /api/auth/login', () => {
    test('✅ Sukses login', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 1, password_hash: 'hash', role: 'admin', status_user: 'aktif' }]
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: 'pw' });
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('❌ Gagal - User tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).post('/api/auth/login').send({ identifier: 'wrong', password: 'pw' });
      expect(res.statusCode).toBe(404);
    });

    test('❌ Gagal - Akun tidak aktif', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 1, status_user: 'non-aktif' }]
      });
      const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: 'pw' });
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('tidak aktif');
    });

    test('❌ Gagal - Santri pending', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 1, status_user: 'aktif', role: 'santri', status_konfirmasi_santri: 'pending' }]
      });
      const res = await request(app).post('/api/auth/login').send({ identifier: 'santri', password: 'pw' });
      expect(res.statusCode).toBe(403);
      expect(res.body.statusAcc).toBe('pending');
    });

    test('❌ Gagal - Password salah', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 1, status_user: 'aktif', password_hash: 'hash' }]
      });
      bcrypt.compare.mockResolvedValueOnce(false);
      const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: 'wrong' });
      expect(res.statusCode).toBe(400);
    });

    test('❌ Server Error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Fail'));
      const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: 'pw' });
      expect(res.statusCode).toBe(500);
    });
  });

  // ================= GET ME =================
  describe('GET /api/auth/me', () => {
    test('✅ Sukses get profile', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, username: 'admin' }] });
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token');
      expect(res.statusCode).toBe(200);
      expect(res.body.profile).toBeDefined();
    });

    test('❌ Gagal - User tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token');
      expect(res.statusCode).toBe(404);
    });

    test('❌ Server Error', async () => {
      db.query.mockRejectedValueOnce(new Error('Error'));
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token');
      expect(res.statusCode).toBe(500);
    });
  });

  // ================= CREATE USER AFTER ACCEPTED =================
  describe('POST /api/auth/create-user-santri', () => {
    test('✅ Sukses buat user santri', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ nis: '123', nama_santri: 'Test', email: 't@t.com', kategori: 'anak' }] });
      bcrypt.hash.mockResolvedValueOnce('hash');
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 10, username: '123_test' }] });

      const res = await request(app).post('/api/auth/create-user-santri').send({ id_santri: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBeDefined();
    });

    test('❌ Gagal - Santri tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).post('/api/auth/create-user-santri').send({ id_santri: 99 });
      expect(res.statusCode).toBe(404);
    });
  });

  // ================= FORGOT PASSWORD =================
  describe('POST /api/auth/forgot-password', () => {
    test('✅ Sukses kirim email reset', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1 }] }) // check user
        .mockResolvedValueOnce({}) // delete old
        .mockResolvedValueOnce({}); // insert new

      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@mail.com' });
      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal - Email tidak diisi', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({});
      expect(res.statusCode).toBe(400);
    });

    test('❌ Gagal - Email tidak terdaftar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'unknown@mail.com' });
      expect(res.statusCode).toBe(404);
    });

    test('❌ Server Error (Email Fail)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1 }] });
      nodemailer.createTransport().sendMail.mockRejectedValueOnce(new Error('SMTP Fail'));
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@mail.com' });
      expect(res.statusCode).toBe(500);
    });
  });

  // ================= RESET PASSWORD =================
  describe('POST /api/auth/reset-password', () => {
    test('✅ Sukses reset password', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, expired_at: new Date(Date.now() + 10000) }] }) // token check
        .mockResolvedValueOnce({}) // update pw
        .mockResolvedValueOnce({}) // delete token
        .mockResolvedValueOnce({}); // COMMIT

      bcrypt.hash.mockResolvedValueOnce('hash');

      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'valid', password: 'newpassword', confirmPassword: 'newpassword'
      });
      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal - Password mismatch', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'v', password: 'abc', confirmPassword: 'def'
      });
      expect(res.statusCode).toBe(400);
    });

    test('❌ Gagal - Token kadaluarsa', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, expired_at: new Date(Date.now() - 10000) }] }) // token check
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'expired', password: 'newpassword', confirmPassword: 'newpassword'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('kadaluarsa');
    });

    test('❌ Gagal - Token tidak ditemukan', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0 }) // token check
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'invalid', password: 'newpassword', confirmPassword: 'newpassword'
      });
      expect(res.statusCode).toBe(400);
    });
  });
});