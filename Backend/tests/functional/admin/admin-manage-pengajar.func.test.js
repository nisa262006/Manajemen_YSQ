const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin } = require('../../helpers/authHelper');

describe('Admin Manage Pengajar Functional Test', () => {
  let adminToken;
  let idPengajar;
  const uniqueEmail = `pengajar_test_${Date.now()}@mail.com`;

  beforeAll(async () => {
    // 1. Login admin menggunakan helper
    adminToken = await loginAdmin();
  });

  test('1. Tambah pengajar', async () => {
    const res = await request(app)
      .post('/api/pengajar/tambah')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama: 'Pengajar Testing Flow',
        alamat: 'Jl. Automation Testing No. 1',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '1990-01-01',
        mapel: 'Tahsin',
        email: uniqueEmail,
        no_kontak: '081234567890',
        password: 'password123',
        confirmPassword: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Pengajar berhasil ditambahkan');
    expect(res.body.email).toBe(uniqueEmail);
    expect(res.body.nip).toBeDefined();
  });

  test('2. Lihat pengajar', async () => {
    const res = await request(app)
      .get('/api/pengajar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);

    // Cari pengajar yang baru ditambahkan berdasarkan email unik
    const pengajarDitemukan = res.body.data.find(p => p.email === uniqueEmail);
    expect(pengajarDitemukan).toBeDefined();
    expect(pengajarDitemukan.nama).toBe('Pengajar Testing Flow');
    
    // Menyimpan id_pengajar untuk di-edit dan di-hapus pada step berikutnya
    idPengajar = pengajarDitemukan.id_pengajar;
  });

  test('3. Edit pengajar', async () => {
    const res = await request(app)
      .put(`/api/pengajar/${idPengajar}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama: 'Pengajar Testing Flow Updated',
        no_kontak: '0899999999',
        status: 'aktif'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Pengajar berhasil diperbarui');
    
    // Assertion pada return updated_fields untuk memastikan perubahannya terekam
    expect(res.body.updated_fields.nama.new).toBe('Pengajar Testing Flow Updated');
  });

  test('4. Hapus pengajar', async () => {
    const res = await request(app)
      .delete(`/api/pengajar/${idPengajar}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Pengajar berhasil dihapus sepenuhnya');
  });
});
