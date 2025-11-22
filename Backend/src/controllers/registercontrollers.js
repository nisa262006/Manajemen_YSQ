const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* =========================================
   LOGIN
========================================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN REQUEST:", email);

    // Cari users berdasarkan email
    const result = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    const users = result.rows[0];

    // Cek password hash
    const validPassword = await bcrypt.compare(password, users.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    // Buat JWT token berdasarkan id_users
    const token = jwt.sign(
      {
        id_users: users.id_users,
        role: users.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Kirim response ke frontend
    res.json({
      message: "Login berhasil",
      token,
      role: users.roles,
      userId: users.id_users
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};


/* =========================================
   GET PROFILE UNTUK DASHBOARD (ADMIN / SANTRI)
========================================= */
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
          users.id_users,
          users.email,
          users.role,
          santri.nama,
          santri.nis
       FROM users
       LEFT JOIN santri ON santri.id_users = users.id_users
       WHERE users.id_users = $1`,
      [req.users.id_users]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};
