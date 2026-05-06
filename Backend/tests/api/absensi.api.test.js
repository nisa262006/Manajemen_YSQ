const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

// MOCK DB
jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

// MOCK AUTH
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    const role = req.headers['x-role'] || 'pengajar';
    const id_users = Number(req.headers['x-id-users'] || '1');
    req.user = { id_users, role };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
}));

// HELPER BIAR MOCK RAPI
const mockQuery = (...responses) => {
  db.query.mockReset();
  responses.forEach(r => db.query.mockResolvedValueOnce(r));
};

describe('ABSENSI API TEST (FIXED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===============================
  // EXPORT
  // ===============================
  describe('GET /api/absensi/export', () => {
    test('✅ Sukses export', async () => {
      mockQuery(
        { rows: [{ id_pengajar: 1 }] },
        { rows: [{ nama_santri: 'A', status: 'Hadir' }] }
      );

      const res = await request(app)
        .get('/api/absensi/export?id_kelas=1')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Bukan pengajar', async () => {
      mockQuery({ rows: [] });

      const res = await request(app)
        .get('/api/absensi/export')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(403);
    });
  });

  // ===============================
  // CATAT SANTRI
  // ===============================
  describe('POST /api/absensi/santri', () => {
    test('✅ Sukses catat', async () => {
      mockQuery(
        { rows: [{ id_pengajar: 1 }] }, // helper
        { rowCount: 1, rows: [{ status: 'aktif' }] }, // cekSantri
        { rowCount: 1 }, // terdaftar
        { rowCount: 0 }, // duplikat
        { rowCount: 1 } // insert
      );

      const res = await request(app)
        .post('/api/absensi/santri')
        .set('x-role', 'pengajar')
        .send({ id_santri: 1, id_jadwal: 1, status_absensi: 'Hadir' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Santri nonaktif', async () => {
      mockQuery(
        { rows: [{ id_pengajar: 1 }] },
        { rowCount: 1, rows: [{ status: 'nonaktif' }] }
      );

      const res = await request(app)
        .post('/api/absensi/santri')
        .set('x-role', 'pengajar')
        .send({ id_santri: 1, id_jadwal: 1 });

      expect(res.statusCode).toBe(403);
    });
  });

  // ===============================
  // ADMIN LIHAT SEMUA
  // ===============================
  describe('GET /api/absensi/santri/all', () => {
    test('✅ Success', async () => {
      mockQuery({ rows: [{ id_absensi: 1 }] });

      const res = await request(app)
        .get('/api/absensi/santri/all')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ===============================
  // UPDATE
  // ===============================
  describe('PUT /api/absensi/santri/:id', () => {
    test('✅ Update berhasil', async () => {
      mockQuery(
        { rows: [{ id_pengajar: 1 }] },
        { rowCount: 1 },
        { rowCount: 1 }
      );

      const res = await request(app)
        .put('/api/absensi/santri/1')
        .set('x-role', 'pengajar')
        .send({ status_absensi: 'Izin' });

      expect(res.statusCode).toBe(200);
    });
  });

  // ===============================
  // SANTRI ME
  // ===============================
  describe('GET /api/absensi/santri/me', () => {
    test('✅ Ada data', async () => {
      mockQuery({
        rows: [{ id_absensi: 1, status_absensi: 'Hadir' }]
      });

      const res = await request(app)
        .get('/api/absensi/santri/me')
        .set('x-role', 'santri');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Tidak ada data', async () => {
      mockQuery({ rows: [] });

      const res = await request(app)
        .get('/api/absensi/santri/me')
        .set('x-role', 'santri');

      // controller kamu tetap return 200
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ===============================
  // ABSENSI PENGAJAR
  // ===============================
  describe('POST /api/absensi/pengajar', () => {
    test('✅ Sukses', async () => {
      mockQuery(
        { rows: [{ id_pengajar: 1 }] },
        { rowCount: 1 },
        { rowCount: 0 },
        { rows: [{ id_absensi_pengajar: 1 }] }
      );

      const res = await request(app)
        .post('/api/absensi/pengajar')
        .set('x-role', 'pengajar')
        .send({ id_jadwal: 1, status_absensi: 'Hadir' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ===============================
  // REKAP
  // ===============================
  describe('GET /api/absensi/pengajar/rekap', () => {
    test('✅ Sukses', async () => {
      mockQuery({
        rows: [{ total_hadir: 5, total_izin: 1, total_alfa: 0 }]
      });

      const res = await request(app)
        .get('/api/absensi/pengajar/rekap')
        .set('x-role', 'pengajar');

      expect(res.statusCode).toBe(200);
    });
  });

  // ===============================
  // ERROR 500
  // ===============================
  describe('Error handler', () => {
    test('❌ DB Error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/absensi/santri/all')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(500);
    });
  });

});