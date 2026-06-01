/**
 * globalSetup.js - dijalankan SEKALI sebelum seluruh test suite
 * Load .env.test agar DB_HOST=localhost & DB_PORT=5433 tersedia
 * untuk functional test & integration test yang butuh DB real.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test') });

module.exports = async () => {
  // Env sudah ter-load, tidak ada aksi lain yang diperlukan
  process.env.NODE_ENV = 'test';
};