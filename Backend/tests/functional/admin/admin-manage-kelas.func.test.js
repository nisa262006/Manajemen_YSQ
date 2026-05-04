const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin } = require('../../helpers/authHelper');

describe('Admin Manage Kelas Functional Test', () => {
  let adminToken;
  let idKelas;

  beforeAll(async () => {
    // 1. Login admin menggunakan helper
    adminToken = await loginAdmin();
  });

  test('1. Tambah kelas', async () => {
    const res = await request(app)
      .post('/api/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_kelas: 'Kelas Testing Flow',
        kategori: 'Reguler'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Kelas berhasil ditambahkan');
    expect(res.body.kelas).toBeDefined();
    
    // Menyimpan id_kelas dari hasil create untuk step selanjutnya
    idKelas = res.body.kelas.id_kelas;
  });

  test('2. Lihat kelas', async () => {
    const res = await request(app)
      .get('/api/kelas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Cari kelas yang baru dibuat berdasarkan id_kelas
    const kelasDitemukan = res.body.find(k => k.id_kelas === idKelas);
    expect(kelasDitemukan).toBeDefined();
    expect(kelasDitemukan.nama_kelas).toBe('Kelas Testing Flow');
  });

  test('3. Edit kelas', async () => {
    const res = await request(app)
      .put(`/api/kelas/edit/${idKelas}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_kelas: 'Kelas Testing Flow Updated',
        kategori: 'Intensif'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Kelas berhasil diupdate');
  });

  test('4. Hapus kelas', async () => {
    const res = await request(app)
      .delete(`/api/kelas/hapus/${idKelas}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Kelas berhasil dihapus');
  });
});
