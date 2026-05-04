const request = require('supertest');
const app = require('../../../src/app');

describe('Admin Profile Functional Test', () => {
  let adminToken;
  let idAdmin;

  test('1. Login admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin2',
        password: 'admin2' // Default password for testing based on auth.api.test.js
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    
    // 2. Ambil token dari response login
    adminToken = res.body.token;
  });

  test('3. Gunakan token untuk akses endpoint /api/me', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.role).toBe('admin');
    expect(res.body.profile).toHaveProperty('id_admin');

    // Simpan id_admin untuk dipakai di test berikutnya
    idAdmin = res.body.profile.id_admin;
  });

  test('4. Lakukan edit profile admin', async () => {
    const updateData = {
      nama: 'Admin Updated Test',
      email: `admin_updated_${Date.now()}@mail.com`, // Unique email to prevent conflict
      no_wa: '081234567890'
    };

    const res = await request(app)
      .put(`/api/admin/profile/${idAdmin}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profil diperbarui');
    expect(res.body.data.nama).toBe(updateData.nama);
    expect(res.body.data.email).toBe(updateData.email);
    expect(res.body.data.no_wa).toBe(updateData.no_wa);
  });

  test('5. Get & Update profile ID tidak ditemukan (404)', async () => {
    const resGet = await request(app)
      .get(`/api/admin/profile/999999`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resGet.statusCode).toBe(404);

    const resPut = await request(app)
      .put(`/api/admin/profile/999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nama: 'test' });
    expect(resPut.statusCode).toBe(404);
  });

  test('6. Create Announcement dengan payload kosong (400)', async () => {
    const res = await request(app)
      .post(`/api/admin/announcement`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('7. Get Stats - DB Error (500)', async () => {
    const db = require('../../../src/config/db');
    const spy = jest.spyOn(db, 'query')
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 1, role: 'admin', status_user: 'aktif' }] }) // auth middleware
      .mockRejectedValueOnce(new Error('DB Error Simulator'));

    const res = await request(app)
      .get(`/api/admin/stats`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(500);
    spy.mockRestore();
  });
});
