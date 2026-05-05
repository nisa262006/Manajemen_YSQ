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
    const role = req.headers['x-role'] || 'admin';
    const id_users = Number(req.headers['x-id-users'] || '1');
    req.user = { id_users, role };
    next();
  },
  onlyAdmin:   (req, res, next) => next(),
  onlySantri:  (req, res, next) => next(),
  onlyPengajar:(req, res, next) => next(),
}));

describe('JADWAL API TEST (MOCKED)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/jadwal', () => {
    test('✅ Sukses tambah jadwal', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] });

      const res = await request(app)
        .post('/api/jadwal')
        .send({ id_kelas: 1, hari: 'Senin', jam_mulai: '08:00', jam_selesai: '10:00' });

      expect(res.statusCode).toBe(201);
    });

    test('❌ Gagal - input tidak lengkap', async () => {
      const res = await request(app)
        .post('/api/jadwal')
        .send({ hari: 'Senin' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/jadwal', () => {
    test('✅ Sukses ambil semua jadwal', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] });
      const res = await request(app).get('/api/jadwal');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/jadwal/:id', () => {
    test('✅ Sukses ambil detail jadwal', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_jadwal: 1 }] });
      const res = await request(app).get('/api/jadwal/1');
      expect(res.statusCode).toBe(200);
    });

    test('❌ Gagal - tidak ditemukan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      const res = await request(app).get('/api/jadwal/999');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/jadwal/:id', () => {
    test('✅ Sukses update jadwal', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).put('/api/jadwal/1').send({ hari: 'Selasa' });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/jadwal/:id', () => {
    test('✅ Sukses hapus jadwal', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).delete('/api/jadwal/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/jadwal/pengajar/me', () => {
    test('✅ Sukses ambil jadwal pengajar', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }); // pg check
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] }); // jadwal check
      const res = await request(app)
        .get('/api/jadwal/pengajar/me')
        .set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/jadwal/santri/me', () => {
    test('✅ Sukses ambil jadwal santri', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] });
      const res = await request(app)
        .get('/api/jadwal/santri/me')
        .set('x-role', 'santri');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/jadwal/pengajar-sesi/:id_pengajar', () => {
    test('✅ Sukses ambil jadwal by pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] });
      const res = await request(app).get('/api/jadwal/pengajar-sesi/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/jadwal/:id/santri', () => {
    test('✅ Sukses tambah santri ke jadwal', async () => {
      db.query.mockResolvedValue({}); // delete
      db.query.mockResolvedValue({}); // insert
      const res = await request(app).post('/api/jadwal/1/santri').send({ id_santri: 10 });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/jadwal/pengajar/me/hari/:hari', () => {
    test('✅ Sukses ambil jadwal pengajar by hari', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }); // pg
      db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 1 }] }); // jadwal
      const res = await request(app)
        .get('/api/jadwal/pengajar/me/hari/Senin')
        .set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/jadwal/:id/santri', () => {
    test('✅ Sukses ambil santri by jadwal', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 10 }] });
      const res = await request(app)
        .get('/api/jadwal/1/santri')
        .set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  test('Error Handler 500', async () => {
    db.query.mockImplementationOnce(() => { throw new Error('Fail'); });
    const res = await request(app).get('/api/jadwal').set('x-role', 'admin');
    expect(res.statusCode).toBe(500);
  });
});
