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
        username: user.email,        // middleware membutuhkan ini
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