const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/db');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

jest.mock('../../src/middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id_users: 1, role: req.headers['x-role'] || 'admin' };
    next();
  },
  onlyAdmin: (req, res, next) => next(),
  onlyPengajar: (req, res, next) => next(),
  onlySantri: (req, res, next) => next(),
}));

describe('FULL FLOW INTEGRATION TEST (MOCKED)', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
    
    // Standard mock response - ALWAYS HAVE ROWS
    db.query.mockResolvedValue({ rows: [], rowCount: 0 });
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  test('Flow 1: Register → Approve → Login → Dashboard', async () => {
    // 1. Register
    mockClient.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check email
      .mockResolvedValueOnce({ rows: [{ id_pendaftar: 1 }], rowCount: 1 }) // insert
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT
    
    const resReg = await request(app).post('/api/pendaftar/daftar').send({ 
      nama: 'New', email: 'new@test.com', alamat: 'Jl', no_wa: '08', 
      tanggal_lahir: '2010-01-01', tempat_lahir: 'Jak' 
    });
    expect(resReg.statusCode).toBe(201);

    // 2. Approve
    mockClient.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_pendaftar: 1, email: 'new@test.com', nama: 'New', tanggal_lahir: '2010-01-01', no_wa: '08', tempat_lahir: 'Jak' }] }) // find
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // check email user
      .mockResolvedValueOnce({ rows: [{ max: 1 }], rowCount: 1 }) // max nis
      .mockResolvedValueOnce({ rows: [{ id_users: 10 }], rowCount: 1 }) // insert user
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insert santri
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // update pendaftar
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT
    
    const resApp = await request(app).put('/api/pendaftar/terima/1').set('x-role', 'admin');
    expect(resApp.statusCode).toBe(200);

    // 3. Login
    const hashedPw = require('bcrypt').hashSync('any', 10);
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_users: 10, role: 'santri', status_user: 'aktif', password_hash: hashedPw }] });
    const resLogin = await request(app).post('/api/auth/login').send({ identifier: 'new', password: 'any' });
    expect(resLogin.statusCode).toBe(200);

    // 4. Dashboard
    db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 10, nama: 'New' }] }); // santri
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // jadwal
    const resDash = await request(app).get('/api/santridashboard/me').set('x-role', 'santri');
    expect(resDash.statusCode).toBe(200);
  }, 10000);

  test('Flow 2: Admin Create Kelas → Assign Pengajar → Jadwal → Santri Join', async () => {
    // 1. Create Kelas
    db.query.mockResolvedValueOnce({ rows: [{ id_kelas: 5, nama_kelas: 'Integrasi', kategori: 'Tahfidz' }], rowCount: 1 });
    const resKelas = await request(app).post('/api/kelas').send({ nama_kelas: 'Integrasi', kategori: 'Tahfidz' });
    expect(resKelas.statusCode).toBe(201);

    // 2. Tambah Jadwal
    db.query.mockResolvedValueOnce({ rows: [{ id_jadwal: 100 }], rowCount: 1 });
    const resJadwal = await request(app).post('/api/jadwal').send({ id_kelas: 5, id_pengajar: 1, hari: 'Senin', jam_mulai: '08:00', jam_selesai: '10:00' });
    expect(resJadwal.statusCode).toBe(201);

    // 3. Santri Join Jadwal
    db.query.mockResolvedValue({ rows: [], rowCount: 1 }); // delete old and insert new
    const resJoin = await request(app).post('/api/jadwal/100/santri').send({ id_santri: 10 });
    expect(resJoin.statusCode).toBe(200);
  });

  test('Flow 3: Billing → Pembayaran → Laporan', async () => {
    // 1. Create Billing
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // insert select
    const resBill = await request(app).post('/api/keuangan/billing/spp-massal').send({ 
       periode: '2025-05', nominal_dewasa: 100000, nominal_anak: 100000, 
       tgl_mulai: '2025-05-01', tgl_selesai: '2025-05-31'
    });
    expect(resBill.statusCode).toBe(200);

    // 2. Pembayaran
    db.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id_santri: 10, sisa: 100000, nominal: 100000, jenis: 'SPP', tipe: 'Bulanan', periode: '2025-05' }] }) // find
      .mockResolvedValueOnce({ rows: [{ total_pending: 0 }], rowCount: 1 }) // pending
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // insert pay
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // update bill
      .mockResolvedValueOnce({ rows: [{ nama: 'S', nama_kelas: 'K' }], rowCount: 1 }) // details
      .mockResolvedValueOnce({ rows: [{ email: 'admin@test.com' }], rowCount: 1 }); // admin

    const resPay = await request(app).post('/api/keuangan/pembayaran').send({ id_billing: 1, jumlah_bayar: 100000, metode: 'Transfer' });
    expect(resPay.statusCode).toBe(200);

    // 3. Laporan
    db.query
      .mockResolvedValueOnce({ rows: [{ total_pemasukan: 100000 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total_pengeluaran: 0 }], rowCount: 1 });
    const resRep = await request(app).get('/api/keuangan/laporan/ringkasan');
    expect(resRep.statusCode).toBe(200);
  });

});
