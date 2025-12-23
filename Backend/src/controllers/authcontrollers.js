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

// ==================== FORGOT PASSWORD (FIXED & IMPROVED) ====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi" });
    }

    // 1. Cek email di database
    const userCheck = await db.query(
      `SELECT id_users FROM users WHERE email = $1`,
      [email]
    );

    // Mengembalikan status 404 agar frontend bisa memberi notifikasi email tidak terdaftar
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: "Maaf, email tersebut tidak terdaftar di sistem kami." });
    }

    const user = userCheck.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expired_at = new Date(Date.now() + 10 * 60 * 1000); 

    // 2. Transaksi penyimpanan token
    await db.query(`DELETE FROM password_reset_tokens WHERE id_users = $1`, [user.id_users]);
    await db.query(
      `INSERT INTO password_reset_tokens (id_users, token, expired_at) VALUES ($1, $2, $3)`,
      [user.id_users, token, expired_at]
    );

    // 3. Konfigurasi Transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465, 
      secure: true, 
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD 
      }
    });

    // Sesuaikan link dengan letak file frontend Anda
    const resetLink = `${process.env.BASE_URL}/views/reset_password.html?token=${token}`;

    // 4. Kirim Email
    await transporter.sendMail({
      from: `"Sahabat Quran Bogor" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: "Reset Password - Sahabat Quran Bogor",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #1b4332;">Permintaan Reset Password</h2>
          <p>Kami menerima permintaan untuk mereset password akun Sahabat Quran Anda.</p>
          <p>Klik tombol di bawah ini untuk mengatur ulang password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1b4332; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Link ini berlaku selama 10 menit. Jika Anda tidak merasa melakukan ini, abaikan email ini.</p>
        </div>`
    });

    return res.status(200).json({ message: "Link reset password telah dikirim ke email Anda. Cek kotak masuk atau spam." });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Gagal mengirim email. Pastikan server terhubung ke internet." });
  }
};

// ==================== RESET PASSWORD (FIXED) ====================
exports.resetPassword = async (req, res) => {
  const client = await db.connect();
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) return res.status(400).json({ message: "Token diperlukan" });
    if (!password || password.length < 6) return res.status(400).json({ message: "Password minimal 6 karakter" });
    if (password !== confirmPassword) return res.status(400).json({ message: "Konfirmasi password tidak cocok" });

    await client.query("BEGIN");

    const tokenCheck = await client.query(
      `SELECT id_users, expired_at FROM password_reset_tokens WHERE token = $1 FOR UPDATE`,
      [token]
    );

    if (tokenCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Token tidak valid" });
    }

    if (new Date() > new Date(tokenCheck.rows[0].expired_at)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Token telah kadaluarsa" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await client.query(
      `UPDATE users SET password_hash = $1 WHERE id_users = $2`,
      [password_hash, tokenCheck.rows[0].id_users]
    );

    await client.query(`DELETE FROM password_reset_tokens WHERE id_users = $1`, [tokenCheck.rows[0].id_users]);

    await client.query("COMMIT");
    return res.json({ message: "Password berhasil diperbarui. Silakan login kembali." });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  } finally {
    client.release();
  }
};