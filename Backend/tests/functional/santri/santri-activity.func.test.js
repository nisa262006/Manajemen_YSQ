const request = require('supertest');
const app = require('../../../src/app');
const { loginSantri } = require('../../helpers/authHelper');

describe('Santri Activity Functional Test', () => {
  let santriToken;

  beforeAll(async () => {
    // 1. Login sebagai santri menggunakan helper
    santriToken = await loginSantri();
  });

  test('2. Lihat Profile Santri (/api/me)', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('santri');
    expect(res.body.profile).toBeDefined();
    
    // Pastikan status akun aktif agar bisa mengakses fitur lain
    expect(res.body.profile.status).toBe('aktif');
  });

  test('3. Lihat Jadwal Sendiri (/api/jadwal/santri/me)', async () => {
    const res = await request(app)
      .get('/api/jadwal/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    // API ini mengembalikan array jadwal yang berhubungan langsung dengan santri tersebut
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('4. Lihat Kelas yang Diikuti (/api/kelas/santri/me)', async () => {
    const res = await request(app)
      .get('/api/kelas/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    
    // Controller kelasSantriMe me-return format { santri: {...}, jadwal: [...] }
    expect(res.body.santri).toBeDefined();
    expect(res.body.jadwal).toBeDefined();
    expect(Array.isArray(res.body.jadwal)).toBe(true);
  });

  test('5. Lihat Riwayat Absensi Sendiri (/api/absensi/santri/me)', async () => {
    const res = await request(app)
      .get('/api/absensi/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // API ini me-return data absensi santri berbentuk array di dalam body.data
    expect(Array.isArray(res.body.data)).toBe(true);
  });
  
  // Catatan: Step (6) daftar kelas tidak diimplementasikan karena secara logika
  // di dalam sistem ini, plotting kelas santri dilakukan oleh role Admin.
});
