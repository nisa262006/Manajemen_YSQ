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
  
  if (res.statusCode !== 200 || !res.body.token) {
    console.error("LOGIN ADMIN FAILED:", res.statusCode, res.body);
    throw new Error('Gagal login sebagai admin di authHelper');
  }

  return res.body.token;
};

/**
 * Helper untuk login pengajar dan mendapatkan token
 * @returns {Promise<string>} token
 */
const loginPengajar = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      identifier: 'YSQ25PGJ001_riska', // Berdasarkan default auth.api.test.js
      password: 'riska'
    });
  
  if (res.statusCode !== 200 || !res.body.token) {
    console.error("LOGIN PENGAJAR FAILED:", res.statusCode, res.body);
    throw new Error('Gagal login sebagai pengajar di authHelper');
  }

  return res.body.token;
};

/**
 * Helper untuk login santri dan mendapatkan token
 * @returns {Promise<string>} token
 */
const loginSantri = async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      identifier: 'YSQ26DWS011_santri1', // Berdasarkan default auth.api.test.js
      password: 'santri1123'
    });
  
  if (res.statusCode !== 200 || !res.body.token) {
    console.error("LOGIN SANTRI FAILED:", res.statusCode, res.body);
    throw new Error('Gagal login sebagai santri di authHelper');
  }

  return res.body.token;
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


