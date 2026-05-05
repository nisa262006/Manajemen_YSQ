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

describe('RAPOR API TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/rapor/tahsin', () => {
    test('✅ Berhasil simpan rapor tahsin', async () => {
      // 1. mock getIdPengajar
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      // 2. mock cek existing
      db.query.mockResolvedValueOnce({ rowCount: 0 });
      // 3. mock insert
      db.query.mockResolvedValueOnce({ rowCount: 1 });

      const res = await request(app)
        .post('/api/rapor/tahsin')
        .send({
          id_santri: 1, id_jadwal: 1, periode: '2024-05',
          nilai_pekanan: 80, ujian_tilawah: 85, nilai_teori: 80,
          nilai_presensi: 100, nilai_akhir: 85, catatan: 'Bagus'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Gagal - Parameter tidak lengkap', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
        const res = await request(app).post('/api/rapor/tahsin').send({});
        expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/rapor/tahfidz', () => {
    test('✅ Berhasil buat header rapor tahfidz', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ kategori: 'Tahfidz' }] });
      db.query.mockResolvedValueOnce({ rowCount: 0 }); // cekRapor
      db.query.mockResolvedValueOnce({ rows: [{ id_rapor: 10 }] }); // insert

      const res = await request(app)
        .post('/api/rapor/tahfidz')
        .send({ id_santri: 1, id_jadwal: 1, periode: '2024-05' });

      expect(res.statusCode).toBe(200);
      expect(res.body.id_rapor).toBe(10);
    });

    test('❌ Gagal - Bukan kelas tahfidz', async () => {
        db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
        db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ kategori: 'Tahsin' }] });
        const res = await request(app).post('/api/rapor/tahfidz').send({ id_santri: 1, id_jadwal: 1, periode: '2024-05' });
        expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/rapor/tahfidz/simakan', () => {
    test('✅ Berhasil input simakan', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).post('/api/rapor/tahfidz/simakan').send({ id_rapor: 1, juz: 1, nilai: 90 });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/rapor/tahfidz/final', () => {
    test('✅ Berhasil finalisasi tahfidz', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ rata: 90 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).post('/api/rapor/tahfidz/final').send({ id_rapor: 1, nilai_ujian_akhir: 80 });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/rapor/pengajar/me', () => {
    test('✅ Berhasil ambil rapor pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [] }); // tahsin
      db.query.mockResolvedValueOnce({ rows: [] }); // tahfidz
      const res = await request(app).get('/api/rapor/pengajar/me');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/santri/me', () => {
    test('✅ Berhasil ambil rapor santri', async () => {
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1 }] }); // identitas
      db.query.mockResolvedValueOnce({ rows: [{ periode: '2024-05' }] }); // listPeriode
      db.query.mockResolvedValueOnce({ rows: [{ id_rapor: 1 }] }); // tahsin
      db.query.mockResolvedValueOnce({ rows: [{ id_rapor: 2 }] }); // tahfidz
      db.query.mockResolvedValueOnce({ rows: [] }); // simakan
      const res = await request(app).get('/api/rapor/santri/me');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/laporan/rekap-pengajar', () => {
    test('✅ Berhasil ambil rekap laporan', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1, nama_kelas: 'Tahfidz A' }] });
      const res = await request(app).get('/api/rapor/laporan/rekap-pengajar');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/jadwal/:id/santri', () => {
    test('✅ Berhasil ambil santri by jadwal', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // cekJadwal
      db.query.mockResolvedValueOnce({ rows: [{ id_santri: 1, nama: 'Santri' }] });
      const res = await request(app).get('/api/rapor/jadwal/1/santri');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/rapor/tahsin/:id', () => {
    test('✅ Berhasil update rapor tahsin', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      const res = await request(app).put('/api/rapor/tahsin/1').send({ nilai_akhir: 90 });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/laporan/periode', () => {
    test('✅ Berhasil ambil periode pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ periode: '2024-05' }] });
      const res = await request(app).get('/api/rapor/laporan/periode');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/rapor/tahfidz/:id', () => {
    test('✅ Berhasil hapus rapor tahfidz', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // delete simakan
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // delete rapor
      const res = await request(app).delete('/api/rapor/tahfidz/1');
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/rapor/detail', () => {
    test('✅ Berhasil ambil detail rapor (pengajar)', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });
      db.query.mockResolvedValueOnce({ rows: [{ id_rapor: 1 }] }); // tahsin
      db.query.mockResolvedValueOnce({ rows: [{ id_rapor: 2 }] }); // tahfidz
      db.query.mockResolvedValueOnce({ rows: [] }); // simakan
      const res = await request(app).get('/api/rapor/detail?id_santri=1&periode=2024-05');
      expect(res.statusCode).toBe(200);
    });
  });

});
