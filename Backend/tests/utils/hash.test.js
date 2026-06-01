const bcrypt = require('bcrypt');

describe('Hash Config', () => {
  test('Should console log the hash', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    jest.isolateModules(() => {
      require('../../src/config/hash');
    });
    
    // Tunggu sedikit agar async fungsi hashPassword() di dalam hash.js selesai
    await new Promise(r => setTimeout(r, 500));
    
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
