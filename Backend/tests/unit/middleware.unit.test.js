/**
 * Unit tests for src/middleware/auth.js, role.js, upload.js
 * Uses mocking to avoid real DB calls.
 */

// ======================== AUTH MIDDLEWARE ========================

jest.mock('../../src/config/db', () => ({
  query: jest.fn()
}));

const jwt = require('jsonwebtoken');
const db = require('../../src/config/db');

// Set a test secret
process.env.JWT_SECRET = 'test-secret-key';

const auth = require('../../src/middleware/auth');

function mockReqRes(headers = {}) {
  const req = { headers, user: null };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data)  { this.body = data; return this; }
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('middleware/auth.js - verifyToken', () => {
  beforeEach(() => jest.clearAllMocks());

  test('no Authorization header → 401', async () => {
    const { req, res, next } = mockReqRes({});
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
    expect(next).not.toHaveBeenCalled();
  });

  test('header without Bearer prefix → 401', async () => {
    const { req, res, next } = mockReqRes({ authorization: 'Token abc' });
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('invalid token → 401', async () => {
    const { req, res, next } = mockReqRes({ authorization: 'Bearer invalidtoken' });
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid or expired token');
  });

  test('valid token but user not found → 401', async () => {
    const token = jwt.sign({ id_users: 999 }, process.env.JWT_SECRET);
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('User not found');
  });

  test('valid token but user inactive → 403', async () => {
    const token = jwt.sign({ id_users: 1 }, process.env.JWT_SECRET);
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_users: 1, role: 'admin', status_user: 'nonaktif' }]
    });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Account inactive');
  });

  test('valid token, admin user, active → next()', async () => {
    const token = jwt.sign({ id_users: 1 }, process.env.JWT_SECRET);
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_users: 1, role: 'admin', status_user: 'aktif' }]
    });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id_users: 1, role: 'admin' });
  });

  test('valid token, santri active → next()', async () => {
    const token = jwt.sign({ id_users: 2 }, process.env.JWT_SECRET);
    // First query: users table
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_users: 2, role: 'santri', status_user: 'aktif' }]
    });
    // Second query: santri table
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ status: 'aktif' }]
    });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('santri');
  });

  test('valid token, santri not found in santri table → 403', async () => {
    const token = jwt.sign({ id_users: 2 }, process.env.JWT_SECRET);
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_users: 2, role: 'santri', status_user: 'aktif' }]
    });
    db.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Santri inactive');
  });

  test('valid token, santri status nonaktif → 403', async () => {
    const token = jwt.sign({ id_users: 2 }, process.env.JWT_SECRET);
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_users: 2, role: 'santri', status_user: 'aktif' }]
    });
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ status: 'nonaktif' }]
    });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Santri inactive');
  });

  test('valid token, pengajar role → next() (no santri check)', async () => {
    const token = jwt.sign({ id_users: 3 }, process.env.JWT_SECRET);
    db.query.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ id_users: 3, role: 'pengajar', status_user: 'aktif' }]
    });

    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    await auth.verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe('pengajar');
  });
});

