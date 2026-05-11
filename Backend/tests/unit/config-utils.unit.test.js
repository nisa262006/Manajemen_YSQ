/**
 * Unit tests for src/utils/generateToken.js and src/config/db.js
 */

process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PORT = '5432';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';

const jwt = require('jsonwebtoken');

// ======================== generateToken ========================

describe('utils/generateToken.js', () => {
  let generateToken;

  beforeAll(() => {
    generateToken = require('../../src/utils/generateToken');
  });

  test('returns a valid JWT string', () => {
    const token = generateToken(42);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
  });

  test('JWT payload contains the userId as id', () => {
    const token = generateToken(99);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(99);
  });

  test('token expires in 7 days', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = generateToken(1);
    const decoded = jwt.decode(token);
    const sevenDaysInSec = 7 * 24 * 60 * 60;
    expect(decoded.exp - decoded.iat).toBe(sevenDaysInSec);
  });
});

// ======================== db.js pool events ========================

describe('config/db.js', () => {
  let pool;
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeAll(() => {
    // We need to get the pool module to test its events
    // Reset modules so we get a fresh instance
    jest.resetModules();

    // Mock pg.Pool to control events
    jest.mock('pg', () => {
      const EventEmitter = require('events');
      const mockPool = new EventEmitter();
      mockPool.query = jest.fn();
      mockPool.connect = jest.fn();
      const MockPool = jest.fn(() => mockPool);
      return { Pool: MockPool };
    });

    pool = require('../../src/config/db');
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  test('pool is exported as an object with query method', () => {
    expect(pool).toBeDefined();
    expect(pool).toHaveProperty('query');
  });

  test('pool "connect" event logs a success message', () => {
    pool.emit('connect');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PostgreSQL connected'));
  });

  test('pool "error" event logs error to console.error', () => {
    const testError = new Error('Connection dropped');
    pool.emit('error', testError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('PostgreSQL error:'),
      testError
    );
  });
});
