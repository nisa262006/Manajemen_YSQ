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
  onlyAdmin:   (req, res, next) => req.user.role === 'admin'    ? next() : res.status(403).json({ message: 'Admin only' }),
  onlySantri:  (req, res, next) => req.user.role === 'santri'   ? next() : res.status(403).json({ message: 'Santri only' }),
  onlyPengajar:(req, res, next) => req.user.role === 'pengajar' ? next() : res.status(403).json({ message: 'Pengajar only' }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================
// POST /api/jadwal - Admin Membuat Jadwal Baru
// ============================================================
describe('POST /api/jadwal - Admin Membuat Jadwal Baru', () => {

  test('✅ Berhasil buat jadwal (admin + data lengkap)', async () => {
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_jadwal: 99, id_kelas: 22, hari: 'Kamis' }]
    });

    const res = await request(app)
      .post('/api/jadwal')
      .set('x-role', 'admin')
      .send({ id_kelas: 22, id_pengajar: 1, hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:00' });

    expect(res.statusCode).toBe(201);
    expect(res.body.jadwal).toBeDefined();
    expect(res.body.message).toBe('Jadwal berhasil ditambahkan');
  });

  test('❌ Gagal buat jadwal - body kosong / tidak lengkap (400)', async () => {
    const res = await request(app)
      .post('/api/jadwal')
      .set('x-role', 'admin')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('❌ Gagal buat jadwal - akses oleh santri (bukan admin) (403)', async () => {
    const res = await request(app)
      .post('/api/jadwal')
      .set('x-role', 'santri')
      .send({ id_kelas: 22, hari: 'Rabu', jam_mulai: '08:00', jam_selesai: '10:00' });

    expect(res.statusCode).toBe(403);
  });

  test('❌ DB Error saat tambah jadwal (500)', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app)
      .post('/api/jadwal')
      .set('x-role', 'admin')
      .send({ id_kelas: 22, id_pengajar: 1, hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:00' });

    expect(res.statusCode).toBe(500);
  });

});

// ============================================================
// GET /api/jadwal - Admin Melihat Semua Jadwal
// ============================================================
describe('GET /api/jadwal - Admin Melihat Semua Jadwal', () => {

  test('✅ Berhasil ambil semua jadwal (admin)', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id_jadwal: 1, hari: 'Senin', nama_kelas: 'Kelas A' }]
    });

    const res = await request(app)
      .get('/api/jadwal')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('❌ Gagal ambil semua jadwal - akses oleh pengajar (bukan admin) (403)', async () => {
    const res = await request(app)
      .get('/api/jadwal')
      .set('x-role', 'pengajar');

    expect(res.statusCode).toBe(403);
  });

  test('❌ DB Error saat ambil jadwal (500)', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app)
      .get('/api/jadwal')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(500);
  });

});

// ============================================================
// GET /api/jadwal/santri/me - Santri Melihat Jadwal Sendiri
// ============================================================
describe('GET /api/jadwal/santri/me - Santri Melihat Jadwal Sendiri', () => {

  test('✅ Santri berhasil melihat jadwalnya sendiri', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id_jadwal: 1, hari: 'Senin', nama_kelas: 'Kelas A' }]
    });

    const res = await request(app)
      .get('/api/jadwal/santri/me')
      .set('x-role', 'santri')
      .set('x-id-users', '5');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('❌ Admin tidak bisa akses endpoint jadwal santri (role mismatch) (403)', async () => {
    const res = await request(app)
      .get('/api/jadwal/santri/me')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// GET /api/jadwal/pengajar/me - Pengajar Melihat Jadwal Mengajar
// ============================================================
describe('GET /api/jadwal/pengajar/me - Pengajar Melihat Jadwal Mengajar', () => {

  test('✅ Pengajar berhasil melihat jadwal mengajarnya', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] }) // ambil id_pengajar
      .mockResolvedValueOnce({ rows: [{ id_jadwal: 1, hari: 'Senin' }] }); // daftar jadwal

    const res = await request(app)
      .get('/api/jadwal/pengajar/me')
      .set('x-role', 'pengajar')
      .set('x-id-users', '2');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('❌ Santri tidak bisa akses endpoint jadwal pengajar (403)', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me')
      .set('x-role', 'santri');

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// GET /api/jadwal/pengajar/me/hari/:hari - Jadwal Pengajar per Hari
// ============================================================
describe('GET /api/jadwal/pengajar/me/hari/:hari - Jadwal Pengajar per Hari', () => {

  test('✅ Berhasil ambil jadwal pengajar di hari Senin', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pengajar: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id_jadwal: 1, hari: 'Senin' }] });

    const res = await request(app)
      .get('/api/jadwal/pengajar/me/hari/Senin')
      .set('x-role', 'pengajar')
      .set('x-id-users', '2');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('❌ Santri tidak bisa akses endpoint per hari pengajar (403)', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me/hari/Senin')
      .set('x-role', 'santri');

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// PUT /api/jadwal/:id - Admin Update Jadwal
// ============================================================
describe('PUT /api/jadwal/:id - Admin Update Jadwal', () => {

  test('✅ Berhasil update jadwal', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_jadwal: 1 }] });

    const res = await request(app)
      .put('/api/jadwal/1')
      .set('x-role', 'admin')
      .send({ hari: 'Jumat', jam_mulai: '09:00', jam_selesai: '11:00' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Jadwal berhasil diupdate');
  });

  test('❌ Gagal update jadwal - ID tidak ada (404)', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .put('/api/jadwal/99999')
      .set('x-role', 'admin')
      .send({ hari: 'Rabu' });

    expect(res.statusCode).toBe(404);
  });

  test('❌ Gagal update - akses oleh pengajar (403)', async () => {
    const res = await request(app)
      .put('/api/jadwal/1')
      .set('x-role', 'pengajar')
      .send({ hari: 'Rabu' });

    expect(res.statusCode).toBe(403);
  });

});

// ============================================================
// DELETE /api/jadwal/:id - Admin Hapus Jadwal
// ============================================================
describe('DELETE /api/jadwal/:id - Admin Hapus Jadwal', () => {

  test('✅ Berhasil hapus jadwal', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_jadwal: 1 }] });

    const res = await request(app)
      .delete('/api/jadwal/1')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Jadwal berhasil dihapus');
  });

  test('❌ Gagal hapus jadwal - ID tidak ada (404)', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app)
      .delete('/api/jadwal/99999')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(404);
  });

  test('❌ Gagal hapus - akses oleh santri (403)', async () => {
    const res = await request(app)
      .delete('/api/jadwal/1')
      .set('x-role', 'santri');

    expect(res.statusCode).toBe(403);
  });

  test('❌ DB Error saat hapus jadwal (500)', async () => {
    db.query.mockRejectedValueOnce(new Error('DB Error'));

    const res = await request(app)
      .delete('/api/jadwal/1')
      .set('x-role', 'admin');

    expect(res.statusCode).toBe(500);
  });

});
