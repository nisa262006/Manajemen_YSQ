/**
 * API tests for admincontrollers.js
 * Coverage: getDashboardStats, getAdminProfile, updateAdminProfile,
 *           createAnnouncement, getAnnouncementByDate, getAllAnnouncements
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

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'admin', id_pengajar: null };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next()
}));

const db = require('../../src/config/db');

describe('Admin Controllers API', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = { query: jest.fn(), release: jest.fn() };
    db.connect.mockResolvedValue(mockClient);
  });

  // ===================== getDashboardStats =====================
  describe('GET /api/admin/stats', () => {
    test('200 - returns stats', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })   // pendaftar
        .mockResolvedValueOnce({ rows: [{ count: '20' }] })  // santri
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })   // pengajar
        .mockResolvedValueOnce({ rows: [{ count: '2' }] });  // kelas

      const res = await request(app).get('/api/admin/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_santri).toBe(20);
      expect(res.body.data.total_pengajar).toBe(3);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).get('/api/admin/stats');
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ===================== getAdminProfile =====================
  describe('GET /api/admin/profile/:id_admin', () => {
    test('200 - profile found', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_admin: 1, nama: 'Admin Test', email: 'admin@ysq.com', no_wa: '0812', id_users: 1, role: 'admin' }]
      });

      const res = await request(app).get('/api/admin/profile/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id_admin).toBe(1);
    });

    test('404 - admin not found', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app).get('/api/admin/profile/9999');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app).get('/api/admin/profile/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== updateAdminProfile =====================
  describe('PUT /api/admin/profile/:id_admin', () => {
    test('200 - update berhasil', async () => {
      mockClient.query
        .mockResolvedValueOnce({})  // BEGIN
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_users: 1, nama: 'Admin Test', email: 'admin@ysq.com', no_wa: '0812' }]
        })  // oldData
        .mockResolvedValueOnce({
          rows: [{ id_admin: 1, nama: 'Admin Updated', email: 'admin@ysq.com', no_wa: '0812' }]
        })  // adminUpdate
        .mockResolvedValueOnce({})  // update users email
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .put('/api/admin/profile/1')
        .send({ nama: 'Admin Updated', email: 'admin@ysq.com', no_wa: '0812' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('404 - admin tidak ditemukan', async () => {
      mockClient.query
        .mockResolvedValueOnce({})                          // BEGIN
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // oldData not found

      const res = await request(app)
        .put('/api/admin/profile/9999')
        .send({ nama: 'X' });

      expect(res.statusCode).toBe(404);
    });

    test('500 - db error during update', async () => {
      mockClient.query
        .mockResolvedValueOnce({})  // BEGIN
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ id_users: 1, nama: 'Admin', email: 'admin@ysq.com', no_wa: '0812' }]
        })  // oldData
        .mockRejectedValueOnce(new Error('Update failed')); // adminUpdate fails

      const res = await request(app)
        .put('/api/admin/profile/1')
        .send({ nama: 'Admin' });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ===================== createAnnouncement =====================
  describe('POST /api/admin/announcement', () => {
    test('201 - announcement dibuat', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, tanggal: '2026-05-11', isi: 'Libur nasional', id_pengajar: null }]
      });

      const res = await request(app)
        .post('/api/admin/announcement')
        .send({ tanggal: '2026-05-11', isi: 'Libur nasional' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('400 - tanggal dan isi wajib', async () => {
      const res = await request(app)
        .post('/api/admin/announcement')
        .send({ isi: 'Libur' }); // no tanggal

      expect(res.statusCode).toBe(400);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app)
        .post('/api/admin/announcement')
        .send({ tanggal: '2026-05-11', isi: 'Test' });

      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getAnnouncementByDate =====================
  describe('GET /api/admin/announcement/date/:tanggal', () => {
    test('200 - returns announcement data', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ isi: 'Libur nasional' }]
      });

      const res = await request(app).get('/api/admin/announcement/date/2026-05-11');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isi).toBe('Libur nasional');
    });

    test('200 - no data returns empty isi', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/admin/announcement/date/2026-01-01');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.isi).toBe('');
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).get('/api/admin/announcement/date/2026-05-11');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getAllAnnouncements =====================
  describe('GET /api/admin/announcements', () => {
    test('200 - returns all announcements', async () => {
      db.query.mockResolvedValueOnce({
        rows: [
          { id: 1, tanggal: '2026-05-11', isi: 'Test' },
          { id: 2, tanggal: '2026-05-10', isi: 'Test2' }
        ]
      });

      const res = await request(app).get('/api/admin/announcement');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).get('/api/admin/announcement');
      expect(res.statusCode).toBe(500);
    });
  });
});
