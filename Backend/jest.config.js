/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  detectOpenHandles: true,
  // Pastikan dotenv .env.test di-load sebelum semua test runner
  globalSetup: './tests/setup/globalSetup.js',
  globalTeardown: './tests/setup/globalTeardown.js',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/hash.js',
    '!src/config/testconnection.js'
  ],
  // Exclude Playwright E2E tests from Jest runs
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/'
  ]
};
