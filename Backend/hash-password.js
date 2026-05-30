const bcrypt = require('bcrypt');
const db = require('./src/config/db');

async function updateAdminPassword() {
  try {
    // 1. Generate hash untuk 'admin123'
    const plainPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    console.log(`Berhasil membuat hash untuk '${plainPassword}': ${hashedPassword}`);

    // 2. Update ke tabel users untuk admin
    const result = await db.query(
      `UPDATE users SET password = $1 WHERE email = 'admin@ysq.id' RETURNING id, email`,
      [hashedPassword]
    );

    if (result.rowCount > 0) {
      console.log(`✅ Password untuk ${result.rows[0].email} berhasil dienkripsi di database!`);
    } else {
      console.log(`⚠️ User admin@ysq.id tidak ditemukan di database.`);
    }

    // (Opsional) Mengupdate user lain yang mungkin masih plain text 'admin123'
    await db.query(
      `UPDATE users SET password = $1 WHERE password = 'admin123'`,
      [hashedPassword]
    );
    console.log(`✅ Seluruh password plain-text 'admin123' lainnya telah dienkripsi.`);

    process.exit(0);
  } catch (err) {
    console.error("Terjadi kesalahan:", err);
    process.exit(1);
  }
}

updateAdminPassword();
