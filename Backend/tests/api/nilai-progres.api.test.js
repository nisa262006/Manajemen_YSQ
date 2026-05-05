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
  onlySantri: (req, res, next) => next(),
  onlyAdmin: (req, res, next) => next(),
}));

describe('NILAI & PROGRES API TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/nilai-progres/progres', () => {
    test('✅ Sukses input progres', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // helper getIdPengajar
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // check kelas
      db.query.mockResolvedValueOnce({ rows: [{ id_progres: 1, nilai: 90 }] }); // insert

      const res = await request(app)
        .post('/api/nilai-progres/progres')
        .set('x-role', 'pengajar')
        .send({ id_santri: 1, id_kelas: 1, minggu_ke: 1, catatan: 'Baik', nilai: 90 });

      expect(res.statusCode).toBe(200);
      expect(res.body.nilai).toBe(90);
    });

    test('❌ Gagal - Bukan kelas pengajar (403)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // not found

      const res = await request(app)
        .post('/api/nilai-progres/progres')
        .send({ id_santri: 1, id_kelas: 2, minggu_ke: 1 });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/nilai-progres/progres/:id', () => {
    test('✅ Sukses update progres', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .put('/api/nilai-progres/progres/1')
        .send({ catatan: 'Update', nilai: 95 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('diperbarui');
    });
  });

  describe('DELETE /api/nilai-progres/progres/:id', () => {
    test('✅ Sukses hapus progres', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app).delete('/api/nilai-progres/progres/1');

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/nilai-progres/rekap/kelas/:id_kelas', () => {
    test('✅ Sukses rekap kelas', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ nama: 'Santri A', rata_nilai: 85 }]
      });

      const res = await request(app).get('/api/nilai-progres/rekap/kelas/1');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].nama).toBe('Santri A');
    });
  });

  describe('GET /api/nilai-progres/saya', () => {
    test('✅ Sukses ambil progres santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }] }); // helper
      db.query.mockResolvedValueOnce({
        rows: [{ id_progres: 1, nama_kelas: 'Kelas A' }]
      });

      const res = await request(app)
        .get('/api/nilai-progres/saya')
        .set('x-role', 'santri');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].nama_kelas).toBe('Kelas A');
    });
  });

  describe('GET /api/nilai-progres/laporan', () => {
    test('✅ Sukses ambil laporan admin', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ nama_santri: 'Santri B', rata_nilai: 90 }]
      });

      const res = await request(app)
        .get('/api/nilai-progres/laporan')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].nama_santri).toBe('Santri B');
    });

    test('❌ Gagal - DB Error (500)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/nilai-progres/laporan')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(500);
    });
  });

});
