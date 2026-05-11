/**
 * API tests for santridashboardcontrollers.js and nilaidanprogrescontrollers.js
 */

const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

// Mock auth middleware - role can be overridden per test
let mockUserRole = 'santri';
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 2, role: mockUserRole };
    next();
  },
  onlyAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    next();
  },
  onlySantri: (req, res, next) => {
    if (req.user.role !== 'santri') return res.status(403).json({ message: 'Santri only' });
    next();
  },
  onlyPengajar: (req, res, next) => {
    if (req.user.role !== 'pengajar') return res.status(403).json({ message: 'Pengajar only' });
    next();
  }
}));

const db = require('../../src/config/db');

// Helper to set role
function setRole(role) { mockUserRole = role; }

describe('Santri Dashboard Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setRole('santri');
  });

  describe('GET /api/santridashboard/me', () => {
    test('200 - santri dengan kelas', async () => {
      // query 1: santri result
      db.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [{
            id_santri: 1,
            nis: 'YSQ26DWS001',
            nama: 'Santri Test',
            kategori: 'dewasa',
            status: 'aktif',
            id_kelas: 1,
            nama_kelas: 'Tahsin A',
            level: 1
          }]
        })
        // query 2: jadwal result
        .mockResolvedValueOnce({
          rowCount: 2,
          rows: [
            { id_jadwal: 1, hari: 'Senin', jam_mulai: '08:00', jam_selesai: '10:00', pengajar: 'Riska' },
            { id_jadwal: 2, hari: 'Rabu', jam_mulai: '08:00', jam_selesai: '10:00', pengajar: 'Riska' }
          ]
        });

      const res = await request(app).get('/api/santridashboard/me');
      expect(res.statusCode).toBe(200);
      expect(res.body.santri).toBeDefined();
      expect(Array.isArray(res.body.jadwal)).toBe(true);
      expect(res.body.jadwal).toHaveLength(2);
    });

    test('200 - santri tanpa kelas (id_kelas null)', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{
          id_santri: 1,
          nis: 'YSQ26DWS001',
          nama: 'Santri Test',
          kategori: 'dewasa',
          status: 'aktif',
          id_kelas: null,
          nama_kelas: null
        }]
      });

      const res = await request(app).get('/api/santridashboard/me');
      expect(res.statusCode).toBe(200);
      expect(res.body.jadwal).toEqual([]);
    });

    test('404 - santri tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      const res = await request(app).get('/api/santridashboard/me');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('tidak ditemukan');
    });

    test('500 - catch error', async () => {
      db.query.mockRejectedValueOnce(new Error('DB crash'));

      const res = await request(app).get('/api/santridashboard/me');
      expect(res.statusCode).toBe(500);
    });
  });
});

// ==========================================================
// Nilai dan Progres Controller
// ==========================================================

describe('Nilai Dan Progres Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===================== POST /api/nilai-progres/progres =====================
  describe('POST /api/nilai-progres/progres (createProgres)', () => {
    beforeEach(() => setRole('pengajar'));

    test('200 - berhasil buat progres', async () => {
      db.query
        // getIdPengajar
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        // validasi kelas milik pengajar
        .mockResolvedValueOnce({ rowCount: 1, rows: [{}] })
        // insert/upsert
        .mockResolvedValueOnce({ rows: [{ id_progres: 1, nilai: 90 }] });

      const res = await request(app)
        .post('/api/nilai-progres/progres')
        .send({ id_santri: 1, id_kelas: 1, minggu_ke: 1, catatan: 'Bagus', nilai: 90 });

      expect(res.statusCode).toBe(200);
      expect(res.body.id_progres).toBe(1);
    });

    test('403 - kelas bukan milik pengajar', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })  // getIdPengajar
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });        // kelas check fails

      const res = await request(app)
        .post('/api/nilai-progres/progres')
        .send({ id_santri: 1, id_kelas: 99, minggu_ke: 1, catatan: 'X', nilai: 70 });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('Bukan kelas Anda');
    });
  });

  // ===================== PUT /api/nilai-progres/progres/:id =====================
  describe('PUT /api/nilai-progres/progres/:id (updateProgres)', () => {
    beforeEach(() => setRole('pengajar'));

    test('200 - update berhasil', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app)
        .put('/api/nilai-progres/progres/1')
        .send({ catatan: 'Updated', nilai: 85 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Progres diperbarui');
    });
  });

  // ===================== DELETE /api/nilai-progres/progres/:id =====================
  describe('DELETE /api/nilai-progres/progres/:id (deleteProgres)', () => {
    beforeEach(() => setRole('pengajar'));

    test('200 - delete berhasil', async () => {
      db.query.mockResolvedValueOnce({});

      const res = await request(app).delete('/api/nilai-progres/progres/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Progres dihapus');
    });
  });

  // ===================== GET /api/nilai-progres/rekap/kelas/:id =====================
  describe('GET /api/nilai-progres/rekap/kelas/:id (rekapKelas)', () => {
    beforeEach(() => setRole('pengajar'));

    test('200 - returns rekap', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ nama: 'Santri A', rata_nilai: '85.5', jumlah_penilaian: '4' }]
      });

      const res = await request(app).get('/api/nilai-progres/rekap/kelas/1');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ===================== GET /api/nilai-progres/saya =====================
  describe('GET /api/nilai-progres/saya (getProgresSantri)', () => {
    beforeEach(() => setRole('santri'));

    test('200 - returns progres santri', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_santri: 1 }] }) // getIdSantri
        .mockResolvedValueOnce({
          rows: [{ id_progres: 1, nilai: 88, nama_kelas: 'Tahsin A' }]
        });

      const res = await request(app).get('/api/nilai-progres/saya');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ===================== GET /api/nilai-progres/laporan =====================
  describe('GET /api/nilai-progres/laporan (getLaporanAdmin)', () => {
    beforeEach(() => setRole('admin'));

    test('200 - returns laporan', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ nama_santri: 'Santri A', nama_kelas: 'Tahsin A', rata_nilai: '85', total_penilaian: '3' }]
      });

      const res = await request(app).get('/api/nilai-progres/laporan');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
