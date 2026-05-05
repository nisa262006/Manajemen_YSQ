const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.registerSantri = async (req, res) => {
  const { username, password, nama, kategori_id, no_hp, alamat, jenis_kelamin, tgl_lahir } = req.body;

  if (!username || !password || !nama || !kategori_id) {
    return res.status(400).json({ message: "username, password, nama, kategori_id wajib" });
  }

  try {
    // cek username unik
    const exists = await pool.query("SELECT id FROM users WHERE username=$1", [username]);
    if (exists.rows.length) return res.status(400).json({ message: "Username sudah dipakai" });

    const hash = await bcrypt.hash(password, 10);

    const userRes = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1,$2,'santri')
       RETURNING id`,
      [username, hash]
    );

    const userId = userRes.rows[0].id;

    const santriRes = await pool.query(
      `INSERT INTO santri (user_id, kategori_id, nama, no_hp, alamat, jenis_kelamin, tgl_lahir, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Menunggu')
       RETURNING id`,
      [userId, kategori_id, nama, no_hp || null, alamat || null, jenis_kelamin || null, tgl_lahir || null]
    );

    res.status(201).json({
      message: "Registrasi berhasil, menunggu verifikasi admin",
      santri_id: santriRes.rows[0].id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal register santri" });
  }
};
