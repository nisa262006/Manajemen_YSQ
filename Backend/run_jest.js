const jest = require('jest');
jest.run(['--runInBand', 'tests/api/santricontrollers.api.test.js', '--json']).then(result => {
  const fs = require('fs');
  // jest writes json to stdout, we can't easily capture it. Let's just run without --json and capture stderr.
});
