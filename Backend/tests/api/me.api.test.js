const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');
const jwt = require('jsonwebtoken');

// Mock helpers for token generation
const JWT_SECRET = process.env.JWT_SECRET || 'secret_test';
const makeToken = (id, role) => jwt.sign({ id_users: id, role }, JWT_SECRET, { expiresIn: '1h' });

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

// Mock verifyToken middleware to use our secret
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
    const token = authHeader.split(" ")[1];
    try {
      const jwt = require('jsonwebtoken');
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret_test');
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  },
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next()
}));

describe('ME API TEST (CONTROLLER VERSION)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Pre-emptively handle the 'SELECT 1' connection test from db.js if it happens
    db.query.mockImplementation((q) => {
      if (q === 'SELECT 1') return Promise.resolve({ rowCount: 1, rows: [] });
      return Promise.resolve({ rowCount: 0, rows: [] });
    });
  });

  describe('GET /api/me', () => {
    
    test('✅ Sukses - Santri Aktif', async () => {
      db.query.mockImplementation(async (q) => {
        if (q === 'SELECT 1') return { rowCount: 1, rows: [] };
        return {
          rowCount: 1,
          rows: [{ id_santri: 1, nama: 'Santri Test', status: 'aktif', role: 'santri' }]
        };
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(1, 'santri')}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.nama).toBe('Santri Test');
    });

    test('❌ Gagal - Santri Nonaktif', async () => {
      db.query.mockImplementation(async (q) => {
        if (q === 'SELECT 1') return { rowCount: 1, rows: [] };
        return {
          rowCount: 1,
          rows: [{ id_santri: 1, nama: 'Santri Test', status: 'tidak aktif', role: 'santri' }]
        };
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(1, 'santri')}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('tidak aktif');
    });

    test('✅ Sukses - Pengajar', async () => {
      db.query.mockImplementation(async (q) => {
        if (q === 'SELECT 1') return { rowCount: 1, rows: [] };
        return {
          rowCount: 1,
          rows: [{ id_pengajar: 1, nama: 'Pengajar Test', role: 'pengajar' }]
        };
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(1, 'pengajar')}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe('pengajar');
    });

    test('✅ Sukses - Admin', async () => {
      db.query.mockImplementation(async (q) => {
        if (q === 'SELECT 1') return { rowCount: 1, rows: [] };
        return {
          rowCount: 1,
          rows: [{ id_admin: 1, nama: 'Admin Test', role: 'admin' }]
        };
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(1, 'admin')}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.role).toBe('admin');
    });

    test('❌ Gagal - Role tidak dikenali', async () => {
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(1, 'stranger')}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Role tidak dikenali');
    });

    test('❌ Gagal - Profil tidak ditemukan', async () => {
      db.query.mockImplementation(async (q) => {
        if (q === 'SELECT 1') return { rowCount: 1, rows: [] };
        return { rowCount: 0, rows: [] };
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(999, 'santri')}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });

    test('❌ Gagal - DB Error', async () => {
      db.query.mockImplementation(async (q) => {
        if (q === 'SELECT 1') return { rowCount: 1, rows: [] };
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${makeToken(1, 'santri')}`);

      expect(res.statusCode).toBe(500);
    });

    test('❌ Gagal - Tanpa Token', async () => {
      const res = await request(app).get('/api/me');
      expect(res.statusCode).toBe(401);
    });

  });

});
