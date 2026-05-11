/**
 * API tests for santricontrollers.js
 * Full coverage: success, not found, catch errors, excel export
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
    req.user = { id_users: 1, role: 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next()
}));

const db = require('../../src/config/db');
let mockDbState;

// Dynamic mock for mockClient.query
db.connect.mockImplementation(() => {
  const mClient = {
    release: jest.fn(),
    query: jest.fn(async (queryStr, params) => {
      if (mockDbState.crash && queryStr !== "ROLLBACK" && queryStr !== "BEGIN" && queryStr !== "COMMIT") throw new Error('DB crash');
      
      // Update Santri Queries
      if (queryStr.includes('SELECT s.*, u.id_users, u.email AS user_email')) {
        if (mockDbState.notFound) return { rowCount: 0, rows: [] };
        return { rowCount: 1, rows: [{ id_users: 10, email: 'old@mail.com', user_email: 'old@mail.com', status: 'aktif', nama: 'Test', kategori: 'anak' }] };
      }
      if (queryStr.includes('SELECT 1 FROM users WHERE email')) {
        if (mockDbState.emailConflict) return { rowCount: 1, rows: [{ id_users: 11 }] };
        return { rowCount: 0, rows: [] };
      }

      // Delete Santri Queries
      if (queryStr.includes('SELECT jenis, COUNT(*) as jml')) {
        if (mockDbState.hasTunggakan) return { rowCount: 1, rows: [{ jenis: 'spp', jml: 1 }] };
        return { rowCount: 0, rows: [] };
      }
      if (queryStr.includes('SELECT saldo FROM tabungan_santri')) {
        if (mockDbState.hasPiutang) return { rowCount: 1, rows: [{ saldo: -50000 }] };
        if (mockDbState.hasTabungan) return { rowCount: 1, rows: [{ saldo: 50000 }] };
        return { rowCount: 0, rows: [] };
      }
      if (queryStr.includes('SELECT id_users') && queryStr.includes('FROM santri WHERE id_santri')) {
        if (mockDbState.notFound) return { rowCount: 0, rows: [] };
        return { rowCount: 1, rows: [{ id_users: 10, email: 'test@mail.com' }] };
      }

      return { rowCount: 1, rows: [{}] };
    })
  };
  if (mockDbState.connectCrash) return Promise.reject(new Error('Connect crash'));
  return Promise.resolve(mClient);
});

// Dynamic mock for db.query (direct queries used by getAllSantri, getSantriById, exportSantriExcel)
db.query.mockImplementation(async (queryStr, params) => {
  if (mockDbState.crash) throw new Error('DB crash');
  
  // getAllSantri - first query returns data, second returns count
  if (queryStr && queryStr.includes('SELECT DISTINCT ON (s.id_santri)')) {
    return { rowCount: 1, rows: [{ id_santri: 1, nama: 'Santri A' }] };
  }
  if (queryStr && queryStr.includes('SELECT COUNT(*)')) {
    return { rowCount: 1, rows: [{ count: '1' }] };
  }

  // getSantriById
  if (queryStr && queryStr.includes('FROM santri s') && queryStr.includes('WHERE s.id_santri')) {
    if (mockDbState.notFound) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [{ id_santri: 1, nama: 'Santri A' }] };
  }

  return { rowCount: 1, rows: [{ id_santri: 1, nama: 'Santri A' }] };
});

describe('Santri Controllers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbState = {
      crash: false,
      connectCrash: false,
      notFound: false,
      emailConflict: false,
      hasTunggakan: false,
      hasPiutang: false,
      hasTabungan: false
    };
  });

  // ===================== getAllSantri =====================
  describe('GET /api/santri', () => {
    test('200 - returns list', async () => {
      const res = await request(app).get('/api/santri');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('500 - catch error', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/santri');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getSantriById =====================
  describe('GET /api/santri/:id', () => {
    test('200 - return detail', async () => {
      const res = await request(app).get('/api/santri/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('404 - not found', async () => {
      mockDbState.notFound = true;
      const res = await request(app).get('/api/santri/99');
      expect(res.statusCode).toBe(404);
    });

    test('500 - catch error', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/santri/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== updateSantri =====================
  describe('PUT /api/santri/:id', () => {
    const validUpdate = { nama: 'Updated', email: 'new@mail.com', no_wa: '0812' };

    test('200 - update berhasil', async () => {
      const res = await request(app).put('/api/santri/1').send(validUpdate);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('200 - update berhasil dengan hitungUmur (anak)', async () => {
      const anakUpdate = { ...validUpdate, tanggal_lahir: new Date().toISOString() };
      const res = await request(app).put('/api/santri/1').send(anakUpdate);
      expect(res.statusCode).toBe(200);
    });

    test('500 - santri tidak ditemukan (controller throws Error)', async () => {
      mockDbState.notFound = true;
      const res = await request(app).put('/api/santri/99').send(validUpdate);
      // Controller throws Error("Santri tidak ditemukan") which goes to catch -> 500
      expect(res.statusCode).toBe(500);
    });

    test('500 - email sudah digunakan user lain (controller throws Error)', async () => {
      mockDbState.emailConflict = true;
      const res = await request(app).put('/api/santri/1').send(validUpdate);
      // Controller throws Error("Email sudah digunakan user lain") -> catch -> 500
      expect(res.statusCode).toBe(500);
    });

    test('500 - catch error on query', async () => {
      mockDbState.crash = true;
      const res = await request(app).put('/api/santri/1').send(validUpdate);
      expect(res.statusCode).toBe(500);
    });

    test('500 - catch error on connect', async () => {
      mockDbState.connectCrash = true;
      const res = await request(app).put('/api/santri/1').send(validUpdate);
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== deleteSantri =====================
  describe('DELETE /api/santri/:id', () => {
    test('200 - delete berhasil (dengan confirm_backup)', async () => {
      const res = await request(app).delete('/api/santri/1').send({ confirm_backup: true });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('400 - tanpa confirm_backup', async () => {
      const res = await request(app).delete('/api/santri/1').send({ confirm_backup: false });
      expect(res.statusCode).toBe(400);
    });

    test('400 - ada tunggakan tanpa konfirmasi', async () => {
      mockDbState.hasTunggakan = true;
      const res = await request(app).delete('/api/santri/1');
      expect(res.statusCode).toBe(400);
    });

    test('200 - ada tunggakan dengan konfirmasi (confirm_tunggakan + confirm_backup)', async () => {
      mockDbState.hasTunggakan = true;
      const res = await request(app).delete('/api/santri/1').send({ confirm_tunggakan: true, confirm_backup: true });
      expect(res.statusCode).toBe(200);
    });

    test('500 - not found (controller throws Error)', async () => {
      mockDbState.notFound = true;
      const res = await request(app).delete('/api/santri/99').send({ confirm_backup: true });
      // Controller throws Error("Santri tidak ditemukan") -> catch -> 500
      expect(res.statusCode).toBe(500);
    });

    test('500 - catch error on query', async () => {
      mockDbState.crash = true;
      const res = await request(app).delete('/api/santri/1').send({ confirm_backup: true });
      expect(res.statusCode).toBe(500);
    });

    test('500 - catch error on connect', async () => {
      mockDbState.connectCrash = true;
      const res = await request(app).delete('/api/santri/1').send({ confirm_backup: true });
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== exportSantriExcel =====================
  describe('GET /api/santri/export/excel', () => {
    test('200 - export excel returns xlsx binary', async () => {
      // ExcelJS writes xlsx binary to response, not JSON
      const res = await request(app).get('/api/santri/export/excel');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });

    test('500 - catch error', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/santri/export/excel');
      expect(res.statusCode).toBe(500);
    });
  });
});
