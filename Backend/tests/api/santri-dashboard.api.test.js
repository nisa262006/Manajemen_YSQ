const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'santri' };
    next();
  },
  onlySantri: (req, res, next) => next(),
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
}));

describe('SANTRI DASHBOARD API TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/santri-dashboard/me', () => {
    test('✅ Sukses - Santri ditemukan + ada kelas', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_santri: 1, nama: 'Santri Test', id_kelas: 10 }]
      }); // santri query
      
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_jadwal: 1, hari: 'Senin', jam_mulai: '08:00', pengajar: 'Ustadz A' }]
      }); // jadwal query

      const res = await request(app).get('/api/santridashboard/me');

      expect(res.statusCode).toBe(200);
      expect(res.body.santri.nama).toBe('Santri Test');
      expect(res.body.jadwal.length).toBeGreaterThan(0);
    });

    test('✅ Sukses - Santri ditemukan + tidak ada kelas', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_santri: 1, nama: 'Santri Test', id_kelas: null }]
      });

      const res = await request(app).get('/api/santridashboard/me');

      expect(res.statusCode).toBe(200);
      expect(res.body.jadwal).toEqual([]);
    });

    test('❌ Gagal - Santri tidak ditemukan (404)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app).get('/api/santridashboard/me');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });

    test('❌ Gagal - DB Error (500)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app).get('/api/santridashboard/me');

      expect(res.statusCode).toBe(500);
    });
  });

});
