const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id_user: user.id_user, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login berhasil",
      token,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: err });
  }
};
