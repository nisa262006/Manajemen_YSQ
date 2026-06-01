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
  

  test('6. Lihat Materi Berdasarkan Jadwal (/api/tugas-media/materi/jadwal/:id_jadwal)', async () => {
    // Asumsikan santri sudah terdaftar di jadwal id=1
    const res = await request(app)
      .get('/api/tugas-media/materi/jadwal/1')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Jika ada materi, pastikan strukturnya benar
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('id_materi');
      expect(res.body[0]).toHaveProperty('judul');
    }
  });

  test('7. Lihat Daftar Tugas Berdasarkan Kelas (/api/tugas-media/tugas/kelas/:id)', async () => {
    const res = await request(app)
      .get('/api/tugas-media/tugas/kelas/1')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Simpan id_tugas pertama jika ada, untuk test submit
    if (res.body.length > 0) {
      global.idTugasForTest = res.body[0].id_tugas;
    }
  });

  test('8. Submit Jawaban Tugas (/api/tugasmateri/submit)', async () => {
    // Skip jika tidak ada tugas yang tersedia
    if (!global.idTugasForTest) {
      console.log('Skip: tidak ada tugas tersedia untuk disubmit');
      return;
    }

    const res = await request(app)
      .post('/api/tugas-media/tugas/submit')
      .set('Authorization', `Bearer ${santriToken}`)
      .send({
        id_tugas: global.idTugasForTest,
        jawaban_teks: 'Ini jawaban santri dari functional test',
        link_url: null
      });

    // 200 = berhasil, 403 = deadline lewat, 409 = sudah pernah submit
    expect([200, 403, 409]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
    }
  });

  test('9. Cek Status Submission Tugas (/api/tugas-media/tugas/:id_tugas/submission/me)', async () => {
    if (!global.idTugasForTest) {
      console.log('Skip: tidak ada id_tugas tersedia');
      return;
    }

    const res = await request(app)
      .get(`/api/tugas-media/tugas/${global.idTugasForTest}/submission/me`)
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    // Response selalu ada, entah submitted true atau false
    expect(res.body).toHaveProperty('submitted');
    if (res.body.submitted) {
      expect(res.body.data).toBeDefined();
      expect(res.body.data).toHaveProperty('jawaban_teks');
    }
  });


  test('10. Lihat Rapor Santri (/api/rapor/santri/me)', async () => {
    const res = await request(app)
      .get('/api/rapor/santri/me')
      .set('Authorization', `Bearer ${santriToken}`);

    // 200 = ada rapor, 404 = santri belum punya rapor/kelas
    expect([200, 404]).toContain(res.statusCode);
    
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.santri).toBeDefined();
      expect(res.body.santri).toHaveProperty('nama');
      expect(res.body.santri).toHaveProperty('kelas');
      expect(res.body).toHaveProperty('periode_list');
      expect(Array.isArray(res.body.periode_list)).toBe(true);
      // rapor_tahsin bisa null jika belum diisi pengajar
      expect(res.body).toHaveProperty('rapor_tahsin');
    }
  });



  test('11. Lihat Tagihan (Billing) Santri (/api/keuangan/billing/me)', async () => {
    const res = await request(app)
      .get('/api/keuangan/billing/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    // Simpan id_billing yang belum lunas untuk test pembayaran
    const tagiBelumLunas = res.body.data.find(
      b => b.status !== 'lunas' && !b.ada_menunggu
    );
    if (tagiBelumLunas) {
      global.idBillingForTest = tagiBelumLunas.id_billing;
      global.sisaBillingForTest = tagiBelumLunas.sisa;
    }
  });

  test('12. Santri Melakukan Pembayaran (/api/keuangan/pembayaran)', async () => {
    if (!global.idBillingForTest) {
      console.log('Skip: tidak ada billing yang bisa dibayar');
      return;
    }

    const res = await request(app)
      .post('/api/keuangan/pembayaran')
      .set('Authorization', `Bearer ${santriToken}`)
      .send({
        id_billing: global.idBillingForTest,
        jumlah_bayar: Math.min(global.sisaBillingForTest, 50000), // bayar sebagian atau penuh
        metode: 'transfer'
      });

    // 200 = berhasil dikirim ke admin untuk verifikasi
    // 400 = jumlah tidak valid atau billing tidak ditemukan
    expect([200, 400]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('menunggu verifikasi');
    }
  });

  test('13. Lihat Riwayat Pembayaran Santri (/api/keuangan/pembayaran/me)', async () => {
    const res = await request(app)
      .get('/api/keuangan/pembayaran/me')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Jika ada pembayaran, pastikan strukturnya benar
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('id_pembayaran');
      expect(res.body.data[0]).toHaveProperty('status');
      expect(res.body.data[0]).toHaveProperty('jumlah_bayar');
    }
  });
});