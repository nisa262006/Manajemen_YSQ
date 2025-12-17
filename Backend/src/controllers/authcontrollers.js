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

    const result = await db.query(`
      SELECT 
        u.*,
        s.status AS status_santri
      FROM users u
      LEFT JOIN santri s ON u.id_users = s.id_users
      WHERE u.username = $1 OR u.email = $1
      LIMIT 1
    `, [identifier]);

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Username/Email atau password salah"
      });
    }

    const user = result.rows[0];

    // 🔒 BLOK USER NONAKTIF (APAPUN ROLE-NYA)
if (user.status_user !== "aktif") {
  return res.status(403).json({
    message: "Akun Anda tidak aktif. Hubungi admin."
  });
}


    // 🔑 BARU CEK PASSWORD
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Username/Email atau password salah"
      });
    }

    // ✅ LOGIN BERHASIL
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

// ==================== CREATE USER AFTER SANTRI ACCEPTED ====================
exports.createUserAfterSantriAccepted = async (req, res) => {
  try {
    const { id_santri } = req.body;

    // 1️⃣ Ambil data santri dari tabel pendaftar/santri
    const santriData = await db.query(
      `SELECT nis, nama_santri, email, kategori
       FROM santri
       WHERE id_santri = $1`,
      [id_santri]
    );

    if (santriData.rowCount === 0) {
      return res.status(404).json({ message: "Santri tidak ditemukan" });
    }

    const { nis, nama_santri, email, kategori } = santriData.rows[0];

    // 2️⃣ Bersihkan nama → "riska " → "riska"
    const cleanName = nama_santri.replace(/\s+/g, "").toLowerCase();

    // 3️⃣ Username otomatis → nis_nama
    const username = `${nis}_${cleanName}`;

    // 4️⃣ Password default → nama + 123
    const rawPassword = `${cleanName}123`;

    // 5️⃣ Hash password untuk simpan ke database
    const password_hash = await bcrypt.hash(rawPassword, 10);

    // 6️⃣ Simpan ke tabel users
    const insertUser = await db.query(
      `INSERT INTO users (email, username, password_hash, role, status_user)
       VALUES ($1, $2, $3, 'santri', 'aktif')
       RETURNING id_users, username`,
      [email, username, password_hash]
    );

    // 7️⃣ Return username + password default (yang dibutuhkan admin)
    return res.json({
      message: "Pendaftar berhasil diterima",
      id_users: insertUser.rows[0].id_users,
      nis,
      username,
      kategori,
      password_default: rawPassword   // <── YANG KAMU MINTA
    });

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

/* ======================================================
   4. FORGOT PASSWORD  (Kirim email reset)
====================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email wajib diisi" });

    const userCheck = await db.query(
      `SELECT id_users, email FROM users WHERE email=$1`,
      [email]
    );

    if (userCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Email tidak ditemukan. Jika Anda santri, mohon isi email terlebih dahulu."
      });
    }

    const user = userCheck.rows[0];

    if (!user.email) {
      return res.status(400).json({
        message: "Akun ini belum memiliki email. Harap hubungi admin."
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expired_at = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `DELETE FROM password_reset_tokens WHERE id_users=$1`,
      [user.id_users]
    );

    await db.query(
      `INSERT INTO password_reset_tokens (id_users, token, expired_at)
       VALUES ($1, $2, $3)`,
      [user.id_users, token, expired_at]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const resetLink = `${process.env.BASE_URL}/views/reset_password.html?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_SENDER,
      to: email,
      subject: "Reset Password - YSQ Bogor",
      html: `
        <p>Halo,</p>
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


/* ======================================================
   5. RESET PASSWORD (Submit password baru)
====================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token)
      return res.status(400).json({ message: "Token diperlukan" });
    if (!password || !confirmPassword)
      return res.status(400).json({ message: "Password wajib diisi" });
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password tidak sama" });

    const tokenCheck = await db.query(
      `SELECT * FROM password_reset_tokens WHERE token=$1`,
      [token]
    );

    if (tokenCheck.rowCount === 0) {
      return res.status(400).json({ message: "Token tidak valid" });
    }

    const data = tokenCheck.rows[0];

    if (new Date() > new Date(data.expired_at)) {
      return res.status(400).json({ message: "Token expired" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE users SET password_hash=$1 WHERE id_users=$2`,
      [password_hash, data.id_users]
    );

    await db.query(
      `DELETE FROM password_reset_tokens WHERE id_users=$1`,
      [data.id_users]
    );

    res.json({ message: "Password berhasil direset, silakan login kembali" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};