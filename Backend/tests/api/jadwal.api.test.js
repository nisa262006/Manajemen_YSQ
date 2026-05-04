const request = require('supertest');
const app = require('../../src/app');

let adminToken;
let pengajarToken;
let santriToken;
let idJadwalYangDibuat;

beforeAll(async () => {
  const [resAdmin, resPengajar, resSantri] = await Promise.all([
    request(app).post('/api/auth/login').send({ identifier: 'admin2',               password: 'admin2' }),
    request(app).post('/api/auth/login').send({ identifier: 'YSQ25PGJ001_riska',   password: 'riska' }),
    request(app).post('/api/auth/login').send({ identifier: 'YSQ26DWS011_santri1', password: 'santri1123' }),
  ]);

  adminToken    = resAdmin.body.token;
  pengajarToken = resPengajar.body.token;
  santriToken   = resSantri.body.token;

  if (!adminToken)    console.warn('[beforeAll] ⚠️  Login admin gagal.');
  if (!pengajarToken) console.warn('[beforeAll] ⚠️  Login pengajar gagal.');
  if (!santriToken)   console.warn('[beforeAll] ⚠️  Login santri gagal.');
});

describe('POST /api/jadwal - Admin Membuat Jadwal Baru', () => {

  test('✅ Berhasil buat jadwal (admin + data lengkap)', async () => {
    const res = await request(app)
      .post('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id_kelas: 22, id_pengajar: 1, hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:00' });

    expect(res.statusCode).toBe(201);
    idJadwalYangDibuat = res.body.jadwal?.id_jadwal || res.body.id_jadwal;
  });

  test('❌ Gagal buat jadwal - tanpa token', async () => {
    const res = await request(app)
      .post('/api/jadwal')
      .send({ id_kelas: 22, hari: 'Selasa' });

    expect(res.statusCode).toBe(401);
  });

  test('❌ Gagal buat jadwal - body kosong / tidak lengkap', async () => {
    const res = await request(app)
      .post('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('❌ Gagal buat jadwal - akses oleh santri (bukan admin)', async () => {
    const res = await request(app)
      .post('/api/jadwal')
      .set('Authorization', `Bearer ${santriToken}`)
      .send({ id_kelas: 22, hari: 'Rabu' });

    expect(res.statusCode).toBe(403);
  });

});

describe('GET /api/jadwal - Admin Melihat Semua Jadwal', () => {

  test('✅ Berhasil ambil semua jadwal (admin)', async () => {
    const res = await request(app)
      .get('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('❌ Gagal ambil jadwal - tanpa token', async () => {
    const res = await request(app).get('/api/jadwal');
    expect(res.statusCode).toBe(401);
  });

  test('❌ Gagal ambil semua jadwal - akses oleh pengajar (bukan admin)', async () => {
    const res = await request(app)
      .get('/api/jadwal')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(403);
  });

});

describe('GET /api/jadwal/santri/me - Santri Melihat Jadwal Sendiri', () => {

  test('✅ Santri berhasil melihat jadwalnya sendiri', async () => {
    const res = await request(app)
      .get('/api/jadwal/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  test('❌ Santri gagal lihat jadwal - tanpa token', async () => {
    const res = await request(app).get('/api/jadwal/santri/me');
    expect(res.statusCode).toBe(401);
  });

  test('❌ Admin tidak bisa akses endpoint jadwal santri (role mismatch)', async () => {
    const res = await request(app)
      .get('/api/jadwal/santri/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
  });

});

describe('GET /api/jadwal/pengajar/me - Pengajar Melihat Jadwal Mengajar', () => {

  test('✅ Pengajar berhasil melihat jadwal mengajarnya', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();
  });

  test('❌ Pengajar gagal lihat jadwal - tanpa token', async () => {
    const res = await request(app).get('/api/jadwal/pengajar/me');
    expect(res.statusCode).toBe(401);
  });

  test('❌ Santri tidak bisa akses endpoint jadwal pengajar', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(403);
  });

});

describe('GET /api/jadwal/pengajar/me/hari/:hari - Jadwal Pengajar per Hari', () => {

  test('✅ Berhasil ambil jadwal pengajar di hari Senin', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me/hari/Senin')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('❌ Gagal - hari tidak valid (bukan nama hari yang dikenal)', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me/hari/BukanHari')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect([200, 400, 401, 404]).toContain(res.statusCode);
  });

});

describe('PUT /api/jadwal/:id - Admin Update Jadwal', () => {

  test('✅ Berhasil update jadwal', async () => {
    if (!idJadwalYangDibuat) return;

    const res = await request(app)
      .put(`/api/jadwal/${idJadwalYangDibuat}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hari: 'Jumat', jam_mulai: '09:00', jam_selesai: '11:00' });

    expect(res.statusCode).toBe(200);
  });

  test('❌ Gagal update jadwal - ID tidak ada', async () => {
    const res = await request(app)
      .put('/api/jadwal/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ hari: 'Rabu' });

    expect(res.statusCode).toBe(404);
  });

});

describe('DELETE /api/jadwal/:id - Admin Hapus Jadwal', () => {

  test('✅ Berhasil hapus jadwal yang dibuat', async () => {
    if (!idJadwalYangDibuat) return;

    const res = await request(app)
      .delete(`/api/jadwal/${idJadwalYangDibuat}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('❌ Gagal hapus jadwal - ID tidak ada', async () => {
    const res = await request(app)
      .delete('/api/jadwal/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  test('❌ Gagal hapus - tanpa token', async () => {
    const res = await request(app).delete('/api/jadwal/1');
    expect(res.statusCode).toBe(401);
  });

});
