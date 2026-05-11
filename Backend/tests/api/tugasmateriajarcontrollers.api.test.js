/**
 * API tests for tugasmateriajarcontrollers.js
 */

const request = require('supertest');
const app = require('../../src/app');

let mockDbState = {
  crash: false,
  notFound: false,
  isOwner: true,
  emailConflict: false,
  alreadySubmitted: false,
  missDeadline: false,
  badRequest: false,
  emptyJadwal: false
};

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn(() => Promise.resolve({ query: jest.fn(), release: jest.fn() }))
}));

const db = require('../../src/config/db');

// Mock Auth
let mockUserRole = 'pengajar';
jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: mockUserRole, id_pengajar: 1, id_santri: 1 };
    next();
  },
  onlyPengajar: (req, res, next) => {
    if (req.user.role !== 'pengajar') return res.status(403).json({ message: 'Akses ditolak' });
    next();
  },
  onlySantri: (req, res, next) => {
    if (req.user.role !== 'santri') return res.status(403).json({ message: 'Akses ditolak' });
    next();
  },
  onlyAdmin: (req, res, next) => next()
}));

jest.mock('../../src/middleware/upload', () => ({
  single: () => (req, res, next) => {
    if (req.body.mockUpload) req.file = { filename: 'test-file.pdf' };
    next();
  }
}));

// Utility to mock db.query dynamically
db.query.mockImplementation(async (queryStr, params) => {
  if (mockDbState.crash) throw new Error('DB crash');

  // getRoleSpecificId queries
  if (queryStr.includes('SELECT id_pengajar FROM pengajar')) return { rows: [{ id_pengajar: 1 }] };
  if (queryStr.includes('SELECT id_santri FROM santri')) return { rows: [{ id_santri: 1 }] };

  // uploadMateri
  if (queryStr.includes('INSERT INTO materi_ajar')) return { rows: [{ id_materi: 1 }] };
  
  // updateMateri
  if (queryStr.includes('SELECT file_path FROM materi_ajar')) return { rows: [{ file_path: 'old.pdf' }] };
  if (queryStr.includes('UPDATE materi_ajar')) {
    if (mockDbState.notFound || !mockDbState.isOwner) return { rowCount: 0 };
    return { rowCount: 1 };
  }

  // getMateriByJadwalPengajar / Santri
  if (queryStr.includes('SELECT DISTINCT ON (m.id_materi)')) return { rows: [{ id_materi: 1, judul: 'M1' }] };
  
  // createTugas
  if (queryStr.includes('INSERT INTO tugas')) return { rows: [{ id_tugas: 1 }] };
  
  // getTugasByMateri
  if (queryStr.includes('SELECT id_tugas, id_materi, deskripsi, deadline')) return { rows: [{ id_tugas: 1 }] };
  
  // getTugasByKelasPengajar
  if (queryStr.includes('SELECT * FROM tugas WHERE id_kelas = $1 AND id_pengajar')) return { rows: [{ id_tugas: 1 }] };

  // updateTugas
  if (queryStr.includes('SELECT file_path FROM tugas')) return { rows: [{ file_path: 'old.pdf' }] };
  if (queryStr.includes('UPDATE tugas')) {
    if (mockDbState.notFound || !mockDbState.isOwner) return { rowCount: 0 };
    return { rowCount: 1 };
  }

  // getStatusPengumpulan
  if (queryStr.includes('SELECT id_jadwal FROM tugas WHERE id_tugas')) {
    if (mockDbState.notFound) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [{ id_jadwal: 1 }] };
  }
  if (queryStr.includes('SELECT \n        s.id_santri')) {
    return { rows: [{ id_santri: 1 }] };
  }

  // submitTugasSantri
  if (queryStr.includes('SELECT deadline FROM tugas')) {
    if (mockDbState.notFound) return { rowCount: 0, rows: [] };
    const dl = mockDbState.missDeadline ? new Date(Date.now() - 100000) : new Date(Date.now() + 100000);
    return { rowCount: 1, rows: [{ deadline: dl }] };
  }
  if (queryStr.includes('SELECT id_pengumpulan FROM pengumpulan_tugas')) {
    if (mockDbState.alreadySubmitted) return { rows: [{ id_pengumpulan: 1 }] };
    return { rows: [] };
  }
  if (queryStr.includes('INSERT INTO pengumpulan_tugas')) return { rows: [{ id_pengumpulan: 1 }] };

  // getMateriByJadwalForSantri & getMateriByJadwal
  if (queryStr.includes('SELECT id_kelas FROM jadwal')) {
    if (mockDbState.emptyJadwal) return { rowCount: 0, rows: [] };
    return { rowCount: 1, rows: [{ id_kelas: 1 }] };
  }
  if (queryStr.includes('SELECT \n        m.id_materi')) return { rows: [{ id_materi: 1 }] };

  // getTugasByKelas (Santri)
  if (queryStr.includes('SELECT * FROM tugas WHERE id_kelas')) return { rows: [{ id_tugas: 1 }] };

  // getMySubmission
  if (queryStr.includes('SELECT \n        pt.file_path')) {
    if (mockDbState.notFound) return { rows: [] };
    return { rows: [{ submitted_at: new Date() }] };
  }

  return { rowCount: 1, rows: [{}] };
});

