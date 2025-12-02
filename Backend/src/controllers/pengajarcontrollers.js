const db = require("../config/db");
const bcrypt = require("bcrypt");

/* =========================================
   1. Tambah Pengajar (Admin)
========================================= */
exports.tambahPengajar = async (req, res) => {
  try {
    const {
      nama,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      mapel,
      email,
      no_kontak,
      password,
      confirmPassword
    } = req.body;

    /* ================================
       Validasi input
    ================================ */
    if (!nama || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Nama, email, password & konfirmasi password wajib diisi"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sama" });
    }

    /* ================================
       Cek email sudah digunakan?
    ================================ */
    const cekEmail = await db.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );

    if (cekEmail.rowCount > 0) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    /* ================================
       1. Hash Password Manual Admin
    ================================ */
    const password_hash = await bcrypt.hash(password, 10);

    /* ================================
       2. Generate NIP Pengajar
    ================================ */
    const tahun2 = String(new Date().getFullYear()).slice(2);

    const getMax = await db.query(`SELECT MAX(id_pengajar) AS max FROM pengajar`);
    const next = (getMax.rows[0].max || 0) + 1;
    const nomor = String(next).padStart(3, "0");

    const nip = `YSQ${tahun2}PGJ${nomor}`;

    /* ================================
       3. Generate Username
    ================================ */
    const cleanName = nama.toLowerCase().replace(/\s+/g, "");
    const username = `${nip}_${cleanName}`;

    /* ================================
       4. Insert ke USERS
    ================================ */
    const newUser = await db.query(
      `INSERT INTO users (email, username, password_hash, role, status_user)
       VALUES ($1, $2, $3, 'pengajar', 'aktif')
       RETURNING id_users`,
      [
        email,
        username,
        password_hash
      ]
    );

    const id_users = newUser.rows[0].id_users;

    /* ================================
       5. Insert ke tabel PENGAJAR
    ================================ */
    await db.query(
      `INSERT INTO pengajar 
       (id_users, nama, no_kontak, alamat, tempat_lahir, tanggal_lahir, mapel, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'aktif')`,
      [
        id_users,
        nama,
        no_kontak || null,
        alamat || null,
        tempat_lahir || null,
        tanggal_lahir || null,
        mapel || null
      ]
    );

    /* ================================
       6. Response lengkap
    ================================ */
    res.json({
      message: "Pengajar berhasil ditambahkan",
      id_users,
      nip,
      username,
      nama,
      email,
      mapel,
      password_plain: password,    // password asli yang admin input
      password_hash
    });

  } catch (err) {
    console.error("TAMBAH PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

/* =========================================
   2. Ambil Semua Pengajar
========================================= */
exports.getAllPengajar = async (req, res) => {
    try {
      const result = await db.query(`
        SELECT p.id_pengajar, p.nama, p.no_kontak, p.mapel, p.status,
               u.email, u.username
        FROM pengajar p
        LEFT JOIN users u ON p.id_users = u.id_users
        ORDER BY p.id_pengajar ASC
      `);
  
      res.json({
        message: "List pengajar",
        data: result.rows
      });
  
    } catch (err) {
      console.error("GET ALL PENGAJAR ERROR:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  };
  
  
  
  /* =========================================
     3. Ambil Detail Pengajar by ID
  ========================================= */
  exports.getPengajarById = async (req, res) => {
    try {
      const { id_pengajar } = req.params;
  
      const result = await db.query(`
        SELECT p.id_pengajar, p.nama, p.no_kontak, p.mapel, p.status,
               p.alamat, p.tempat_lahir, p.tanggal_lahir,
               u.email, u.username
        FROM pengajar p
        LEFT JOIN users u ON p.id_users = u.id_users
        WHERE p.id_pengajar = $1
      `, [id_pengajar]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Pengajar tidak ditemukan" });
      }
  
      res.json({
        message: "Detail pengajar",
        data: result.rows[0]
      });
  
    } catch (err) {
      console.error("GET DETAIL PENGAJAR ERROR:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  };
  