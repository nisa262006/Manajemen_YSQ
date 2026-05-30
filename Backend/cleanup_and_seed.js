process.env.NODE_ENV = 'test';
const db = require('./src/config/db');
const bcrypt = require('bcrypt');

async function safeQuery(sql, params) {
  try {
    return await db.query(sql, params || []);
  } catch(e) {
    console.warn('  ⚠ safeQuery skipped:', e.message);
    return { rows: [], rowCount: 0 };
  }
}

async function cleanup() {
  console.log('=== CLEANING UP TEST DATA ===');
  
  // Delete test users based on email (CASCADE will handle santri/pengajar/admin rows)
  const testEmails = [
    'admin@ysq.id',
    'riska@pengajar.ysq.id',
    'santri1@santri.ysq.id',
  ];

  for (const email of testEmails) {
    const u = await safeQuery(`SELECT id_users FROM users WHERE email = $1`, [email]);
    if (u.rowCount > 0) {
      const uid = u.rows[0].id_users;
      console.log(`  Deleting user: ${email} (id_users=${uid})`);
      // Cascade: admin/pengajar/santri rows linked via id_users FK will cascade delete
      // But also manually clear dependents to avoid FK violations if no CASCADE
      await safeQuery(`DELETE FROM santri_jadwal WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM santri_kelas WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM absensi WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM absensi_pengajar WHERE id_pengajar IN (SELECT id_pengajar FROM pengajar WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM pengumpulan_tugas WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM rapor_tahfidz WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM rapor_tahsin WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM progres_pembelajaran WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM billing_santri WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM pembayaran WHERE id_santri IN (SELECT id_santri FROM santri WHERE id_users=$1)`, [uid]);
      await safeQuery(`DELETE FROM santri WHERE id_users = $1`, [uid]);
      await safeQuery(`DELETE FROM pengajar WHERE id_users = $1`, [uid]);
      await safeQuery(`DELETE FROM admin WHERE id_users = $1`, [uid]);
      await safeQuery(`DELETE FROM users WHERE id_users = $1`, [uid]);
    }
  }

  // Also clean any "test" emails from previous runs
  await safeQuery(`DELETE FROM pendaftar WHERE nama ILIKE '%Test%' OR email ILIKE '%test%'`);
  
  // Clean santri with NISN/NIS starting with "123" (from e2e tests)
  await safeQuery(`
    DELETE FROM users WHERE id_users IN (
      SELECT id_users FROM santri WHERE nis LIKE '123%' OR nama LIKE 'Test Santri%' OR nama LIKE 'Updated Santri%'
    )
  `);

  console.log('✅ Cleanup done.\n');
}

async function seed() {
  console.log('=== SEEDING E2E TEST USERS ===');

  // ---- ADMIN ----
  try {
    const existing = await db.query(`SELECT id_users FROM users WHERE email = 'admin@ysq.id'`);
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      const newUser = await db.query(
        `INSERT INTO users (email, password_hash, role, status_user, username)
         VALUES ('admin@ysq.id', $1, 'admin', 'aktif', 'admin_e2e')
         RETURNING id_users`,
        [hash]
      );
      const uid = newUser.rows[0].id_users;
      await db.query(
        `INSERT INTO admin (id_users, nama, email, no_wa)
         VALUES ($1, 'Admin E2E', 'admin@ysq.id', '08100000000')`,
        [uid]
      );
      console.log('  ✅ Created admin: admin@ysq.id / admin123');
    } else {
      console.log('  ℹ admin@ysq.id already exists, skipping.');
    }
  } catch(e) {
    console.error('  ❌ Failed to seed admin:', e.message);
  }

  // ---- PENGAJAR ----
  try {
    const existing = await db.query(`SELECT id_users FROM users WHERE email = 'riska@pengajar.ysq.id'`);
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash('riska', 10);
      const newUser = await db.query(
        `INSERT INTO users (email, password_hash, role, status_user, username)
         VALUES ('riska@pengajar.ysq.id', $1, 'pengajar', 'aktif', 'riska_e2e')
         RETURNING id_users`,
        [hash]
      );
      const uid = newUser.rows[0].id_users;
      await db.query(
        `INSERT INTO pengajar (id_users, nama, status, nip)
         VALUES ($1, 'Riska', 'aktif', 'NIP001E2E')`,
        [uid]
      );
      console.log('  ✅ Created pengajar: riska@pengajar.ysq.id / riska');
    } else {
      console.log('  ℹ riska@pengajar.ysq.id already exists, skipping.');
    }
  } catch(e) {
    console.error('  ❌ Failed to seed pengajar:', e.message);
  }

  // ---- SANTRI ----
  try {
    const existing = await db.query(`SELECT id_users FROM users WHERE email = 'santri1@santri.ysq.id'`);
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash('santri1123', 10);
      const newUser = await db.query(
        `INSERT INTO users (email, password_hash, role, status_user, username)
         VALUES ('santri1@santri.ysq.id', $1, 'santri', 'aktif', 'santri1_e2e')
         RETURNING id_users`,
        [hash]
      );
      const uid = newUser.rows[0].id_users;
      await db.query(
        `INSERT INTO santri (id_users, nis, nama, status, kategori)
         VALUES ($1, 'YSQ26DWS012', 'Santri1 E2E', 'aktif', 'dewasa')`,
        [uid]
      );
      console.log('  ✅ Created santri: santri1@santri.ysq.id / santri1123');
    } else {
      console.log('  ℹ santri1@santri.ysq.id already exists, skipping.');
    }
  } catch(e) {
    console.error('  ❌ Failed to seed santri:', e.message);
  }

  // Show counts
  try {
    const c = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM santri) as santri,
        (SELECT COUNT(*) FROM pengajar) as pengajar,
        (SELECT COUNT(*) FROM jadwal) as jadwal,
        (SELECT COUNT(*) FROM kelas) as kelas
    `);
    console.log('\n✅ DB State after cleanup+seed:', c.rows[0]);
  } catch(e) {}

  console.log('\n=== DONE ===');
}

async function main() {
  try {
    await cleanup();
    await seed();
  } catch(e) {
    console.error('Fatal:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

main();
