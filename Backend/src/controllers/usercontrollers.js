const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.registerSantri = async (req, res) => {
  const { username, password, nama, kategori_id } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    // Buat user
    const user = await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1,$2,'santri') RETURNING id`,
      [username, hash]
    );

    // Buat data santri
    await pool.query(
      `INSERT INTO santri (user_id, nama, kategori_id, status)
       VALUES ($1,$2,$3,'Menunggu')`,
      [user.rows[0].id, nama, kategori_id]
    );

    res.json({ message: "Registrasi berhasil, menunggu verifikasi admin" });

  } catch (err) {
    res.status(500).json({ message: "Gagal register santri", error: err });
  }
};
