// playwright.config.js

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({

  // HANYA baca folder ui
  testDir: './tests/ui',

  // Browser yang dipakai
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  // buka browser keliatan
  use: {
    headless: false,
    baseURL: 'http://localhost:8000',
  },

});