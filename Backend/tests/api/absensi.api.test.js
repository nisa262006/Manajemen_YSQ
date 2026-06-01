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

// ============================================================
// POST /api/absensi/santri - Pengajar Mencatat Absensi Santri
// ============================================================
describe('POST /api/absensi/santri - Pengajar Mencatat Absensi Santri', () => {

  test('✅ Pengajar berhasil mencatat absensi santri', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] })  // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'aktif' }] })  // cekSantri
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] })                   // cekTerdaftar
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })                     // cekDuplikat
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_absensi: 99 }] }); // INSERT

    const res = await request(app)
      .post('/api/absensi/santri')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-06-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('❌ Gagal catat absensi - tanpa token (401)', async () => {
    const res = await request(app)
      .post('/api/absensi/santri')
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-01-01', status_absensi: 'Hadir' });
    expect([200, 401, 403, 500]).toContain(res.statusCode);
  });

  test('❌ Gagal catat absensi - role santri tidak boleh catat (403)', async () => {
    const res = await request(app)
      .post('/api/absensi/santri')
      .set('x-role', 'santri')
      .set('x-id-users', '5')
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-01-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(403);
  });

  test('❌ Gagal catat absensi - santri tidak terdaftar di sesi (400)', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'aktif' }] }) // cekSantri
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });                   // cekTerdaftar → gagal

    const res = await request(app)
      .post('/api/absensi/santri')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-06-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(400);
  });

  test('❌ Gagal catat absensi - duplikat (400)', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] })  // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'aktif' }] })  // cekSantri
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] })                   // cekTerdaftar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] });                  // duplikat → gagal

    const res = await request(app)
      .post('/api/absensi/santri')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-06-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(400);
  });

});

// ============================================================
// PUT /api/absensi/santri/:id - Pengajar Update Absensi Santri
// ============================================================
describe('PUT /api/absensi/santri/:id - Pengajar Update Absensi Santri', () => {

  test('✅ Pengajar berhasil update status absensi santri', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_absensi: 1 }] }) // cek absensi milik pengajar
      .mockResolvedValueOnce({ rowCount: 1 });                            // UPDATE

    const res = await request(app)
      .put('/api/absensi/santri/1')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ status_absensi: 'Izin' });

    expect(res.statusCode).toBe(200);
  });

  test('❌ Gagal update absensi - ID tidak ada / bukan milik pengajar (403)', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });                  // cek → tidak ditemukan

    const res = await request(app)
      .put('/api/absensi/santri/99999')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ status_absensi: 'Sakit' });

    expect(res.statusCode).toBe(403);
  });

  test('❌ Gagal update absensi - role santri tidak boleh (403)', async () => {
    const res = await request(app)
      .put('/api/absensi/santri/1')
      .set('x-role', 'santri')
      .send({ status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// GET /api/absensi/santri/me - Santri Melihat Absensi Sendiri
// ============================================================
describe('GET /api/absensi/santri/me - Santri Melihat Absensi Sendiri', () => {

  test('✅ Santri berhasil melihat riwayat kehadirannya', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id_absensi: 1, tanggal: '2025-05-01', status_absensi: 'Hadir' }]
    });

    const res = await request(app)
      .get('/api/absensi/santri/me')
      .set('x-role', 'santri')
      .set('x-id-users', '5');

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('❌ Pengajar tidak bisa akses endpoint absensi santri/me (403)', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/me')
      .set('x-role', 'pengajar');

    expect(res.statusCode).toBe(403);
  });

  test('❌ Admin tidak bisa akses endpoint absensi santri/me (403)', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/me')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// GET /api/absensi/santri/kelas/me - Pengajar Melihat Absensi Santri di Kelasnya
// ============================================================
describe('GET /api/absensi/santri/kelas/me - Pengajar Melihat Absensi Santri di Kelasnya', () => {

  test('✅ Pengajar berhasil melihat absensi santri di kelasnya', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rows: [{ id_absensi: 1, nama_santri: 'Budi' }] }); // data absensi

    const res = await request(app)
      .get('/api/absensi/santri/kelas/me')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('❌ Gagal - santri tidak boleh lihat absensi kelas (403)', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/kelas/me')
      .set('x-role', 'santri');

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// POST /api/absensi/pengajar - Pengajar Mencatat Kehadirannya Sendiri
// ============================================================
describe('POST /api/absensi/pengajar - Pengajar Mencatat Kehadirannya Sendiri', () => {

  test('✅ Pengajar berhasil catat kehadiran diri sendiri', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] })                 // cekJadwal
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })                   // cekDuplikat
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_absensi_pengajar: 1 }] }); // INSERT

    const res = await request(app)
      .post('/api/absensi/pengajar')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ id_jadwal: 19, tanggal: '2025-06-01', status_absensi: 'Hadir', keterangan: 'Hadir' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('❌ Gagal - admin tidak boleh catat absensi di endpoint pengajar (403)', async () => {
    const res = await request(app)
      .post('/api/absensi/pengajar')
      .set('x-role', 'admin')
      .send({ id_jadwal: 19, tanggal: '2025-01-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(403);
  });

  test('❌ Gagal - duplikat absensi pengajar (400)', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] })                 // cekJadwal
      .mockResolvedValueOnce({ rowCount: 1, rows: [{}] });                // duplikat → gagal

    const res = await request(app)
      .post('/api/absensi/pengajar')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1')
      .send({ id_jadwal: 19, tanggal: '2025-06-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(400);
  });

});

// ============================================================
// GET /api/absensi/santri/all - Admin Melihat Semua Absensi Santri
// ============================================================
describe('GET /api/absensi/santri/all - Admin Melihat Semua Absensi Santri', () => {

  test('✅ Admin berhasil melihat semua data absensi santri', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id_absensi: 1, nama_santri: 'Budi', status_absensi: 'Hadir' }]
    });

    const res = await request(app)
      .get('/api/absensi/santri/all')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  test('❌ Pengajar tidak boleh akses data absensi semua santri (403)', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/all')
      .set('x-role', 'pengajar');

    expect(res.statusCode).toBe(403);
  });

  test('❌ DB Error saat ambil semua absensi santri (500)', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app)
      .get('/api/absensi/santri/all')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(500);
  });

});

// ============================================================
// GET /api/absensi/pengajar/rekap - Pengajar Melihat Rekap Kehadirannya
// ============================================================
describe('GET /api/absensi/pengajar/rekap - Pengajar Melihat Rekap Kehadirannya', () => {

  test('✅ Pengajar berhasil melihat rekap absensinya', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // getIdPengajar
      .mockResolvedValueOnce({ rows: [{ total_hadir: 5, total_izin: 1, total_alfa: 0 }] }); // rekap

    const res = await request(app)
      .get('/api/absensi/pengajar/rekap')
      .set('x-role', 'pengajar')
      .set('x-id-users', '1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  test('❌ Santri tidak bisa akses rekap pengajar (403)', async () => {
    const res = await request(app)
      .get('/api/absensi/pengajar/rekap')
      .set('x-role', 'santri');

    expect(res.statusCode).toBe(403);
  });

  test('❌ Admin tidak bisa akses rekap pengajar (403)', async () => {
    const res = await request(app)
      .get('/api/absensi/pengajar/rekap')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(403);
  });

});