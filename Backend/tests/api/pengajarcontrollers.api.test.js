/**
 * API tests for pengajarcontrollers.js
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

describe('Pengajar Controllers API', () => {

  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = { query: jest.fn(), release: jest.fn() };
    db.connect.mockResolvedValue(mockClient);
  });

  // ===================== tambahPengajar =====================
  // Controller menggunakan db.query (bukan client), butuh password & confirmPassword
  describe('POST /api/pengajar/tambah', () => {
    const validPayload = {
      nama: 'Pengajar Test',
      email: 'pengajar@mail.com',
      password: 'password123',
      confirmPassword: 'password123',
      no_kontak: '081234567890'
    };

    test('200 - tambah pengajar berhasil', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })  // cek Email
        .mockResolvedValueOnce({ rows: [{ max: 0 }] })     // getMax id_pengajar
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })  // cek username unik
        .mockResolvedValueOnce({ rows: [{ id_users: 10 }] }) // insert users
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // insert pengajar

      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send(validPayload);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Pengajar berhasil ditambahkan');
    });

    test('400 - password tidak sama', async () => {
      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send({ ...validPayload, confirmPassword: 'beda' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Password tidak sama');
    });

    test('400 - Email sudah digunakan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ email: 'x@mail.com' }] });

      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send(validPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Email sudah digunakan');
    });

    test('400 - field wajib kosong', async () => {
      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send({ nama: 'X' }); // Missing email, password, confirmPassword

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('wajib diisi');
    });

    test('500 - catch error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB crash'));

      const res = await request(app)
        .post('/api/pengajar/tambah')
        .send(validPayload);

      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getAllPengajar =====================
  describe('GET /api/pengajar', () => {
    test('200 - return list', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id_pengajar: 1, nama: 'P1' }]
      });

      const res = await request(app).get('/api/pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('500 - catch error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).get('/api/pengajar');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getPengajarById =====================
  describe('GET /api/pengajar/:id', () => {
    test('200 - return detail', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_pengajar: 1, nama: 'P1' }]
      });

      const res = await request(app).get('/api/pengajar/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id_pengajar).toBe(1);
    });

    test('404 - not found', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app).get('/api/pengajar/99');
      expect(res.statusCode).toBe(404);
    });

    test('500 - catch error', async () => {
      db.query.mockRejectedValueOnce(new Error('db fail'));

      const res = await request(app).get('/api/pengajar/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== updatePengajar =====================
  // Controller updatePengajar uses db.query (not client/transaction)
  describe('PUT /api/pengajar/:id', () => {
    const validUpdate = { nama: 'P1 Updated', email: 'p1@mail.com', no_kontak: '0812', status: 'aktif' };

    test('200 - update berhasil', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 10, user_email: 'old@mail.com', nama: 'P1' }] }) // check old data
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // cek email conflict
        .mockResolvedValueOnce({}) // update users email
        .mockResolvedValueOnce({}); // update pengajar

      const res = await request(app)
        .put('/api/pengajar/1')
        .send(validUpdate);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Pengajar berhasil diperbarui');
    });

    test('404 - tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }); // check old data

      const res = await request(app)
        .put('/api/pengajar/99')
        .send(validUpdate);

      expect(res.statusCode).toBe(404);
    });

    test('400 - email digunakan', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 10, user_email: 'old@mail.com' }] }) // old data
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 11 }] }); // cek email conflict

      const res = await request(app)
        .put('/api/pengajar/1')
        .send(validUpdate);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Email sudah digunakan');
    });

    test('500 - catch error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB crash'));

      const res = await request(app)
        .put('/api/pengajar/1')
        .send(validUpdate);

      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== deletePengajar =====================
  // deletePengajar uses db.connect() with client/transaction
  describe('DELETE /api/pengajar/:id', () => {
    test('200 - delete berhasil', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 10, email: 'p@m.com' }] }) // check pengajar
        .mockResolvedValueOnce({}) // update jadwal null
        .mockResolvedValueOnce({}) // delete pendaftar
        .mockResolvedValueOnce({}) // delete users
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app).delete('/api/pengajar/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Pengajar berhasil dihapus sepenuhnya');
    });

    test('404 - tidak ditemukan', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }); // check pengajar

      const res = await request(app).delete('/api/pengajar/99');
      expect(res.statusCode).toBe(404);
    });

    test('500 - catch error', async () => {
      db.connect.mockRejectedValueOnce(new Error('DB crash'));

      const res = await request(app).delete('/api/pengajar/1');
      expect(res.statusCode).toBe(500);
    });
  });
});
