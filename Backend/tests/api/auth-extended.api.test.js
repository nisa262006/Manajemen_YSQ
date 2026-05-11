/**
 * Extended auth API tests to maximize authcontrollers.js coverage
 */

const request = require('supertest');
const app = require('../../src/app');

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

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword')
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test' })
  })
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next()
}));

const db = require('../../src/config/db');
const bcrypt = require('bcrypt');

describe('Auth Controllers - Extended Coverage', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = { query: jest.fn(), release: jest.fn() };
    db.connect.mockResolvedValue(mockClient);
  });

  // ===================== LOGIN =====================
  describe('POST /api/auth/login', () => {
    test('200 - login berhasil', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 1,
          password_hash: '$2b$10$hashedpassword',
          role: 'admin',
          status_user: 'aktif',
          status_konfirmasi_santri: null
        }]
      });
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin2', password: 'admin2' });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('admin');
    });

    test('404 - user tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'nonexistent', password: 'pass' });

      expect(res.statusCode).toBe(404);
    });

    test('403 - akun tidak aktif', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 1,
          password_hash: '$2b$10$hash',
          role: 'admin',
          status_user: 'nonaktif',
          status_konfirmasi_santri: null
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin2', password: 'admin2' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('tidak aktif');
    });

    test('403 - santri pending konfirmasi', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 2,
          password_hash: '$2b$10$hash',
          role: 'santri',
          status_user: 'aktif',
          status_konfirmasi_santri: 'pending'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'santri1', password: 'pass' });

      expect(res.statusCode).toBe(403);
      expect(res.body.statusAcc).toBe('pending');
    });

    test('400 - password salah', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 1,
          password_hash: '$2b$10$hash',
          role: 'admin',
          status_user: 'aktif',
          status_konfirmasi_santri: null
        }]
      });
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin2', password: 'wrongpass' });

      expect(res.statusCode).toBe(400);
    });

    test('500 - catch db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin2', password: 'pass' });

      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== GET ME =====================
  describe('GET /api/auth/me', () => {
    test('200 - returns user profile', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 1, username: 'admin2', email: 'admin2@ysq.com', role: 'admin', status_user: 'aktif' }]
      });

      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.id_users).toBe(1);
    });

    test('404 - user tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(404);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== FORGOT PASSWORD =====================
  describe('POST /api/auth/forgot-password', () => {
    test('400 - email wajib diisi', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email wajib diisi');
    });

    test('404 - email tidak terdaftar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@mail.com' });

      expect(res.statusCode).toBe(404);
    });

    test('200 - email berhasil dikirim', async () => {
      process.env.EMAIL_SENDER = 'test@gmail.com';
      process.env.EMAIL_PASSWORD = 'testpass';
      process.env.BASE_URL = 'http://localhost:8000';

      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1 }] })   // check email
        .mockResolvedValueOnce({})     // DELETE old tokens
        .mockResolvedValueOnce({});    // INSERT new token

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'admin2@ysq.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('dikirim');
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@mail.com' });

      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== RESET PASSWORD =====================
  describe('POST /api/auth/reset-password', () => {
    test('400 - token diperlukan', async () => {
      mockClient.query
        .mockResolvedValueOnce({})  // BEGIN
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // token not found

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'newpass123', confirmPassword: 'newpass123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Token diperlukan');
    });

    test('400 - password terlalu pendek', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'abc', password: '123', confirmPassword: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('minimal 6');
    });

    test('400 - konfirmasi password tidak cocok', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'abc', password: 'password123', confirmPassword: 'different' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('tidak cocok');
    });

    test('400 - token tidak valid', async () => {
      mockClient.query
        .mockResolvedValueOnce({})                           // BEGIN
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })   // token check fails
        .mockResolvedValueOnce({});                          // ROLLBACK

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalidtoken', password: 'password123', confirmPassword: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Token tidak valid');
    });

    test('400 - token kadaluarsa', async () => {
      const expiredDate = new Date(Date.now() - 60000); // 1 minute ago
      mockClient.query
        .mockResolvedValueOnce({})  // BEGIN
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_users: 1, expired_at: expiredDate.toISOString() }]
        })  // token found but expired
        .mockResolvedValueOnce({}); // ROLLBACK

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'expiredtoken', password: 'password123', confirmPassword: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Token telah kadaluarsa');
    });

    test('200 - password berhasil diperbarui', async () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutes from now
      mockClient.query
        .mockResolvedValueOnce({})  // BEGIN
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_users: 1, expired_at: futureDate.toISOString() }]
        })  // token valid
        .mockResolvedValueOnce({})  // UPDATE password
        .mockResolvedValueOnce({})  // DELETE token
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'validtoken123', password: 'newpassword', confirmPassword: 'newpassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('berhasil diperbarui');
    });

    test('500 - catch error during reset', async () => {
      mockClient.query
        .mockResolvedValueOnce({})  // BEGIN
        .mockRejectedValueOnce(new Error('DB crash')); // token query fails

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'validtoken', password: 'password123', confirmPassword: 'password123' });

      expect(res.statusCode).toBe(500);
    });
  });


  // ===================== CREATE USER AFTER SANTRI ACCEPTED (direct controller unit test) =====================
  describe('createUserAfterSantriAccepted (controller unit)', () => {
    let ctrl;
    beforeAll(() => {
      ctrl = require('../../src/controllers/authcontrollers');
    });

    function mockReqRes(body = {}) {
      return {
        req: { body },
        res: {
          statusCode: 200,
          body: null,
          status(c) { this.statusCode = c; return this; },
          json(d) { this.body = d; return this; }
        }
      };
    }

    test('200 - user berhasil dibuat', async () => {
      db.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ nis: 'YSQ26DWS001', nama: 'Santri Test', email: 'santri@mail.com', kategori: 'dewasa' }]
        })
        .mockResolvedValueOnce({
          rows: [{ id_users: 10, username: 'ysq26dws001_santritest' }]
        });

      const { req, res } = mockReqRes({ id_santri: 1 });
      await ctrl.createUserAfterSantriAccepted(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('diterima');
    });

    test('404 - santri tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const { req, res } = mockReqRes({ id_santri: 999 });
      await ctrl.createUserAfterSantriAccepted(req, res);
      expect(res.statusCode).toBe(404);
    });

    test('500 - catch error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const { req, res } = mockReqRes({ id_santri: 1 });
      await ctrl.createUserAfterSantriAccepted(req, res);
      expect(res.statusCode).toBe(500);
    });
  });
});

