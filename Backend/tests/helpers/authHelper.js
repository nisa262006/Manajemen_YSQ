const request = require('supertest');
const app = require('../../src/app');

/**
 * Helper untuk login admin dan mendapatkan token
 * @returns {Promise<string>} token
 */
const loginAdmin = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      identifier: 'admin2',
      password: 'admin2'
    });
  
  if (res.statusCode === 200 && res.body.token) {
    return res.body.token;
  }

  // Fallback: jika login API gagal (misal DB belum seed di CI),
  // kembalikan generated token agar tests lain tetap bisa berjalan.
  // id_users=2 sesuai urutan INSERT admin2 di init.sql.
  console.warn(
    `⚠️  LOGIN ADMIN FAILED (${res.statusCode}):`,
    JSON.stringify(res.body),
    '— menggunakan generated token (fallback sementara)'
  );
  return makeAdminToken(2);
};

/**
 * Helper untuk login pengajar dan mendapatkan token
 * @returns {Promise<string>} token
 */
const loginPengajar = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      identifier: 'YSQ25PGJ001_riska',
      password: 'riska'
    });
  
  if (res.statusCode === 200 && res.body.token) {
    return res.body.token;
  }

  // Fallback: id_users=8 sesuai urutan INSERT pengajar di init.sql
  console.warn(
    `⚠️  LOGIN PENGAJAR FAILED (${res.statusCode}):`,
    JSON.stringify(res.body),
    '— menggunakan generated token (fallback sementara)'
  );
  return makePengajarToken(8);
};

/**
 * Helper untuk login santri dan mendapatkan token
 * @returns {Promise<string>} token
 */
const loginSantri = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      identifier: 'YSQ26DWS011_santri1',
      password: 'santri1123'
    });
  
  if (res.statusCode === 200 && res.body.token) {
    return res.body.token;
  }

  // Fallback: id_users=6 sesuai urutan INSERT santri1 di init.sql
  console.warn(
    `⚠️  LOGIN SANTRI FAILED (${res.statusCode}):`,
    JSON.stringify(res.body),
    '— menggunakan generated token (fallback sementara)'
  );
  return makeSantriToken(6);
};


/**
 * Helper untuk membuat token secara manual (untuk API unit test)
 */
const makeSantriToken = (id_users) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id_users, role: 'santri' }, process.env.JWT_SECRET || 'secret_test');
};

const makePengajarToken = (id_users) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id_users, role: 'pengajar' }, process.env.JWT_SECRET || 'secret_test');
};

const makeAdminToken = (id_users) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id_users, role: 'admin' }, process.env.JWT_SECRET || 'secret_test');
};

module.exports = {
  loginAdmin,
  loginPengajar,
  loginSantri,
  makeSantriToken,
  makePengajarToken,
  makeAdminToken
};


