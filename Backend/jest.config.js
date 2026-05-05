/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  detectOpenHandles: true,
  // Pastikan dotenv .env.test di-load sebelum semua test runner
  globalSetup: './tests/setup/globalSetup.js',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js'
  ]
};
