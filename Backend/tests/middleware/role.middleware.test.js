const { verifyToken, onlyAdmin, onlyPengajar, onlySantri } = require('../../src/middleware/role');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Role Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    test('❌ Gagal - Token tidak ditemukan', () => {
      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token tidak ditemukan' });
    });

    test('❌ Gagal - Token tidak valid', () => {
      req.headers.authorization = 'Bearer invalidtoken';
      jwt.verify.mockImplementation(() => { throw new Error('Invalid'); });
      
      verifyToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token tidak valid' });
    });

    test('✅ Sukses - Token valid', () => {
      req.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ id_users: 1, role: 'admin' });
      
      verifyToken(req, res, next);
      
      expect(req.user).toEqual({ id_users: 1, role: 'admin' });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('onlyAdmin', () => {
    test('❌ Gagal - Bukan admin', () => {
      req.user = { role: 'santri' };
      onlyAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Akses khusus admin' });
    });

    test('✅ Sukses - Admin', () => {
      req.user = { role: 'admin' };
      onlyAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('onlyPengajar', () => {
    test('❌ Gagal - Bukan pengajar', () => {
      req.user = { role: 'admin' };
      onlyPengajar(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Akses khusus pengajar' });
    });

    test('✅ Sukses - Pengajar', () => {
      req.user = { role: 'pengajar' };
      onlyPengajar(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('onlySantri', () => {
    test('❌ Gagal - Bukan santri', () => {
      req.user = { role: 'pengajar' };
      onlySantri(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Akses khusus santri' });
    });

    test('✅ Sukses - Santri', () => {
      req.user = { role: 'santri' };
      onlySantri(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
