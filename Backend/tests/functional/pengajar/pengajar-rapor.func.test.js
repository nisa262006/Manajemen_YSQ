const request = require('supertest');
const app = require('../../../src/app');
const { loginPengajar, loginSantri } = require('../../helpers/authHelper');

const db = require('../../../src/config/db');

describe('Functional Test: Pengajar Rapor', () => {
  let pengajarToken;
  let santriToken;
  let idRapor;
  let idSantri;
  let idPengajar;
  let idJadwal = 1;

  beforeAll(async () => {
    await db.query(`DELETE FROM rapor_tahsin WHERE periode IN ('Func_Genap 2026', 'Genap 2026')`);
    pengajarToken = await loginPengajar();
    santriToken = await loginSantri();

    // Dapatkan ID dinamis
    const meSantri = await request(app).get('/api/me').set('Authorization', `Bearer ${santriToken}`);
    idSantri = meSantri.body.profile.id_santri;

    const mePengajar = await request(app).get('/api/me').set('Authorization', `Bearer ${pengajarToken}`);
    idPengajar = mePengajar.body.profile.id_pengajar;

    // Cari jadwal pengajar ini
    const resJadwal = await db.query('SELECT id_jadwal FROM jadwal WHERE id_pengajar = $1 LIMIT 1', [idPengajar]);
    if (resJadwal.rowCount > 0) {
      idJadwal = resJadwal.rows[0].id_jadwal;
    } else {
      // Buat kelas baru
      const resKelas = await db.query(
        "INSERT INTO kelas (nama_kelas, kategori) VALUES ('Kelas Test Pengajar Rapor', 'Reguler') RETURNING id_kelas"
      );
      const idKelas = resKelas.rows[0].id_kelas;
      // Buat jadwal baru
      const createJadwal = await db.query(
        'INSERT INTO jadwal (id_kelas, id_pengajar, hari, jam_mulai, jam_selesai, kapasitas) VALUES ($1, $2, $3, $4, $5, 20) RETURNING id_jadwal',
        [idKelas, idPengajar, 'Senin', '08:00:00', '09:00:00']
      );
      idJadwal = createJadwal.rows[0].id_jadwal;
    }

    await db.query('INSERT INTO santri_jadwal (id_santri, id_jadwal) VALUES ($1, $2) ON CONFLICT DO NOTHING', [idSantri, idJadwal]);
  });

  test('1. Pengajar berhasil membuat rapor tahsin untuk santri', async () => {
    // Gunakan data santri dan jadwal dari seed.test.sql
    const res = await request(app)
      .post('/api/rapor/tahsin')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_santri: idSantri,
        id_jadwal: idJadwal,
        periode: 'Func_Genap 2026',
        nilai_pekanan: 85,
        ujian_tilawah: 88,
        nilai_teori: 90,
        nilai_presensi: 100,
        nilai_akhir: 90,
        catatan: 'Santri sangat aktif dan bacaan lancar'
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    
    // Asumsi balikan dari controller ada id_rapor (bisa disesuaikan dengan skema respons Anda)
    // Walaupun res.body tidak punya data id_rapor kita asumsikan insert berhasil.
  });

  test('2. Santri melihat rapor miliknya sendiri', async () => {
    const res = await request(app)
      .get('/api/rapor/santri/me?periode=Func_Genap 2026')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rapor_tahsin).toBeDefined();
    
    // Pastikan rapor tahsin yang dibuat tadi masuk
    const raporTadi = res.body.rapor_tahsin;
    expect(raporTadi.periode).toBe('Func_Genap 2026');
    idRapor = raporTadi.id_rapor; // Ambil ID untuk dihapus nanti
  });

  test('3. Pengajar melihat rapor yang sudah diinput', async () => {
    const res = await request(app)
      .get('/api/rapor/pengajar/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.tahsin)).toBe(true);
  });

  // Teardown (Opsional)
  afterAll(async () => {
    if (idRapor) {
      await request(app)
        .delete(`/api/rapor/tahsin/${idRapor}`)
        .set('Authorization', `Bearer ${pengajarToken}`);
    }
  });

});