const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: req.headers['x-role'] || 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
}));

describe('KELAS API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/kelas', () => {
    test('✅ Sukses tambah kelas', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_kelas: 1, nama_kelas: 'Kelas A' }] });

      const res = await request(app)
        .post('/api/kelas')
        .send({ nama_kelas: 'Kelas A', kategori: 'Tahfidz' });

      expect(res.statusCode).toBe(201);
      expect(res.body.kelas.nama_kelas).toBe('Kelas A');
    });

    test('❌ Gagal - nama_kelas kosong', async () => {
      const res = await request(app)
        .post('/api/kelas')
        .send({ nama_kelas: '', kategori: 'Tahfidz' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/kelas', () => {
    test('✅ Sukses ambil semua kelas', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_kelas: 1 }] });
      const res = await request(app).get('/api/kelas');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/kelas/:id', () => {
    test('✅ Sukses ambil detail kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_kelas: 1 }] }); // kelas
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }] }); // santri

      const res = await request(app).get('/api/kelas/detail/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.kelas).toBeDefined();
    });

    test('❌ Gagal - tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).get('/api/kelas/detail/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/kelas/edit/:id', () => {
    test('✅ Sukses update kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).put('/api/kelas/edit/1').send({ nama_kelas: 'Baru' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/kelas/hapus/:id', () => {
    test('✅ Sukses hapus kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).delete('/api/kelas/hapus/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/kelas/pengajar/me', () => {
    test('✅ Sukses ambil kelas pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_kelas: 1 }] });
      const res = await request(app)
        .get('/api/kelas/pengajar/me')
        .set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/kelas/santri/me', () => {
    test('✅ Sukses ambil kelas santri', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1 }] }); // santri
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] }); // jadwal
      const res = await request(app)
        .get('/api/kelas/santri/me')
        .set('x-role', 'santri');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/kelas/:id/santri', () => {
    test('✅ Sukses tambah santri ke kelas', async () => {
      db.query.mockResolvedValue({}); // delete
      db.query.mockResolvedValue({}); // insert
      const res = await request(app).post('/api/kelas/1/santri').send({ id_santri: 10 });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/kelas/pindah/:id_santri', () => {
    test('✅ Sukses pindah santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 10 }] }); // cek
      db.query.mockResolvedValue({}); // delete
      db.query.mockResolvedValue({}); // insert
      const res = await request(app).put('/api/kelas/pindah/10').send({ id_kelas_baru: 2 });
      expect(res.statusCode).toBe(200);
    });
  });

  test('Error Handler 500', async () => {
    db.query.mockRejectedValueOnce(new Error('Fail'));
    const res = await request(app).get('/api/kelas');
    expect(res.statusCode).toBe(500);
  });
});
