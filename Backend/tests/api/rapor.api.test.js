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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RAPOR API YSQ (Mocked)', () => {

  // ============================================================
  // POST /api/rapor/tahsin - Pengajar Create Rapor Tahsin
  // ============================================================
  describe('POST /api/rapor/tahsin', () => {
    test('✅ Pengajar berhasil membuat rapor tahsin', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // cek rapor
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_rapor: 1 }] }); // insert rapor

      const res = await request(app)
        .post('/api/rapor/tahsin')
        .set('x-role', 'pengajar')
        .set('x-id-users', '1')
        .send({
          id_santri: 10,
          id_jadwal: 5,
          periode: 'Ganjil 2025',
          nilai_pekanan: 80,
          ujian_tilawah: 85,
          nilai_teori: 90,
          nilai_presensi: 100,
          catatan: 'Bagus'
        });

      // Controller mungkin mengembalikan 200 atau 201, kita cek salah satunya
      expect([200, 201]).toContain(res.statusCode);
    });

    test('❌ Santri tidak bisa akses endpoint ini (403)', async () => {
      const res = await request(app)
        .post('/api/rapor/tahsin')
        .set('x-role', 'santri')
        .send({});

      expect(res.statusCode).toBe(403);
    });
  });

  // ============================================================
  // POST /api/rapor/tahfidz - Pengajar Create Rapor Tahfidz
  // ============================================================
  describe('POST /api/rapor/tahfidz', () => {
    test('✅ Pengajar berhasil membuat rapor tahfidz', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ kategori: 'tahfidz' }] }) // cekKategori
        .mockResolvedValueOnce({ rowCount: 0, rows: [] }) // cekRapor
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_rapor: 2 }] }); // insert rapor

      const res = await request(app)
        .post('/api/rapor/tahfidz')
        .set('x-role', 'pengajar')
        .set('x-id-users', '1')
        .send({
          id_santri: 10,
          id_jadwal: 5,
          periode: 'Ganjil 2025',
          keterangan: 'Lulus'
        });

      expect([200, 201]).toContain(res.statusCode);
    });
  });

  // ============================================================
  // GET /api/rapor/santri/me - Santri Melihat Rapornya
  // ============================================================
  describe('GET /api/rapor/santri/me', () => {
    test('✅ Santri berhasil melihat rapor tahsin dan tahfidz miliknya', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 1, nama: 'Santri', nis: '123', nama_kelas: 'A', nama_pengajar: 'P' }] }) // identitas
        .mockResolvedValueOnce({ rows: [{ periode: 'Ganjil' }] }) // listPeriode
        .mockResolvedValueOnce({ rows: [{ id_rapor: 1, periode: 'Ganjil' }] }) // tahsinQ
        .mockResolvedValueOnce({ rows: [{ id_rapor: 2, periode: 'Ganjil' }] }) // tahfidzQ
        .mockResolvedValueOnce({ rows: [{ juz: 30, nilai: 90 }] }); // simakan

      const res = await request(app)
        .get('/api/rapor/santri/me')
        .set('x-role', 'santri')
        .set('x-id-users', '5');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.santri).toBeDefined();
    });

    test('❌ Admin tidak bisa akses rapor santri/me (403)', async () => {
      const res = await request(app)
        .get('/api/rapor/santri/me')
        .set('x-role', 'admin');

      expect(res.statusCode).toBe(403);
    });
  });

  // ============================================================
  // GET /api/rapor/pengajar/me - Pengajar Melihat Rapor Buatannya
  // ============================================================
  describe('GET /api/rapor/pengajar/me', () => {
    test('✅ Pengajar berhasil melihat rapor yang telah ia input', async () => {
      db.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
        .mockResolvedValueOnce({ rows: [{ id_rapor: 1, nama: 'Budi' }] }) // tahsin
        .mockResolvedValueOnce({ rows: [] }); // tahfidz

      const res = await request(app)
        .get('/api/rapor/pengajar/me')
        .set('x-role', 'pengajar')
        .set('x-id-users', '1');

      expect(res.statusCode).toBe(200);
    });
  });

});
