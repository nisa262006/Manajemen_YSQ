const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: req.headers['x-role'] || 'pengajar' };
    next();
  },
  onlyPengajar: (req, res, next) => next(),
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
}));

describe('ABSENSI API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/absensi/export', () => {
    test('✅ Sukses export absensi', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // helper
      db.query.mockResolvedValueOnce({ rows: [{ nama_santri: 'A', status: 'Hadir' }] }); // main query

      const res = await request(app)
        .get('/api/absensi/export?id_kelas=1')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Gagal export - bukan pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // helper return null

      const res = await request(app)
        .get('/api/absensi/export')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/absensi/santri', () => {
    test('✅ Sukses catat absensi santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // helper
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'aktif' }] }); // cekSantri
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // cekTerdaftar
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // duplikat
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert

      const res = await request(app)
        .post('/api/absensi/santri')
        .set('x-role', 'pengajar')
        .send({ id_santri: 1, id_jadwal: 1, status_absensi: 'Hadir' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Gagal catat - santri nonaktif', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'nonaktif' }] });

      const res = await request(app)
        .post('/api/absensi/santri')
        .send({ id_santri: 1, id_jadwal: 1 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/absensi/santri/all', () => {
    test('✅ Admin lihat semua absensi', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_absensi: 1 }] });

      const res = await request(app)
        .get('/api/absensi/santri/all')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PUT /api/absensi/santri/:id', () => {
    test('✅ Sukses update absensi santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // helper
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // cek akses
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update

      const res = await request(app)
        .put('/api/absensi/santri/1')
        .set('x-role', 'pengajar')
        .send({ status_absensi: 'Izin' });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/absensi/santri/me', () => {
    test('✅ Santri lihat absensi sendiri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_absensi: 1, status_absensi: 'Hadir' }] });

      const res = await request(app)
        .get('/api/absensi/santri/me')
        .set('x-role', 'santri');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/absensi/pengajar', () => {
    test('✅ Sukses catat absensi pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // helper
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // cekJadwal
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // duplikat
      db.query.mockResolvedValueOnce({ rows: [{ id_absensi_pengajar: 1 }] }); // insert

      const res = await request(app)
        .post('/api/absensi/pengajar')
        .set('x-role', 'pengajar')
        .send({ id_jadwal: 1, status_absensi: 'Hadir' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/absensi/pengajar/rekap', () => {
    test('✅ Sukses ambil rekap', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ total_hadir: 5, total_izin: 1, total_alfa: 0 }] });

      const res = await request(app)
        .get('/api/absensi/pengajar/rekap')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(200);
    });
  });

  describe('500 Error Handler', () => {
    test('Should return 500 on DB error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));
      const res = await request(app)
        .get('/api/absensi/santri/all')
        .set('x-role', 'admin');
      expect(res.statusCode).toBe(500);
    });
  });
});