describe('middleware/auth.js - role guards', () => {
  test('onlyAdmin - admin role → next()', () => {
    const req = { user: { role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    auth.onlyAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('onlyAdmin - non-admin → 403', () => {
    const req = { user: { role: 'santri' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    auth.onlyAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('onlySantri - santri role → next()', () => {
    const req = { user: { role: 'santri' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    auth.onlySantri(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('onlySantri - non-santri → 403', () => {
    const req = { user: { role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    auth.onlySantri(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('onlyPengajar - pengajar role → next()', () => {
    const req = { user: { role: 'pengajar' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    auth.onlyPengajar(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('onlyPengajar - non-pengajar → 403', () => {
    const req = { user: { role: 'santri' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    auth.onlyPengajar(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ======================== ROLE MIDDLEWARE ========================

describe('middleware/role.js', () => {
  // Isolate role.js from auth.js mock contamination
  let role;

  beforeAll(() => {
    jest.resetModules();
    role = require('../../src/middleware/role');
  });

  function buildRoleReqRes() {
    const res = {
      statusCode: 200,
      body: null,
      status(c) { this.statusCode = c; return this; },
      json(d) { this.body = d; return this; }
    };
    return res;
  }

  test('verifyToken - no Authorization → 401', () => {
    const req = { headers: {} };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.verifyToken(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyToken - invalid token → 401', () => {
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.verifyToken(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  test('verifyToken - valid token → next(), req.user set', () => {
    const token = jwt.sign({ id_users: 1, role: 'admin' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` }, user: null };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id_users: 1, role: 'admin' });
  });

  test('onlyAdmin - admin → next()', () => {
    const req = { user: { role: 'admin' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.onlyAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('onlyAdmin - wrong role → 403', () => {
    const req = { user: { role: 'santri' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.onlyAdmin(req, res, next);
    expect(res.statusCode).toBe(403);
  });

  test('onlyPengajar - pengajar → next()', () => {
    const req = { user: { role: 'pengajar' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.onlyPengajar(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('onlyPengajar - wrong role → 403', () => {
    const req = { user: { role: 'admin' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.onlyPengajar(req, res, next);
    expect(res.statusCode).toBe(403);
  });

  test('onlySantri - santri → next()', () => {
    const req = { user: { role: 'santri' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.onlySantri(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('onlySantri - wrong role → 403', () => {
    const req = { user: { role: 'admin' } };
    const res = buildRoleReqRes();
    const next = jest.fn();
    role.onlySantri(req, res, next);
    expect(res.statusCode).toBe(403);
  });
});

// ======================== UPLOAD MIDDLEWARE ========================

describe('middleware/upload.js', () => {
  let upload;
  const fs = require('fs');
  const path = require('path');

  beforeAll(() => {
    jest.resetModules();
    upload = require('../../src/middleware/upload');
  });

  function simulateDestination(originalUrl) {
    return new Promise((resolve, reject) => {
      const req = { originalUrl };
      const file = {};
      const cb = (err, dir) => {
        if (err) reject(err);
        else resolve(dir);
      };
      // Access the diskStorage destination function
      upload.storage._handleFile({ originalUrl }, file, (err, info) => {});
      // We call the destination directly via internal storage
      upload.storage.getDestination(req, file, cb);
    });
  }

  test('upload module exports a multer instance', () => {
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe('function');
    expect(typeof upload.array).toBe('function');
  });

  test('storage destination: /materi URL → materi subfolder', (done) => {
    const req = { originalUrl: '/api/tugas-media/materi/upload' };
    const file = {};
    upload.storage.getDestination(req, file, (err, dest) => {
      expect(err).toBeNull();
      expect(dest).toContain('materi');
      done();
    });
  });

  test('storage destination: /tugas URL → tugas subfolder', (done) => {
    const req = { originalUrl: '/api/tugas-media/tugas/upload' };
    const file = {};
    upload.storage.getDestination(req, file, (err, dest) => {
      expect(err).toBeNull();
      expect(dest).toContain('tugas');
      done();
    });
  });

  test('storage destination: /submit URL → submit subfolder', (done) => {
    const req = { originalUrl: '/api/tugas-media/tugas/1/submit' };
    const file = {};
    upload.storage.getDestination(req, file, (err, dest) => {
      expect(err).toBeNull();
      expect(dest).toContain('submit');
      done();
    });
  });

  test('storage destination: unknown URL → root uploads dir', (done) => {
    const req = { originalUrl: '/api/some/other/route' };
    const file = {};
    upload.storage.getDestination(req, file, (err, dest) => {
      expect(err).toBeNull();
      // Should not contain tugas, materi, or submit
      const basename = path.basename(dest);
      expect(['materi', 'tugas', 'submit']).not.toContain(basename);
      done();
    });
  });

  test('storage filename: adds timestamp + sanitized name', (done) => {
    const req = {};
    const file = { originalname: 'my file.pdf' };
    upload.storage.getFilename(req, file, (err, name) => {
      expect(err).toBeNull();
      expect(name).toMatch(/^\d+-my_file\.pdf$/);
      done();
    });
  });
});
