const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: 'pengajar' };
    next();
  },
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
  onlyAdmin: (req, res, next) => next(),
}));

let mockFile = null;
jest.mock('../../src/middleware/upload', () => ({
  single: () => (req, res, next) => {
    if (mockFile) req.file = mockFile;
    next();
  }
}));

describe('TUGAS MATERI API TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockFile = null;
  });

  describe('POST /api/tugas-media/materi', () => {
    test('✅ Berhasil upload materi', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // role id
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert
      
      mockFile = { filename: 'test-materi.pdf' };
      const res = await request(app)
        .post('/api/tugas-media/materi')
        .send({ id_jadwal: 1, judul: 'Test', tipe_konten: 'file' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Gagal upload materi - id_jadwal kosong', async () => {
        const res = await request(app).post('/api/tugas-media/materi').send({ judul: 'Test' });
        expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/tugas-media/tugas', () => {
    test('✅ Berhasil buat tugas', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_tugas: 1 }] });

      const res = await request(app)
        .post('/api/tugas-media/tugas')
        .send({ id_jadwal: 1, id_materi: 1, deskripsi: 'Kerjakan', deadline: '2024-12-31' });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('GET /api/tugas-media/materi/jadwal/:id/pengajar', () => {
    test('✅ Berhasil ambil materi by jadwal (pengajar)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_materi: 1, judul: 'Materi 1' }] });
      const res = await request(app).get('/api/tugas-media/materi/jadwal/1/pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/tugas-media/materi/:id', () => {
    test('✅ Berhasil update materi', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }); // role
      db.query.mockResolvedValueOnce({ rows: [{ file_path: 'old.pdf' }] }); // old
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // update

      const res = await request(app).put('/api/tugas-media/materi/1').send({ judul: 'Updated' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/tugas-media/tugas/submit', () => {
    test('✅ Berhasil santri submit tugas', async () => {
      // Switch user context in mock is tricky, but I can just return santri id
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }] }); // role id
      db.query.mockResolvedValueOnce({ rows: [{ deadline: '2099-01-01' }] }); // deadline check
      db.query.mockResolvedValueOnce({ rows: [] }); // check already submitted
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // insert

      const res = await request(app).post('/api/tugas-media/tugas/submit').send({ id_tugas: 1 });
      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal submit - Tugas tidak ditemukan', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }] });
        db.query.mockResolvedValueOnce({ rows: [] }); // deadline check failed
        const res = await request(app).post('/api/tugas-media/tugas/submit').send({ id_tugas: 999 });
        expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/tugas-media/tugas/materi/:id', () => {
    test('✅ Berhasil ambil tugas by materi', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_tugas: 1 }] });
      const res = await request(app).get('/api/tugas-media/tugas/materi/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/tugas-media/tugas/kelas/:id/pengajar', () => {
    test('✅ Berhasil ambil tugas by kelas (pengajar)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ id_tugas: 1 }] });
      const res = await request(app).get('/api/tugas-media/tugas/kelas/1/pengajar');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/tugas-media/tugas/:id', () => {
    test('✅ Berhasil update tugas', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ file_path: 'old.pdf' }] });
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_tugas: 1 }] });

      const res = await request(app).put('/api/tugas-media/tugas/1').send({ deskripsi: 'Updated', deadline: '2024-12-31' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/tugas-media/tugas/kelas/:id', () => {
    test('✅ Berhasil ambil tugas by kelas (santri)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_tugas: 1 }] });
      const res = await request(app).get('/api/tugas-media/tugas/kelas/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/tugas-media/tugas/:id_tugas/submission/me', () => {
    test('✅ Berhasil ambil submission saya', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ file_path: 'test.pdf' }] });
      const res = await request(app).get('/api/tugas-media/tugas/1/submission/me');
      expect(res.statusCode).toBe(200);
      expect(res.body.submitted).toBe(true);
    });
  });

  describe('POST /api/tugas-media/materi - Error cases', () => {
    test('❌ Gagal upload - tipe_konten file tapi req.file kosong', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
        const res = await request(app).post('/api/tugas-media/materi').send({ id_jadwal: 1, tipe_konten: 'file' });
        expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/tugas-media/tugas/:id/status', () => {
    test('✅ Berhasil ambil status pengumpulan (pengajar)', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_jadwal: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1, status: 'Sudah Kirim' }] });
      const res = await request(app).get('/api/tugas-media/tugas/1/status');
      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal ambil status - Tugas tidak ditemukan', async () => {
        db.query.mockResolvedValueOnce({ rowCount: 0 });
        const res = await request(app).get('/api/tugas-media/tugas/999/status');
        expect(res.statusCode).toBe(404);
    });

    test('❌ Server Error - getStatusPengumpulan', async () => {
        db.query.mockRejectedValueOnce(new Error('DB Error'));
        const res = await request(app).get('/api/tugas-media/tugas/1/status');
        expect(res.statusCode).toBe(500);
    });
  });

  describe('Catch blocks coverage', () => {
    test('❌ uploadMateri catch block', async () => {
        db.query.mockRejectedValueOnce(new Error('DB Error'));
        const res = await request(app).post('/api/tugas-media/materi').send({ id_jadwal: 1 });
        expect(res.statusCode).toBe(500);
    });

    test('❌ createTugas catch block', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
        db.query.mockRejectedValueOnce(new Error('DB Error'));
        const res = await request(app).post('/api/tugas-media/tugas').send({ id_jadwal: 1 });
        expect(res.statusCode).toBe(500);
    });
  });

});
