const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin } = require('../../helpers/authHelper');

describe('Admin Manage Santri Functional Test', () => {
  let adminToken;
  let idPendaftar1, idPendaftar2;
  let idSantri1;
  let nis1;
  
  const email1 = `santri_seq1_${Date.now()}@mail.com`;
  const email2 = `santri_seq2_${Date.now()}@mail.com`;

  beforeAll(async () => {
    // 1. Login sebagai admin menggunakan helper
    adminToken = await loginAdmin();
  });

  test('1. Registrasi 2 Pendaftar', async () => {
    // Pendaftar 1
    const res1 = await request(app)
      .post('/api/pendaftar/daftar')
      .send({
        nama: 'Pendaftar Satu',
        email: email1,
        alamat: 'Alamat 1',
        no_wa: '08123000001',
        tanggal_lahir: '2010-01-01',
        tempat_lahir: 'Jakarta'
      });
    expect(res1.statusCode).toBe(201);
    idPendaftar1 = res1.body.data.id_pendaftar;

    // Pendaftar 2
    const res2 = await request(app)
      .post('/api/pendaftar/daftar')
      .send({
        nama: 'Pendaftar Dua',
        email: email2,
        alamat: 'Alamat 2',
        no_wa: '08123000002',
        tanggal_lahir: '2012-01-01',
        tempat_lahir: 'Bogor'
      });
    expect(res2.statusCode).toBe(201);
    idPendaftar2 = res2.body.data.id_pendaftar;
  });

  test('2. Lihat Pendaftar', async () => {
    const res = await request(app)
      .get('/api/pendaftar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    const p1 = res.body.find(p => p.id_pendaftar === idPendaftar1);
    const p2 = res.body.find(p => p.id_pendaftar === idPendaftar2);
    expect(p1).toBeDefined();
    expect(p2).toBeDefined();
  });

  test('3. Terima Pendaftar 1', async () => {
    const res = await request(app)
      .put(`/api/pendaftar/terima/${idPendaftar1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        sumber: 'admin', 
        password: 'password123' 
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.nis).toBeDefined();
    nis1 = res.body.nis;
  });

  test('4. Tolak Pendaftar 2', async () => {
    const res = await request(app)
      .put(`/api/pendaftar/tolak/${idPendaftar2}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Pendaftar ditolak');
  });

  test('5. Lihat Daftar Santri', async () => {
    const res = await request(app)
      .get(`/api/santri?q=${nis1}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    
    const santri = res.body.data.find(s => s.nis === nis1);
    expect(santri).toBeDefined();
    idSantri1 = santri.id_santri;
  });

  test('6. Edit Santri', async () => {
    const res = await request(app)
      .put(`/api/santri/${idSantri1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama: 'Pendaftar Satu Updated',
        no_wa: '0899999999'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nama).toBe('Pendaftar Satu Updated');
  });

  test('7. Reset/Hapus Semua Pendaftar', async () => {
    const res = await request(app)
      .delete('/api/pendaftar/reset/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Semua pendaftar dihapus');

    // Verifikasi list pendaftar kosong
    const resList = await request(app)
      .get('/api/pendaftar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resList.body.length).toBe(0);
  });
});