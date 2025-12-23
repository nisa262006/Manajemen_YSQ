const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log("REQUEST MASUK LOGIN:", identifier);

    const result = await db.query(
      `
      SELECT 
        u.*,
        s.status AS status_santri
      FROM users u
      LEFT JOIN santri s ON u.id_users = s.id_users
      WHERE u.username = $1 OR u.email = $1
      LIMIT 1
      `,
      [identifier]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Username/Email atau password salah"
      });
    }

    const user = result.rows[0];

    // 🔒 BLOK USER NONAKTIF
    if (user.status_user !== "aktif") {
      return res.status(403).json({
        message: "Akun Anda tidak aktif. Hubungi admin."
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Username/Email atau password salah"
      });
    }

    const token = jwt.sign(
      {
        id_users: user.id_users,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login berhasil",
      token,
      userId: user.id_users,
      role: user.role
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Terjadi kesalahan server"
    });
  }
};

// ==================== GET ME ====================
exports.getMe = async (req, res) => {
  try {
    const userId = req.users.id_users;

    const result = await db.query(
      `
      SELECT id_users, username, nama_users, email, role, status_user
      FROM users
      WHERE id_users = $1
      `,
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

// ==================== CREATE USER AFTER SANTRI ACCEPTED ====================
exports.createUserAfterSantriAccepted = async (req, res) => {
  try {
    const { id_santri } = req.body;

    const santriData = await db.query(
      `
      SELECT nis, nama_santri, email, kategori
      FROM santri
      WHERE id_santri = $1
      `,
      [id_santri]
    );

    if (santriData.rowCount === 0) {
      return res.status(404).json({ message: "Santri tidak ditemukan" });
    }

    const { nis, nama_santri, email, kategori } = santriData.rows[0];

    const cleanName = nama_santri.replace(/\s+/g, "").toLowerCase();
    const username = `${nis}_${cleanName}`;
    const rawPassword = `${cleanName}123`;

    const password_hash = await bcrypt.hash(rawPassword, 10);

    const insertUser = await db.query(
      `
      INSERT INTO users (email, username, password_hash, role, status_user)
      VALUES ($1, $2, $3, 'santri', 'aktif')
      RETURNING id_users, username
      `,
      [email, username, password_hash]
    );

    return res.json({
      message: "Pendaftar berhasil diterima",
      id_users: insertUser.rows[0].id_users,
      nis,
      username,
      kategori,
      password_default: rawPassword
    });

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ==================== FORGOT PASSWORD ====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    const userCheck = await db.query(
      `SELECT id_users FROM users WHERE email = $1`,
      [email]
    );

    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    const user = userCheck.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expired_at = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `DELETE FROM password_reset_tokens WHERE id_users = $1`,
      [user.id_users]
    );

    await db.query(
      `
      INSERT INTO password_reset_tokens (id_users, token, expired_at)
      VALUES ($1, $2, $3)
      `,
      [user.id_users, token, expired_at]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: '"YSQ Bogor" <noreply@ysqbogor.com>',
      to: email,
      subject: "Reset Password - YSQ Bogor",
      html: `
        <p>Klik link berikut untuk reset password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Link berlaku 10 menit.</p>
      `
    });

    res.json({ message: "Link reset password telah dikirim ke email Anda" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res) => {
  const client = await db.connect();

  try {
    const { token, password, confirmPassword } = req.body;

    if (!token)
      return res.status(400).json({ message: "Token diperlukan" });
    if (!password || !confirmPassword)
      return res.status(400).json({ message: "Password wajib diisi" });
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password tidak sama" });

    await client.query("BEGIN");

    const tokenCheck = await client.query(
      `
      SELECT id_users, expired_at
      FROM password_reset_tokens
      WHERE token = $1
      FOR UPDATE
      `,
      [token]
    );

    if (tokenCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Token tidak valid" });
    }

    if (new Date() > new Date(tokenCheck.rows[0].expired_at)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Token expired" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id_users = $2`,
      [password_hash, tokenCheck.rows[0].id_users]
    );

    await client.query(
      `DELETE FROM password_reset_tokens WHERE id_users = $1`,
      [tokenCheck.rows[0].id_users]
    );

    await client.query("COMMIT");

    res.json({ message: "Password berhasil direset, silakan login kembali" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  } finally {
    client.release();
  }
};
