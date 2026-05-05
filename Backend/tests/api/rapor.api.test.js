const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

// ✅ MOCK DATABASE
jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

// ✅ MOCK AUTH MIDDLEWARE
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    const role = req.headers['x-role'] || 'pengajar';
    const id_users = Number(req.headers['x-id-users'] || '1');
    req.user = { id_users, role };
    next();
  },
  onlyAdmin:   (req, res, next) => next(),
  onlySantri:  (req, res, next) => next(),
  onlyPengajar:(req, res, next) => next(),
}));

describe('RAPOR API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/rapor/tahsin', () => {
    test('✅ Sukses catat rapor tahsin', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // helper
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // cek existing
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert
      const res = await request(app).post('/api/rapor/tahsin').send({
        id_santri: 1, id_jadwal: 1, periode: '2024-05', nilai_akhir: 85
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/rapor/tahfidz', () => {
    test('✅ Sukses buat header tahfidz', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ kategori: 'tahfidz' }] });
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // cek rapor
      db.query.mockResolvedValueOnce({ rows: [{ id_rapor: 10 }] }); // insert
      const res = await request(app).post('/api/rapor/tahfidz').send({
        id_santri: 1, id_jadwal: 1, periode: '2024-05'
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/santri/me', () => {
    test('✅ Sukses ambil rapor saya', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ periode: '2024-05' }] });
      db.query.mockResolvedValueOnce({ rows: [] }); // tahsin
      db.query.mockResolvedValueOnce({ rows: [] }); // tahfidz
      db.query.mockResolvedValueOnce({ rows: [] }); // simakan
      const res = await request(app).get('/api/rapor/santri/me').set('x-role', 'santri');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/pengajar/me', () => {
    test('✅ Sukses ambil rapor buatan pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [] }); // tahsin
      db.query.mockResolvedValueOnce({ rows: [] }); // tahfidz
      const res = await request(app).get('/api/rapor/pengajar/me');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/rapor/tahfidz/:id', () => {
    test('✅ Sukses hapus rapor tahfidz', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // delete simakan
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // delete rapor
      const res = await request(app).delete('/api/rapor/tahfidz/1');
      expect(res.statusCode).toBe(200);
    });
  });
});
