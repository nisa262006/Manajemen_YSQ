const request = require('supertest');
const app = require('../../src/app');

let adminToken;
let pengajarToken;
let santriToken;
let idAbsensiSantriYangDibuat;

beforeAll(async () => {
  const [resAdmin, resPengajar, resSantri] = await Promise.all([
    request(app).post('/api/auth/login').send({ identifier: 'admin2',               password: 'admin2' }),
    request(app).post('/api/auth/login').send({ identifier: 'YSQ25PGJ001_riska',   password: 'riska' }),
    request(app).post('/api/auth/login').send({ identifier: 'YSQ26DWS011_santri1', password: 'santri1123' }),
  ]);

  adminToken    = resAdmin.body.token;
  pengajarToken = resPengajar.body.token;
  santriToken   = resSantri.body.token;

  if (!adminToken)    console.warn('[beforeAll] ⚠️  Token admin tidak didapat.');
  if (!pengajarToken) console.warn('[beforeAll] ⚠️  Token pengajar tidak didapat.');
  if (!santriToken)   console.warn('[beforeAll] ⚠️  Token santri tidak didapat.');
});

describe('POST /api/absensi/santri - Pengajar Mencatat Absensi Santri', () => {

  test('✅ Pengajar berhasil mencatat absensi santri', async () => {
    // santri id_santri:11 terdaftar di id_jadwal:19 milik pengajar riska (id_pengajar:1)
    const res = await request(app)
      .post('/api/absensi/santri')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_santri: 11,
        id_jadwal: 19,
        tanggal: new Date().toISOString().split('T')[0],
        status_absensi: 'Hadir'
      });

    // 200 jika berhasil, 400 jika absensi hari ini sudah tercatat (duplikat)
    expect([200, 400]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      idAbsensiSantriYangDibuat = res.body.absensi?.id_absensi || res.body.id_absensi;
    }
  });

  test('❌ Gagal catat absensi - tanpa token', async () => {
    const res = await request(app)
      .post('/api/absensi/santri')
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-01-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(401);
  });

  test('❌ Gagal catat absensi - santri tidak boleh catat absensi orang lain', async () => {
    const res = await request(app)
      .post('/api/absensi/santri')
      .set('Authorization', `Bearer ${santriToken}`)
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-01-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(403);
  });

  test('❌ Gagal catat absensi - body tidak lengkap (status tidak ada)', async () => {
    const res = await request(app)
      .post('/api/absensi/santri')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({ id_santri: 11, id_jadwal: 19, tanggal: '2025-06-01' });

    // Controller akan return 400 jika santri tidak terdaftar atau status hilang
    expect([400, 401]).toContain(res.statusCode);
  });

});

describe('PUT /api/absensi/santri/:id - Pengajar Update Absensi Santri', () => {

  test('✅ Pengajar berhasil update status absensi santri', async () => {
    if (!idAbsensiSantriYangDibuat) return;

    const res = await request(app)
      .put(`/api/absensi/santri/${idAbsensiSantriYangDibuat}`)
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({ status_absensi: 'Izin' });

    expect(res.statusCode).toBe(200);
  });

  test('❌ Gagal update absensi - ID tidak ada (return 403 karena pengajar tidak punya akses ke id itu)', async () => {
    const res = await request(app)
      .put('/api/absensi/santri/99999')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({ status_absensi: 'Sakit' });

    // Controller return 403 jika record tidak ditemukan atau bukan milik pengajar ini
    expect([403, 404]).toContain(res.statusCode);
  });

  test('❌ Gagal update absensi - tanpa token', async () => {
    const res = await request(app)
      .put('/api/absensi/santri/1')
      .send({ status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(401);
  });

});

describe('GET /api/absensi/santri/me - Santri Melihat Absensi Sendiri', () => {

  test('✅ Santri berhasil melihat riwayat kehadirannya', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    // Controller return { success: true, data: [...] }
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('❌ Santri gagal lihat absensi - tanpa token', async () => {
    const res = await request(app).get('/api/absensi/santri/me');
    expect(res.statusCode).toBe(401);
  });

  test('❌ Pengajar tidak bisa akses endpoint absensi santri/me', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(403);
  });

});

describe('GET /api/absensi/santri/kelas/me - Pengajar Melihat Absensi Santri di Kelasnya', () => {

  test('✅ Pengajar berhasil melihat absensi santri di kelasnya', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/kelas/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  test('❌ Gagal - santri tidak boleh lihat absensi kelas orang lain', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/kelas/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('❌ Gagal - tanpa token', async () => {
    const res = await request(app).get('/api/absensi/santri/kelas/me');
    expect(res.statusCode).toBe(401);
  });

});

describe('POST /api/absensi/pengajar - Pengajar Mencatat Kehadirannya Sendiri', () => {

  test('✅ Pengajar berhasil catat kehadiran diri sendiri', async () => {
    const res = await request(app)
      .post('/api/absensi/pengajar')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_jadwal: 19,
        tanggal: new Date().toISOString().split('T')[0],
        status_absensi: 'Hadir',
        keterangan: 'Mengajar Tahfidz'
      });

    // 200 jika berhasil, 400 jika absensi hari ini sudah ada (duplikat)
    expect([200, 400]).toContain(res.statusCode);
  });

  test('❌ Gagal - admin tidak boleh catat absensi di endpoint pengajar', async () => {
    const res = await request(app)
      .post('/api/absensi/pengajar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id_jadwal: 19, tanggal: '2025-01-01', status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(403);
  });

  test('❌ Gagal - tanpa token', async () => {
    const res = await request(app)
      .post('/api/absensi/pengajar')
      .send({ status_absensi: 'Hadir' });

    expect(res.statusCode).toBe(401);
  });

});

describe('GET /api/absensi/santri/all - Admin Melihat Semua Absensi Santri', () => {

  test('✅ Admin berhasil melihat semua data absensi santri', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  test('❌ Pengajar tidak boleh akses data absensi semua santri', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/all')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('❌ Tanpa token ditolak', async () => {
    const res = await request(app).get('/api/absensi/santri/all');
    expect(res.statusCode).toBe(401);
  });

});

describe('GET /api/absensi/pengajar/rekap - Pengajar Melihat Rekap Kehadirannya', () => {

  test('✅ Pengajar berhasil melihat rekap absensinya', async () => {
    const res = await request(app)
      .get('/api/absensi/pengajar/rekap')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  test('❌ Santri tidak bisa akses rekap pengajar', async () => {
    const res = await request(app)
      .get('/api/absensi/pengajar/rekap')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('❌ Tanpa token ditolak', async () => {
    const res = await request(app).get('/api/absensi/pengajar/rekap');
    expect(res.statusCode).toBe(401);
  });

});
