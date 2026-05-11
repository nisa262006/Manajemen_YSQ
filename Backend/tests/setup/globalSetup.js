/**
 * globalSetup.js - dijalankan SEKALI sebelum seluruh test suite
 * Load .env.test agar DB_HOST=localhost & DB_PORT=5433 tersedia
 * untuk functional test & integration test yang butuh DB real.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });
const seedTestUsers = require('./seedTestUsers');

module.exports = async () => {
  // Env sudah ter-load
  process.env.NODE_ENV = 'test';
  
  // Seed data yang dibutuhkan functional test
  await seedTestUsers();

  // Tutup pool DB setelah seed selesai agar globalSetup tidak biarkan open handles
  const db = require('../../src/config/db');
  await db.end();
};
