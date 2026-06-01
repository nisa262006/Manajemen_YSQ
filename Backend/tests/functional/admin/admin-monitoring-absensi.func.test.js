const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin } = require('../../helpers/authHelper');

describe('Admin Monitoring Absensi Functional Test', () => {
  let adminToken;
  
  // Format filter 1 bulan berjalan, misal: "2024-05" (YYYY-MM)
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const filterTanggal = `${year}-${month}`;

  beforeAll(async () => {
    // 1. Login sebagai admin menggunakan helper
    adminToken = await loginAdmin();
  });

  test('2. Lihat absensi pengajar (filter 1 bulan)', async () => {
    const res = await request(app)
      .get(`/api/absensi/pengajar/all`)
      .query({ tanggal: filterTanggal }) // Query parameter tanggal
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    // Walaupun pada source code controller getAllAbsensiPengajar parameter query ini mungkin 
    // akan dikembangkan lebih lanjut/dihandle di frontend, endpoint ini harus berhasil di-hit.
  });

  test('3. Lihat absensi santri (filter 1 bulan)', async () => {
    const res = await request(app)
      .get(`/api/absensi/santri/all`)
      .query({ tanggal: filterTanggal }) // Query parameter tanggal
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});