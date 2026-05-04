const request = require('supertest');
const app = require('../../../src/app');
const { loginPengajar } = require('../../helpers/authHelper');

describe('Pengajar Activity Functional Test', () => {
  let pengajarToken;
  let idJadwal;
  let idSantri;

  beforeAll(async () => {
    // 1. Login sebagai pengajar menggunakan helper
    pengajarToken = await loginPengajar();
  });

  test('2. Lihat profile pengajar (/api/me)', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('pengajar');
    expect(res.body.profile).toBeDefined();
  });

  test('3. Lihat jadwal pengajar (/api/jadwal/pengajar/me)', async () => {
    const res = await request(app)
      .get('/api/jadwal/pengajar/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Pastikan pengajar memiliki jadwal untuk test selanjutnya
    // Menyimpan id_jadwal teratas (pertama) jika ada jadwal
    if (res.body.length > 0) {
      idJadwal = res.body[0].id_jadwal;
    }
  });

  // Prerequisite step: Dapatkan id_santri berdasarkan kelas/jadwal
  test('Prerequisite: Dapatkan ID Santri dari Jadwal', async () => {
    if (!idJadwal) return; // Skip jika tidak ada jadwal

    const res = await request(app)
      .get(`/api/jadwal/${idJadwal}/santri`)
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Menyimpan id_santri teratas jika ada santri dalam kelas
    if (res.body.data && res.body.data.length > 0) {
      idSantri = res.body.data[0].id_santri;
    }
  });

  test('4. Absen diri sendiri (/api/absensi/pengajar)', async () => {
    if (!idJadwal) return; // Skip karena butuh id_jadwal

    const res = await request(app)
      .post('/api/absensi/pengajar')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_jadwal: idJadwal,
        status_absensi: 'Hadir',
        catatan: 'Testing absensi pengajar mandiri'
      });

    // Boleh 200 jika berhasil insert pertama kali, atau 400 jika sudah absen pada hari ini (Duplikat)
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  test('5. Absen santri (/api/absensi/santri)', async () => {
    if (!idJadwal || !idSantri) return; // Skip karena butuh referensi id_jadwal & id_santri

    const res = await request(app)
      .post('/api/absensi/santri')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_santri: idSantri,
        id_jadwal: idJadwal,
        status_absensi: 'Hadir',
        catatan: 'Testing absensi santri oleh pengajar'
      });

    // Boleh 200 jika berhasil insert, atau 400 jika sudah diabsen hari ini
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  test('6. Lihat riwayat absensi santri (/api/absensi/santri/kelas/me)', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/kelas/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
