const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin } = require('../../helpers/authHelper');

describe('Admin Manage Santri Functional Test', () => {
  let adminToken;
  let idPendaftar;
  let idSantri;
  let nisBaru;
  const uniqueEmail = `santri_test_${Date.now()}@mail.com`;

  beforeAll(async () => {
    // 1. Login sebagai admin menggunakan helper
    adminToken = await loginAdmin();
  });

  test('1. Tambah santri (Pendaftar)', async () => {
    const res = await request(app)
      .post('/api/pendaftar/daftar')
      .send({
        nama: 'Santri Testing Flow',
        email: uniqueEmail,
        alamat: 'Jl. Testing Automation No. 1',
        no_wa: '081234567890',
        tanggal_lahir: '2010-05-20',
        tempat_lahir: 'Bogor'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    
    // Menyimpan id_pendaftar untuk dilihat di step berikutnya
    idPendaftar = res.body.data.id_pendaftar;
  });

  test('2. Lihat pendaftar santri', async () => {
    const res = await request(app)
      .get('/api/pendaftar')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    // Memastikan pendaftar yang baru saja ditambah ada di list pendaftar
    const pendaftarDitemukan = res.body.find(p => p.id_pendaftar === idPendaftar);
    expect(pendaftarDitemukan).toBeDefined();
    expect(pendaftarDitemukan.email).toBe(uniqueEmail);
  });

  test('3. Terima pendaftar santri', async () => {
    const res = await request(app)
      .put(`/api/pendaftar/terima/${idPendaftar}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        sumber: 'admin', 
        password: 'password123' 
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.nis).toBeDefined();
    
    // Menyimpan NIS yang di-generate dari proses terima pendaftar
    nisBaru = res.body.nis;
  });

  test('4. Lihat daftar santri', async () => {
    const res = await request(app)
      .get('/api/santri')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    // API merespons dengan struktur pagination/data
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);

    // Cari santri berdasarkan nis untuk mendapatkan id_santri yang tersimpan
    const santriDitemukan = res.body.data.find(s => s.nis === nisBaru);
    expect(santriDitemukan).toBeDefined();
    expect(santriDitemukan.email).toBe(uniqueEmail);
    
    // Simpan id_santri dari hasil create
    idSantri = santriDitemukan.id_santri;
  });

  test('5. Edit santri', async () => {
    const res = await request(app)
      .put(`/api/santri/${idSantri}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama: 'Santri Testing Flow Updated',
        no_wa: '0899999999'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Data santri berhasil diperbarui');
    expect(res.body.data.nama).toBe('Santri Testing Flow Updated');
  });

  test('6. Hapus santri', async () => {
    // Sesuai kode di santricontrollers.js, butuh confirm_backup untuk bisa menghapus data santri sepenuhnya
    const res = await request(app)
      .delete(`/api/santri/${idSantri}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        confirm_backup: true,
        confirm_tunggakan: true // Asumsi testing selalu pass confirm tunggakan
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Seluruh data santri berhasil dibersihkan dari sistem.');
  });
});
