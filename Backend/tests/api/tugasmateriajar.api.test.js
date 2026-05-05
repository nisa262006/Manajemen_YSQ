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
  onlyAdmin:   (req, res, next) => req.user.role === 'admin'    ? next() : res.status(403).json({ message: 'Admin only' }),
  onlySantri:  (req, res, next) => req.user.role === 'santri'   ? next() : res.status(403).json({ message: 'Santri only' }),
  onlyPengajar:(req, res, next) => req.user.role === 'pengajar' ? next() : res.status(403).json({ message: 'Pengajar only' }),
}));

// ✅ MOCK UPLOAD MIDDLEWARE (karena upload file via multer sulit di unit test tanpa mock fs)
jest.mock('../../src/middleware/upload', () => ({
  single: () => (req, res, next) => {
    // Simulasi jika ada file yang diunggah
    if (req.headers['x-mock-file']) {
      req.file = { filename: 'test_file.pdf', path: '/uploads/test_file.pdf' };
    }
    next();
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TUGAS & MATERI AJAR API YSQ (Mocked)', () => {

  // ============================================================
  // POST /api/tugas-media/materi - Pengajar Upload Materi
  // ============================================================
  describe('POST /api/tugas-media/materi', () => {
    test('✅ Pengajar berhasil upload materi', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rowCount: 1, rows: [{}] }) // validasi jadwal
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_materi: 1 }] }); // insert materi

      const res = await request(app)
        .post('/api/tugas-media/materi')
        .set('x-role', 'pengajar')
        .set('x-id-users', '1')
        .set('x-mock-file', 'true') // trigger mock req.file
        .send({
          id_kelas: 2,
          id_jadwal: 5,
          judul: 'Materi Tajwid',
          deskripsi: 'Pengenalan Tajwid Dasar'
        });

      console.log('STATUS:', res.statusCode, 'BODY:', res.body, 'TEXT:', res.text);
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.success).toBe(true);
    });

    test('❌ Santri tidak bisa upload materi (403)', async () => {
      const res = await request(app)
        .post('/api/tugas-media/materi')
        .set('x-role', 'santri')
        .send({});

      expect(res.statusCode).toBe(403);
    });
  });

  // ============================================================
  // POST /api/tugas-media/tugas - Pengajar Create Tugas
  // ============================================================
  describe('POST /api/tugas-media/tugas', () => {
    test('✅ Pengajar berhasil buat tugas baru', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rowCount: 1, rows: [{}] }) // validasi jadwal
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_tugas: 1 }] }); // insert tugas

      const res = await request(app)
        .post('/api/tugas-media/tugas')
        .set('x-role', 'pengajar')
        .set('x-id-users', '1')
        .send({
          id_kelas: 2,
          id_jadwal: 5,
          id_materi: 1,
          judul: 'Tugas Hafalan',
          deskripsi: 'Hafalan An-Naba',
          deadline: '2025-12-31T23:59:59Z',
          tipe_tugas: 'teks'
        });

      expect([200, 201]).toContain(res.statusCode);
    });
  });

  // ============================================================
  // GET /api/tugas-media/tugas/kelas/:id - Santri Melihat Tugas
  // ============================================================
  describe('GET /api/tugas-media/tugas/kelas/:id', () => {
    test('✅ Santri berhasil melihat daftar tugas di kelasnya', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 10 }] }) // get santri id
        .mockResolvedValueOnce({ rowCount: 1, rows: [{}] }) // cek santri terdaftar
        .mockResolvedValueOnce({ rows: [{ id_tugas: 1, judul: 'Tugas 1' }] }); // fetch tugas

      const res = await request(app)
        .get('/api/tugas-media/tugas/kelas/2')
        .set('x-role', 'santri')
        .set('x-id-users', '5');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ============================================================
  // POST /api/tugas-media/tugas/submit - Santri Mengumpulkan Tugas
  // ============================================================
  describe('POST /api/tugas-media/tugas/submit', () => {
    test('✅ Santri berhasil mengumpulkan jawaban tugas', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 10 }] }) // get id santri
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ deadline: '2099-12-31T23:59:59.000Z' }] }) // cek tugas ada (deadline future)
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // cek belum submit (0 row = belum)
        .mockResolvedValueOnce({ rowCount: 1 }); // insert submission

      const res = await request(app)
        .post('/api/tugas-media/tugas/submit')
        .set('x-role', 'santri')
        .set('x-id-users', '5')
        .send({
          id_tugas: 1,
          jawaban_teks: 'Ini jawaban hafalan saya'
        });

      expect([200, 201, 409]).toContain(res.statusCode);
    });
  });

});
