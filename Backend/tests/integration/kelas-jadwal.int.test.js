const request = require('supertest');
const app = require('../../src/app');
const { loginAdmin } = require('../helpers/authHelper');

describe('Integration Test: Kelas & Jadwal Flow', () => {
  let adminToken;
  let idKelas;
  let idJadwal;
  const namaKelasUnik = `Kelas Integrasi ${Date.now()}`;

  beforeAll(async () => {
    // 1. Login admin
    adminToken = await loginAdmin();
  });

  test('2. Tambah Kelas Baru', async () => {
    const res = await request(app)
      .post('/api/kelas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nama_kelas: namaKelasUnik,
        kategori: 'Reguler'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.kelas).toBeDefined();
    
    // Menyimpan id_kelas yang di-generate oleh real test DB
    idKelas = res.body.kelas.id_kelas;
  });

  test('3. Tambah Jadwal Menggunakan id_kelas', async () => {
    expect(idKelas).toBeDefined();

    const res = await request(app)
      .post('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_kelas: idKelas, 
        hari: 'Jumat',
        jam_mulai: '13:00',
        jam_selesai: '15:00',
        kapasitas: 25
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.jadwal).toBeDefined();
    
    // Menyimpan id_jadwal
    idJadwal = res.body.jadwal.id_jadwal;
  });

  test('4. Validasi Jadwal Terhubung dengan Kelas', async () => {
    expect(idJadwal).toBeDefined();

    // Memanggil endpoint detail jadwal yang di dalamnya melakukan query JOIN dengan tabel kelas
    const res = await request(app)
      .get(`/api/jadwal/${idJadwal}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    
    // Memastikan relasi foreign key berjalan dan data yang ditarik via JOIN relevan
    expect(res.body.id_kelas).toBe(idKelas);
    expect(res.body.nama_kelas).toBe(namaKelasUnik);
    expect(res.body.hari).toBe('Jumat');
  });

  // (Opsional) Teardown: Membersihkan test data dari test DB agar tidak terjadi penumpukan
  afterAll(async () => {
    if (idJadwal) {
      await request(app)
        .delete(`/api/jadwal/${idJadwal}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
    
    if (idKelas) {
      await request(app)
        .delete(`/api/kelas/hapus/${idKelas}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });
});