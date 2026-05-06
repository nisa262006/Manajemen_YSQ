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
    req.user = { id_users: 1, role: 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
}));

let adminToken = 'mock-admin-token';

describe('KELAS API YSQ', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/kelas - Tambah Kelas Baru', () => {

    test('✅ Berhasil membuat kelas baru (admin + data lengkap)', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_kelas: 1, nama_kelas: 'Kelas Tahfidz A', kategori: 'Dewasa' }]
      });

      const res = await request(app)
        .post('/api/kelas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_kelas: 'Kelas Tahfidz A',
          kategori: 'Dewasa',
          kapasitas: 20
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.kelas).toBeDefined();
    });

    test('❌ Gagal tambah kelas - nama_kelas kosong', async () => {
      const res = await request(app)
        .post('/api/kelas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama_kelas: '',
          kategori: 'Dewasa'
        });

      expect(res.statusCode).toBe(400);
    });

  });

  describe('GET /api/kelas - Daftar Semua Kelas', () => {

    test('✅ Berhasil ambil daftar kelas (admin)', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id_kelas: 1, nama_kelas: 'Kelas A' }]
      });

      const res = await request(app)
        .get('/api/kelas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('❌ DB Error saat ambil daftar kelas (500)', async () => {
      db.query.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/api/kelas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/kelas/detail/:id - Detail Kelas', () => {

    test('✅ Berhasil ambil detail kelas berdasarkan ID', async () => {
      db.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id_kelas: 1, nama_kelas: 'Kelas A' }]
      }); // query kelas
      db.query.mockResolvedValueOnce({
        rows: [{ id_santri: 1, nama: 'Santri 1' }]
      }); // query santri

      const res = await request(app)
        .get('/api/kelas/detail/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.kelas).toBeDefined();
    });

    test('❌ Gagal ambil detail kelas - ID tidak ada', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .get('/api/kelas/detail/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });

  });

  describe('PUT /api/kelas/edit/:id - Update Data Kelas', () => {

    test('✅ Berhasil update kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_kelas: 1 }] });

      const res = await request(app)
        .put('/api/kelas/edit/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama_kelas: 'Updated Name' });

      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal update kelas - ID tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .put('/api/kelas/edit/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama_kelas: 'Test' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/kelas/hapus/:id - Hapus Kelas', () => {

    test('✅ Berhasil menghapus kelas', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_kelas: 1 }] });

      const res = await request(app)
        .delete('/api/kelas/hapus/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal hapus kelas - ID tidak ada', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const res = await request(app)
        .delete('/api/kelas/hapus/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });

  });

});