const db = require('../../src/config/db');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Seeding test users...');
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed Admin admin2
    const hashAdmin = await bcrypt.hash('admin2', 10);
    await client.query(`
      INSERT INTO users (email, username, password_hash, role, status_user)
      VALUES ('admin2@ysq.com', 'admin2', $1, 'admin', 'aktif')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [hashAdmin]);

    const adminRes = await client.query("SELECT id_users FROM users WHERE username = 'admin2'");
    await client.query(`
      INSERT INTO admin (id_users, nama, email)
      VALUES ($1, 'Admin Test', 'admin2@ysq.com')
      ON CONFLICT (id_users) DO NOTHING
    `, [adminRes.rows[0].id_users]);

    // 2. Seed Pengajar riska
    const hashPengajar = await bcrypt.hash('riska', 10);
    await client.query(`
      INSERT INTO users (email, username, password_hash, role, status_user)
      VALUES ('riska@ysq.com', 'YSQ25PGJ001_riska', $1, 'pengajar', 'aktif')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [hashPengajar]);

    const pengajarRes = await client.query("SELECT id_users FROM users WHERE username = 'YSQ25PGJ001_riska'");
    await client.query(`
      INSERT INTO pengajar (id_users, nip, nama, email, status)
      VALUES ($1, 'YSQ25PGJ001', 'Riska Pengajar', 'riska@ysq.com', 'aktif')
      ON CONFLICT (id_users) DO NOTHING
    `, [pengajarRes.rows[0].id_users]);

    // 3. Seed Santri santri1
    const hashSantri = await bcrypt.hash('santri1123', 10);
    await client.query(`
      INSERT INTO users (email, username, password_hash, role, status_user)
      VALUES ('santri1@ysq.com', 'YSQ26DWS011_santri1', $1, 'santri', 'aktif')
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [hashSantri]);

    const santriRes = await client.query("SELECT id_users FROM users WHERE username = 'YSQ26DWS011_santri1'");
    await client.query(`
      INSERT INTO santri (id_users, nis, nama, email, kategori, status)
      VALUES ($1, 'YSQ26DWS011', 'Santri Test 1', 'santri1@ysq.com', 'anak', 'aktif')
      ON CONFLICT (id_users) DO NOTHING
    `, [santriRes.rows[0].id_users]);

    // 4. Seed Program & Kelas & Jadwal (Optional but good for integration tests)
    await client.query("INSERT INTO program (id_program, nama_program) VALUES (1, 'Tahsin') ON CONFLICT (id_program) DO NOTHING");
    await client.query("INSERT INTO kelas (id_kelas, id_program, nama_kelas, kategori) VALUES (1, 1, 'Tahsin Sesi 1', 'anak') ON CONFLICT (id_kelas) DO NOTHING");
    await client.query("INSERT INTO jadwal (id_jadwal, id_kelas, id_pengajar, hari, jam_mulai, jam_selesai, kapasitas) VALUES (1, 1, 1, 'Senin', '08:00', '10:00', 20) ON CONFLICT (id_jadwal) DO NOTHING");

    await client.query('COMMIT');
    console.log('Test users seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding test users:', err);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
