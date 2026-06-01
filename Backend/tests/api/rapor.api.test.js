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

describe('RAPOR API COMPREHENSIVE TEST', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================= TAHSIN =================
  describe('Tahsin Rapor', () => {
    test('✅ Create Tahsin Rapor Success (Mumtaz)', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rowCount: 0 }) // cek existing
        .mockResolvedValueOnce({}); // insert

      const res = await request(app).post('/api/rapor/tahsin').set('x-role', 'pengajar').send({
        id_santri: 1, 
        id_jadwal: 1, 
        periode: '2025', 
        nilai_akhir: 95,
        nilai_pekanan: 90,
        ujian_tilawah: 95,
        nilai_teori: 100,
        nilai_presensi: 100
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Create Tahsin Rapor Fail - Already Exists', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rowCount: 1 }); // existing found

      const res = await request(app).post('/api/rapor/tahsin').set('x-role', 'pengajar').send({
        id_santri: 1, id_jadwal: 1, periode: '2025'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Rapor sudah ada');
    });

    test('❌ Create Tahsin Rapor Fail - Missing Periode', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] });

      const res = await request(app).post('/api/rapor/tahsin').set('x-role', 'pengajar').send({
        id_santri: 1, id_jadwal: 1
      });
      expect(res.statusCode).toBe(400);
    });

    test('✅ Update Tahsin Rapor', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({});

      const res = await request(app).put('/api/rapor/tahsin/1').set('x-role', 'pengajar').send({
        nilai_akhir: 85,
        catatan: 'Updated'
      });
      expect(res.statusCode).toBe(200);
    });

    test('✅ Delete Tahsin Rapor', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({});

      const res = await request(app).delete('/api/rapor/tahsin/1').set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
    });
  });

  // ================= TAHFIDZ =================
  describe('Tahfidz Rapor', () => {
    test('✅ Create Tahfidz Header Success', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ kategori: 'Tahfidz Anak' }] }) // cekKategori
        .mockResolvedValueOnce({ rowCount: 0 }) // cekRapor
        .mockResolvedValueOnce({ rows: [{ id_rapor: 5 }] }); // insert

      const res = await request(app).post('/api/rapor/tahfidz').set('x-role', 'pengajar').send({
        id_santri: 1, id_jadwal: 1, periode: '2025'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.id_rapor).toBe(5);
    });

    test('❌ Create Tahfidz Header Fail - Not Pengajar', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // getIdPengajar return null

      const res = await request(app).post('/api/rapor/tahfidz').set('x-role', 'pengajar').send({});
      expect(res.statusCode).toBe(403);
    });

    test('❌ Create Tahfidz Header Fail - Wrong Category', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ kategori: 'Tahsin' }] });

      const res = await request(app).post('/api/rapor/tahfidz').set('x-role', 'pengajar').send({
        id_santri: 1, id_jadwal: 1, periode: '2025'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('hanya untuk kelas kategori Tahfidz');
    });

    test('✅ Input Simakan (Insert/Update)', async () => {
      db.query.mockResolvedValueOnce({});
      const res = await request(app).post('/api/rapor/tahfidz/simakan').set('x-role', 'pengajar').send({
        id_rapor: 5, juz: 1, nilai: 90
      });
      expect(res.statusCode).toBe(200);
    });

    test('✅ Finalisasi Tahfidz', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ rata: 80 }] }) // get average
        .mockResolvedValueOnce({}); // update

      const res = await request(app).post('/api/rapor/tahfidz/final').set('x-role', 'pengajar').send({
        id_rapor: 5, nilai_ujian_akhir: 90
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.nilai_akhir).toBe(85);
      expect(res.body.data.predikat).toBe('Jayyid Jiddan');
    });
  });

  // ================= LIST & REPORTS =================
  describe('Lists & Reports', () => {
    test('✅ Get Rapor Pengajar (Me)', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rows: [{ id_rapor: 1 }] }) // tahsin
        .mockResolvedValueOnce({ rows: [{ id_rapor: 2 }] }); // tahfidz

      const res = await request(app).get('/api/rapor/pengajar/me').set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.tahsin.length).toBe(1);
    });

    test('✅ Get Rekap Laporan with Filter', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id_santri: 1, nama_santri: 'Test', nama_kelas: 'Tahfidz A', nilai_tahsin: 80, nilai_tahfidz: 90 }] });

      const res = await request(app)
        .get('/api/rapor/laporan/rekap-pengajar')
        .query({ periode: '2025', id_kelas: '1', kategori: 'Tahfidz' })
        .set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.summary.total_santri).toBe(1);
    });

    test('✅ Get Periode Pengajar', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rows: [{ periode: '2024' }, { periode: '2025' }] });

      const res = await request(app).get('/api/rapor/laporan/periode').set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('2024');
    });

    test('✅ Get Santri By Jadwal', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rowCount: 1 }) // cekJadwal
        .mockResolvedValueOnce({ rows: [{ id_santri: 1, nama: 'Santri' }] }); // getSantri

      const res = await request(app).get('/api/rapor/jadwal/1/santri').set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test('✅ Get Detail Rapor Pengajar', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id_pengajar: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id_rapor: 1 }] }) // tahsin
        .mockResolvedValueOnce({ rows: [{ id_rapor: 2 }] }) // tahfidz
        .mockResolvedValueOnce({ rows: [{ juz: 30, nilai: 100 }] }); // simakan

      const res = await request(app)
        .get('/api/rapor/detail')
        .query({ id_santri: 1, periode: '2025' })
        .set('x-role', 'pengajar');
      expect(res.statusCode).toBe(200);
      expect(res.body.rapor_tahfidz.simakan.length).toBe(1);
    });
  });

  // ================= SANTRI =================
  describe('Santri Rapor', () => {
    test('✅ Santri Get Own Rapor', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1, nama: 'Santri', nis: '123' }] }) // identitas
        .mockResolvedValueOnce({ rows: [{ periode: '2025' }] }) // listPeriode
        .mockResolvedValueOnce({ rows: [{ id_rapor: 1 }] }) // tahsin
        .mockResolvedValueOnce({ rows: [{ id_rapor: 2 }] }) // tahfidz
        .mockResolvedValueOnce({ rows: [{ juz: 30, nilai: 95 }] }); // simakan

      const res = await request(app).get('/api/rapor/santri/me').set('x-role', 'santri');
      expect(res.statusCode).toBe(200);
      expect(res.body.rapor_tahsin).toBeDefined();
    });
  });
});