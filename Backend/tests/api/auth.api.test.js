const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  })
}));

describe('AUTH API TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('✅ Login sukses - Admin', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 1,
          email: 'admin@test.com',
          username: 'admin',
          password_hash: hashedPassword,
          role: 'admin',
          status_user: 'aktif'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('admin');
    });

    test('❌ Login gagal - User tidak ditemukan (404)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'wronguser', password: 'password123' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Akun tidak ditemukan');
    });

    test('❌ Login gagal - Akun tidak aktif (403)', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ status_user: 'nonaktif' }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'user', password: 'password' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('tidak aktif');
    });

    test('❌ Login gagal - Santri pending (403)', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_users: 2,
          role: 'santri',
          status_user: 'aktif',
          status_konfirmasi_santri: 'pending',
          password_hash: 'any'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'santri', password: 'password' });

      expect(res.statusCode).toBe(403);
      expect(res.body.statusAcc).toBe('pending');
    });

    test('❌ Login gagal - Password salah (400)', async () => {
      const hashedPassword = await bcrypt.hash('realpassword', 10);
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          password_hash: hashedPassword,
          status_user: 'aktif'
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'user', password: 'wrongpassword' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Password yang Anda masukkan salah');
    });

    test('❌ Login gagal - DB Error (500)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'user', password: 'password' });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('✅ Sukses kirim email reset password', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1 }] }); // user check
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // delete existing tokens
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert new token

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user@test.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('telah dikirim');
    });

    test('❌ Gagal - Email kosong (400)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: '' });

      expect(res.statusCode).toBe(400);
    });

    test('❌ Gagal - Email tidak terdaftar (404)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'notfound@test.com' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      db.connect.mockResolvedValue(mockClient);
    });

    test('✅ Sukses reset password', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, expired_at: new Date(Date.now() + 10000) }] }) // token check
        .mockResolvedValueOnce({}) // update password
        .mockResolvedValueOnce({}) // delete token
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'newpassword123', confirmPassword: 'newpassword123' });

      expect(res.statusCode).toBe(200);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    test('❌ Gagal - Token tidak valid (400)', async () => {
        mockClient.query
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rowCount: 0 }); // token check

        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'invalid-token', password: 'newpassword123', confirmPassword: 'newpassword123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Token tidak valid');
    });

    test('❌ Gagal - Password tidak cocok (400)', async () => {
        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'token', password: 'password123', confirmPassword: 'different' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('tidak cocok');
    });

    test('❌ Gagal - DB Error (500)', async () => {
        mockClient.query.mockRejectedValueOnce(new Error('Transaction Error'));

        const res = await request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'token', password: 'password123', confirmPassword: 'password123' });

        expect(res.statusCode).toBe(500);
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('POST /api/auth/create-user-santri', () => {
    test('✅ Sukses buat user santri setelah diterima', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ nis: '123', nama_santri: 'Santri Baru', email: 'new@test.com', kategori: 'Tahfidz' }]
      }); // santri check
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 10, username: '123_santribaru' }]
      }); // insert user

      const res = await request(app)
        .post('/api/auth/create-user-santri')
        .send({ id_santri: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('123_santribaru');
      expect(res.body.password_default).toBe('santribaru123');
    });

    test('❌ Gagal - Santri tidak ditemukan (404)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .post('/api/auth/create-user-santri')
        .send({ id_santri: 999 });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/auth/me', () => {
    test('✅ Sukses ambil profile saya', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_users: 1, username: 'admin', role: 'admin' }]
      });

      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.username).toBe('admin');
    });

    test('❌ Gagal - User tidak ditemukan (404)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(404);
    });

    test('❌ Gagal - DB Error (500)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(500);
    });
  });

});