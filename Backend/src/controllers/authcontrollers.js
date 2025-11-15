const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const q = "SELECT * FROM users WHERE username=$1";
    const result = await pool.query(q, [username]);
    if (result.rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Email atau password salah" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "4h" });
    res.json({ message: "Login berhasil", token, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
