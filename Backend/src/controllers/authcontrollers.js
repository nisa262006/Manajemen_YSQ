const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; 
    // identifier = username ATAU email

    console.log("REQUEST MASUK LOGIN:", identifier);

    // Query user berdasarkan username ATAU email
    const result = await db.query(
      `SELECT * FROM "users" 
       WHERE username = $1 OR email = $1`,
      [identifier]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Username/Email atau password salah" });
    }

    const user = result.rows[0];

    // Periksa password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Username/Email atau password salah" });
    }

    // Buat token baru
    const token = jwt.sign(
      {
        id_users: user.id_users,
        username: user.username, // ditambahkan
        role: user.role,
        status_user: user.status_user
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login berhasil",
      token,
      userId: user.id_users,
      username: user.username,
      role: user.role,
      status: user.status_user
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};


// ==================== GET ME ====================
exports.getMe = async (req, res) => {
  try {
    const userId = req.users.id_users; // dari middleware JWT

    const result = await db.query(
      `SELECT id_users, username, nama_users, email, role, status_user 
       FROM "users" WHERE id_users = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error("GETME ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