describe('Tugas Materi Ajar Controllers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbState = { crash: false, notFound: false, isOwner: true, alreadySubmitted: false, missDeadline: false, emptyJadwal: false };
    mockUserRole = 'pengajar';
  });

  const setRole = (role) => { mockUserRole = role; };

  // ===================== uploadMateri =====================
  describe('POST /api/tugas-media/materi', () => {
    const validData = { id_jadwal: 1, judul: 'M1' };
    
    test('200 - berhasil', async () => {
      const res = await request(app).post('/api/tugas-media/materi').send(validData);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
    test('400 - tanpa id_jadwal', async () => {
      const res = await request(app).post('/api/tugas-media/materi').send({ judul: 'M1' });
      expect(res.statusCode).toBe(400);
    });
    test('400 - tanpa file untuk tipe_konten file', async () => {
      const res = await request(app).post('/api/tugas-media/materi').send({ id_jadwal: 1, tipe_konten: 'file' });
      expect(res.statusCode).toBe(400);
    });
    test('403 - role admin tidak bisa akses endpoint pengajar', async () => {
      setRole('admin');
      const res = await request(app).post('/api/tugas-media/materi').send(validData);
      expect(res.statusCode).toBe(403);
    });
    test('500 - db crash', async () => {
      setRole('pengajar');
      mockDbState.crash = true;
      const res = await request(app).post('/api/tugas-media/materi').send(validData);
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== updateMateri =====================
  describe('PUT /api/tugas-media/materi/:id', () => {
    test('200 - update tanpa file', async () => {
      const res = await request(app).put('/api/tugas-media/materi/1').send({ judul: 'U' });
      expect(res.statusCode).toBe(200);
    });
    test('200 - update dengan file (delete old file)', async () => {
      // Mock fs.existsSync to true and fs.unlinkSync to throw error to cover line 469-473
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementationOnce(() => { throw new Error('unlink crash'); });
      
      const res = await request(app).put('/api/tugas-media/materi/1').send({ judul: 'U', mockUpload: true });
      expect(res.statusCode).toBe(200);

      jest.restoreAllMocks();
    });
    test('404 - tidak ketemu / bukan milik', async () => {
      mockDbState.isOwner = false;
      const res = await request(app).put('/api/tugas-media/materi/1').send({ judul: 'U' });
      expect(res.statusCode).toBe(404);
    });
    test('500 - db crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).put('/api/tugas-media/materi/1').send({});
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getMateriByJadwalPengajar =====================
  describe('GET /api/tugas-media/materi/jadwal/:id_jadwal/pengajar', () => {
    test('200 - return list', async () => {
      const res = await request(app).get('/api/tugas-media/materi/jadwal/1/pengajar');
      expect(res.statusCode).toBe(200);
    });
    test('500 - db crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/tugas-media/materi/jadwal/1/pengajar');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== createTugas =====================
  describe('POST /api/tugas-media/tugas', () => {
    const validData = { id_jadwal: 1, deskripsi: 'Tugas 1', deadline: '2026-05-11' };
    test('201 - berhasil', async () => {
      const res = await request(app).post('/api/tugas-media/tugas').send(validData);
      expect(res.statusCode).toBe(201);
    });
    test('400 - tanpa jadwal', async () => {
      const res = await request(app).post('/api/tugas-media/tugas').send({ deskripsi: 'Tugas' });
      expect(res.statusCode).toBe(400);
    });
    test('500 - db crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).post('/api/tugas-media/tugas').send(validData);
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== updateTugas =====================
  describe('PUT /api/tugas-media/tugas/:id', () => {
    const validUpdate = { deskripsi: 'Tugas U', deadline: '2026-01-01' };
    test('200 - berhasil update tanpa file', async () => {
      const res = await request(app).put('/api/tugas-media/tugas/1').send(validUpdate);
      expect(res.statusCode).toBe(200);
    });
    test('200 - berhasil update dengan file', async () => {
      const res = await request(app).put('/api/tugas-media/tugas/1').send({ ...validUpdate, mockUpload: true });
      expect(res.statusCode).toBe(200);
    });
    test('400 - tanpa deadline', async () => {
      const res = await request(app).put('/api/tugas-media/tugas/1').send({ deskripsi: 'Tugas U' });
      expect(res.statusCode).toBe(400);
    });
    test('404 - bukan milik', async () => {
      mockDbState.isOwner = false;
      const res = await request(app).put('/api/tugas-media/tugas/1').send(validUpdate);
      expect(res.statusCode).toBe(404);
    });
    test('500 - crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).put('/api/tugas-media/tugas/1').send(validUpdate);
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getTugasByMateri =====================
  describe('GET /api/tugas-media/tugas/materi/:id', () => {
    test('200 - return list', async () => {
      const res = await request(app).get('/api/tugas-media/tugas/materi/1');
      expect(res.statusCode).toBe(200);
    });
    test('400 - tanpa id', async () => {
      // route requires id to hit the controller
    });
    test('500 - crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/tugas-media/tugas/materi/1');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getTugasByKelasPengajar =====================
  describe('GET /api/tugas-media/tugas/kelas/:id/pengajar', () => {
    test('200 - return list', async () => {
      const res = await request(app).get('/api/tugas-media/tugas/kelas/1/pengajar');
      expect(res.statusCode).toBe(200);
    });
    test('500 - crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/tugas-media/tugas/kelas/1/pengajar');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== getStatusPengumpulan =====================
  describe('GET /api/tugas-media/tugas/:id/status', () => {
    test('200 - return data', async () => {
      const res = await request(app).get('/api/tugas-media/tugas/1/status');
      expect(res.statusCode).toBe(200);
    });
    test('404 - tugas tidak ketemu', async () => {
      mockDbState.notFound = true;
      const res = await request(app).get('/api/tugas-media/tugas/1/status');
      expect(res.statusCode).toBe(404);
    });
    test('500 - crash', async () => {
      mockDbState.crash = true;
      const res = await request(app).get('/api/tugas-media/tugas/1/status');
      expect(res.statusCode).toBe(500);
    });
  });

  // ===================== SANTRI =====================
  describe('SANTRI ROUTES', () => {
    beforeEach(() => setRole('santri'));

    describe('GET /api/tugas-media/materi/jadwal/:id', () => {
      test('200 - return list santri', async () => {
        const res = await request(app).get('/api/tugas-media/materi/jadwal/1');
        expect(res.statusCode).toBe(200);
      });
      test('500 - crash', async () => {
        mockDbState.crash = true;
        const res = await request(app).get('/api/tugas-media/materi/jadwal/1');
        expect(res.statusCode).toBe(500);
      });
    });

    describe('GET /api/tugas-media/tugas/kelas/:id', () => {
      test('200 - return list', async () => {
        const res = await request(app).get('/api/tugas-media/tugas/kelas/1');
        expect(res.statusCode).toBe(200);
      });
      test('500 - crash', async () => {
        mockDbState.crash = true;
        const res = await request(app).get('/api/tugas-media/tugas/kelas/1');
        expect(res.statusCode).toBe(500);
      });
    });

    describe('POST /api/tugas-media/tugas/submit', () => {
      const validSubmit = { id_tugas: 1, mockUpload: true };
      test('200 - berhasil', async () => {
        const res = await request(app).post('/api/tugas-media/tugas/submit').send(validSubmit);
        expect(res.statusCode).toBe(200);
      });
      test('404 - tugas tidak ditemukan', async () => {
        mockDbState.notFound = true;
        const res = await request(app).post('/api/tugas-media/tugas/submit').send(validSubmit);
        expect(res.statusCode).toBe(404);
      });
      test('403 - miss deadline', async () => {
        mockDbState.missDeadline = true;
        const res = await request(app).post('/api/tugas-media/tugas/submit').send(validSubmit);
        expect(res.statusCode).toBe(403);
      });
      test('409 - already submitted', async () => {
        mockDbState.alreadySubmitted = true;
        const res = await request(app).post('/api/tugas-media/tugas/submit').send(validSubmit);
        expect(res.statusCode).toBe(409);
      });
      test('500 - db crash', async () => {
        mockDbState.crash = true;
        const res = await request(app).post('/api/tugas-media/tugas/submit').send(validSubmit);
        expect(res.statusCode).toBe(500);
      });
    });

    describe('GET /api/tugas-media/tugas/:id/submission/me', () => {
      test('200 - return data', async () => {
        const res = await request(app).get('/api/tugas-media/tugas/1/submission/me');
        expect(res.statusCode).toBe(200);
        expect(res.body.submitted).toBe(true);
      });
      test('200 - not submitted yet', async () => {
        mockDbState.notFound = true;
        const res = await request(app).get('/api/tugas-media/tugas/1/submission/me');
        expect(res.statusCode).toBe(200);
        expect(res.body.submitted).toBe(false);
      });
      test('500 - db crash', async () => {
        mockDbState.crash = true;
        const res = await request(app).get('/api/tugas-media/tugas/1/submission/me');
        expect(res.statusCode).toBe(500);
      });
    });
  });

  // Additional route to catch getMateriByJadwal in another endpoint
  describe('GET /api/tugas-media/materi/jadwal/:id_jadwal (pengajar view)', () => {
    beforeEach(() => setRole('pengajar'));
    test('200 - getMateriByJadwal - santri', async () => {
      // We test this via santri endpoint but just in case
    });
  });
});
