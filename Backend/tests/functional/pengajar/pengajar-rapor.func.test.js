const request = require('supertest');
const app = require('../../../src/app');
const { loginPengajar, loginSantri } = require('../../helpers/authHelper');

const db = require('../../../src/config/db');

describe('Functional Test: Pengajar Rapor', () => {
  let pengajarToken;
  let santriToken;
  let idRapor;

  beforeAll(async () => {
    await db.query(`DELETE FROM rapor_tahsin WHERE periode IN ('Func_Genap 2026', 'Genap 2026')`);
    await db.query('INSERT INTO santri_jadwal (id_santri, id_jadwal) VALUES (1, 1) ON CONFLICT DO NOTHING');
    pengajarToken = await loginPengajar();
    santriToken = await loginSantri();
  });

  test('1. Pengajar berhasil membuat rapor tahsin untuk santri', async () => {
    const res = await request(app)
      .post('/api/rapor/tahsin')
      .set('Authorization', `Bearer ${pengajarToken}`)
      .send({
        id_santri: 1,
        id_jadwal: 1,
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
  });

  test('2. Santri melihat rapor miliknya sendiri', async () => {
    const res = await request(app)
      .get('/api/rapor/santri/me?periode=Func_Genap 2026')
      .set('Authorization', `Bearer ${santriToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('rapor_tahsin');
    
    if (res.body.rapor_tahsin) {
      idRapor = res.body.rapor_tahsin.id_rapor;
    }
  });

  test('3. Pengajar melihat rapor yang sudah diinput', async () => {
    const res = await request(app)
      .get('/api/rapor/pengajar/me')
      .set('Authorization', `Bearer ${pengajarToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.tahsin)).toBe(true);
  });

  afterAll(async () => {
    if (idRapor) {
      await request(app)
        .delete(`/api/rapor/tahsin/${idRapor}`)
        .set('Authorization', `Bearer ${pengajarToken}`);
    }
  });
});
