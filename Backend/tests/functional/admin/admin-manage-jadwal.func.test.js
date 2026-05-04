const request = require('supertest');
const app = require('../../../src/app');
const { loginAdmin } = require('../../helpers/authHelper');

describe('Admin Manage Jadwal Functional Test', () => {
  let adminToken;
  let idKelas;
  let idPengajar;
  let idSantri;
  let idJadwal1;
  let idJadwal2; // Digunakan sebagai destinasi pindah santri ke jadwal lain

  beforeAll(async () => {
    // 1. Login admin
    adminToken = await loginAdmin();

    // Mengambil data dari test sebelumnya (kelas, pengajar, santri)
    const [resKelas, resPengajar, resSantri] = await Promise.all([
      request(app).get('/api/kelas').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/pengajar').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/santri').set('Authorization', `Bearer ${adminToken}`)
    ]);

    // Mengambil ID pertama yang ditemukan dari masing-masing response
    if (resKelas.body.length > 0) {
      idKelas = resKelas.body[0].id_kelas;
    }
    
    if (resPengajar.body.data && resPengajar.body.data.length > 0) {
      idPengajar = resPengajar.body.data[0].id_pengajar;
    }
    
    if (resSantri.body.data && resSantri.body.data.length > 0) {
      idSantri = resSantri.body.data[0].id_santri;
    }
  });

  test('2. Tambah jadwal', async () => {
    // Memastikan prerequisite data (kelas & pengajar) tersedia
    expect(idKelas).toBeDefined();
    expect(idPengajar).toBeDefined();

    // Buat jadwal 1
    const res1 = await request(app)
      .post('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_kelas: idKelas,
        hari: 'Senin',
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        id_pengajar: idPengajar,
        kapasitas: 20
      });

    expect(res1.statusCode).toBe(201);
    expect(res1.body.message).toBe('Jadwal berhasil ditambahkan');
    expect(res1.body.jadwal).toBeDefined();
    
    idJadwal1 = res1.body.jadwal.id_jadwal;

    // Buat jadwal 2 (untuk testing pindah jadwal nanti)
    const res2 = await request(app)
      .post('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_kelas: idKelas,
        hari: 'Selasa',
        jam_mulai: '10:00',
        jam_selesai: '12:00',
        id_pengajar: idPengajar,
        kapasitas: 20
      });
      
    idJadwal2 = res2.body.jadwal.id_jadwal;
  });

  test('3. Lihat jadwal', async () => {
    const res = await request(app)
      .get('/api/jadwal')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const jadwalDitemukan = res.body.data.find(j => j.id_jadwal === idJadwal1);
    expect(jadwalDitemukan).toBeDefined();
    expect(jadwalDitemukan.hari).toBe('Senin');
  });

  test('4. Edit jadwal', async () => {
    const res = await request(app)
      .put(`/api/jadwal/${idJadwal1}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hari: 'Rabu',
        jam_mulai: '09:00',
        jam_selesai: '11:00'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Jadwal berhasil diupdate');
  });

  test('5. Assign santri ke jadwal', async () => {
    // Pastikan ID Santri tersedia
    expect(idSantri).toBeDefined();

    const res = await request(app)
      .post(`/api/jadwal/${idJadwal1}/santri`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_santri: idSantri
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Santri berhasil dipindahkan ke sesi baru');
  });

  test('6. Lihat santri di jadwal kelas di halaman kelas', async () => {
    // API GET /api/kelas/detail/:id_kelas akan mereturn daftar santri pada kelas tersebut
    const res = await request(app)
      .get(`/api/kelas/detail/${idKelas}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.kelas).toBeDefined();
    expect(res.body.santri).toBeDefined();
    expect(Array.isArray(res.body.santri)).toBe(true);

    // Memastikan santri yang telah diassign ke jadwal muncul di detail kelas
    const santriDitemukan = res.body.santri.find(s => s.id_santri === idSantri);
    expect(santriDitemukan).toBeDefined();
  });

  test('7. Pindahkan santri ke jadwalkelas lain', async () => {
    // Memindahkan santri dari idJadwal1 ke idJadwal2 menggunakan endpoint yang sama 
    // karena logic backend menghapus sesi lama & assign ke sesi baru
    const res = await request(app)
      .post(`/api/jadwal/${idJadwal2}/santri`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        id_santri: idSantri
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Santri berhasil dipindahkan ke sesi baru');
  });

  test('8. Hapus jadwal', async () => {
    // Menghapus jadwal 1
    const res1 = await request(app)
      .delete(`/api/jadwal/${idJadwal1}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res1.statusCode).toBe(200);
    expect(res1.body.message).toBe('Jadwal berhasil dihapus');

    // Menghapus jadwal 2
    const res2 = await request(app)
      .delete(`/api/jadwal/${idJadwal2}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res2.statusCode).toBe(200);
  });
});
