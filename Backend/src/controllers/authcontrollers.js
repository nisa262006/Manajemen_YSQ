const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("REQUEST MASUK: ", email);

    // Query user dari database
    const result = await db.query(
      'SELECT * FROM "users" WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    const user = result.rows[0];

    // Cocokkan password hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    // Buat JWT token menggunakan kolom id_users
    const token = jwt.sign(
      {
        id_users: user.id_users,
        role: user.role, 
        status: user.status_user 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Response ke FE
    res.json({
      message: "Login berhasil",
      token,
      role: user.role,
      userId: user.id_users,
      status: user.status_user
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
