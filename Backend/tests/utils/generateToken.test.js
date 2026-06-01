const generateToken = require('../../src/utils/generateToken');
const jwt = require('jsonwebtoken');

describe('generateToken', () => {
  test('✅ Sukses - Menghasilkan token JWT', () => {
    process.env.JWT_SECRET = 'test_secret';
    const token = generateToken(1);
    
    expect(typeof token).toBe('string');
    
    const decoded = jwt.verify(token, 'test_secret');
    expect(decoded.id).toBe(1);
    expect(decoded.exp).toBeDefined();
  });
});
