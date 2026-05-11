/**
 * API tests for registercontrollers.js
 * Full coverage: success, validation, duplicate, not found, catch errors
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
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
  compare: jest.fn()
}));

// Mock verifyToken and onlyAdmin for protected routes
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

describe('Register / Pendaftar API', () => {

  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    db.connect.mockResolvedValue(mockClient);
  });

  // ===================== daftarPendaftar =====================
  describe('POST /api/pendaftar/daftar', () => {

    const validPayload = {
      nama: 'Ahmad Fauzi',
      email: 'ahmad@mail.com',
      alamat: 'Jl. Bogor No. 1',
      no_wa: '081234567890',
      tanggal_lahir: '2005-01-15',
      tempat_lahir: 'Bogor'
    };

    test('201 - pendaftaran berhasil', async () => {
      mockClient.query
        .mockResolvedValueOnce({})                          // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })   // cekEmail (not dup)
        .mockResolvedValueOnce({ rows: [{ id_pendaftar: 1, ...validPayload }] })  // INSERT
        .mockResolvedValueOnce({});                         // COMMIT

      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send(validPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Pendaftaran berhasil');
    });

    test('400 - field tidak lengkap', async () => {
      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send({ nama: 'Ahmad', email: 'a@mail.com' }); // missing fields

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Semua field wajib diisi');
    });

    test('409 - email sudah terdaftar', async () => {
      mockClient.query
        .mockResolvedValueOnce({})                              // BEGIN
        .mockResolvedValueOnce({ rows: [{ id_pendaftar: 5 }] }); // cekEmail (dup)

      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send(validPayload);

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toContain('Email sudah terdaftar');
    });

    test('500 - catch error from db', async () => {
      db.connect.mockRejectedValueOnce(new Error('DB connection failed'));

      const res = await request(app)
        .post('/api/pendaftar/daftar')
        .send(validPayload);

      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getAllPendaftar =====================
  describe('GET /api/pendaftar', () => {
    test('200 - returns list', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pendaftar: 1, nama: 'Ahmad' }] });

      const res = await request(app).get('/api/pendaftar');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app).get('/api/pendaftar');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getPendaftarById =====================
  describe('GET /api/pendaftar/:id', () => {
    test('200 - found', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_pendaftar: 1, nama: 'Ahmad', status: 'pending' }]
      });

      const res = await request(app).get('/api/pendaftar/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.id_pendaftar).toBe(1);
    });

    test('404 - not found', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app).get('/api/pendaftar/9999');
      expect(res.statusCode).toBe(404);
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app).get('/api/pendaftar/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== terimaPendaftar =====================
  describe('PUT /api/pendaftar/terima/:id', () => {
    const buildTerimaMock = (overrides = {}) => {
      const defaults = {
        getPendaftar: {
          rowCount: 1,
          rows: [{
            id_pendaftar: 1,
            nama: 'Ahmad Fauzi',
            email: 'ahmad@mail.com',
            no_wa: '081234567890',
            tanggal_lahir: '2005-01-15',
            tempat_lahir: 'Bogor',
            alamat: 'Jl. Bogor',
            status: 'pending'
          }]
        },
        cekEmail: { rowCount: 0, rows: [] },
        maxSantri: { rows: [{ max: 10 }] }
      };
      return { ...defaults, ...overrides };
    };

    test('200 - terima berhasil (sumber=pendaftar)', async () => {
      const mocks = buildTerimaMock();
      mockClient.query
        .mockResolvedValueOnce({})                              // BEGIN
        .mockResolvedValueOnce(mocks.getPendaftar)             // cek pendaftar
        .mockResolvedValueOnce(mocks.cekEmail)                 // cek email
        .mockResolvedValueOnce(mocks.maxSantri)                // max santri
        .mockResolvedValueOnce({ rows: [{ id_users: 10 }] })   // insert users
        .mockResolvedValueOnce({})                             // insert santri
        .mockResolvedValueOnce({})                             // update pendaftar
        .mockResolvedValueOnce({});                            // COMMIT

      const res = await request(app)
        .put('/api/pendaftar/terima/1')
        .send({ sumber: 'pendaftar' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.nis).toBeDefined();
    });

    test('200 - terima berhasil (sumber=admin dengan password)', async () => {
      const mocks = buildTerimaMock();
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mocks.getPendaftar)
        .mockResolvedValueOnce(mocks.cekEmail)
        .mockResolvedValueOnce(mocks.maxSantri)
        .mockResolvedValueOnce({ rows: [{ id_users: 11 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const res = await request(app)
        .put('/api/pendaftar/terima/1')
        .send({ sumber: 'admin', password: 'mypassword123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.sumber).toBe('admin');
    });

    test('500 - pendaftar tidak ditemukan', async () => {
      mockClient.query
        .mockResolvedValueOnce({})                             // BEGIN
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });    // cek pendaftar -> throws

      const res = await request(app)
        .put('/api/pendaftar/terima/9999')
        .send({});

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Pendaftar tidak ditemukan');
    });

    test('500 - pendaftar sudah diterima', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{ ...buildTerimaMock().getPendaftar.rows[0], status: 'diterima' }]
        });

      const res = await request(app)
        .put('/api/pendaftar/terima/1')
        .send({});

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('sudah diterima');
    });

    test('500 - email sudah ada di users', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(buildTerimaMock().getPendaftar)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 5 }] }); // email conflict

      const res = await request(app)
        .put('/api/pendaftar/terima/1')
        .send({});

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Email sudah terdaftar sebagai user');
    });

    test('500 - sumber=admin tanpa password', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(buildTerimaMock().getPendaftar)
        .mockResolvedValueOnce(buildTerimaMock().cekEmail)
        .mockResolvedValueOnce(buildTerimaMock().maxSantri);

      const res = await request(app)
        .put('/api/pendaftar/terima/1')
        .send({ sumber: 'admin' }); // no password

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toContain('Password wajib diisi admin');
    });
  });

  // ===================== tolakPendaftar =====================
  describe('PUT /api/pendaftar/tolak/:id', () => {
    test('200 - tolak berhasil', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app).put('/api/pendaftar/tolak/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Pendaftar ditolak');
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).put('/api/pendaftar/tolak/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== deletePendaftar =====================
  describe('DELETE /api/pendaftar/:id', () => {
    test('200 - hapus berhasil', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app).delete('/api/pendaftar/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Pendaftar dihapus');
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app).delete('/api/pendaftar/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== resetAllPendaftar =====================
  describe('DELETE /api/pendaftar/reset/all', () => {
    test('200 - reset berhasil', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app).delete('/api/pendaftar/reset/all');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Semua pendaftar dihapus');
    });

    test('500 - db error', async () => {
      db.query.mockRejectedValueOnce(new Error('db error'));

      const res = await request(app).delete('/api/pendaftar/reset/all');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== exportExcelPendaftar =====================
  describe('GET /api/pendaftar/export/excel', () => {
    test('200 - returns message', async () => {
      const res = await request(app).get('/api/pendaftar/export/excel');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Export Excel');
    });
  });

});
