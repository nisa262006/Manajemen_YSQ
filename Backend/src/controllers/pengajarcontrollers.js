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

    if (!nama || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Nama, email, password & konfirmasi password wajib diisi"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sama" });
    }

    // Email harus unik
    const cekEmail = await db.query(
      `SELECT email FROM users WHERE email=$1`,
      [email]
    );
    if (cekEmail.rowCount > 0) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate NIP
    const tahun2 = String(new Date().getFullYear()).slice(2);
    const getMax = await db.query(`SELECT MAX(id_pengajar) AS max FROM pengajar`);
    const next = (getMax.rows[0].max || 0) + 1;
    const nomor = String(next).padStart(3, "0");
    const nip = `YSQ${tahun2}PGJ${nomor}`;

    // Generate username
    const cleanName = nama.toLowerCase().replace(/\s+/g, "");
    const username = `${nip}_${cleanName}`;

    // Username harus unik (antisipasi tabrakan nama sama)
    const cekUsername = await db.query(
      `SELECT username FROM users WHERE username=$1`,
      [username]
    );
    if (cekUsername.rowCount > 0) {
      return res.status(400).json({
        message: "Username otomatis tabrakan, coba masukkan nama berbeda"
      });
    }

    // Insert ke users
    const newUser = await db.query(
      `INSERT INTO users (email, username, password_hash, role, status_user)
       VALUES ($1, $2, $3, 'pengajar', 'aktif')
       RETURNING id_users`,
      [email, username, password_hash]
    );

    const id_users = newUser.rows[0].id_users;

    // Insert pengajar
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

    res.json({
      message: "Pengajar berhasil ditambahkan",
      id_users,
      nip,
      username,
      email,
      password_plain: password, 
      password_hash
    });

  } catch (err) {
    console.error("TAMBAH PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};



/* =========================================
   2. Ambil Semua Pengajar (Dengan Pagination)
========================================= */
exports.getAllPengajar = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT p.id_pengajar, p.nama, p.no_kontak, p.mapel, p.status,
             u.email, u.username
      FROM pengajar p
      LEFT JOIN users u ON p.id_users = u.id_users
      ORDER BY p.id_pengajar
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const count = await db.query(`SELECT COUNT(*) AS total FROM pengajar`);

    res.json({
      message: "List pengajar",
      total: Number(count.rows[0].total),
      page,
      limit,
      data: result.rows
    });

  } catch (err) {
    console.error("GET ALL PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};



/* =========================================
   3. Detail Pengajar by ID
========================================= */
exports.getPengajarById = async (req, res) => {
  try {
    const { id_pengajar } = req.params;

    const result = await db.query(`
      SELECT 
   p.id_pengajar,
   p.nama,
   p.no_kontak,        -- ✔ BETUL
   p.tempat_lahir,
   p.tanggal_lahir,
   p.mapel,
   p.alamat,
   p.status,
   u.email
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



/* =========================================
   4. Update Pengajar + Show Changed Fields
========================================= */
exports.updatePengajar = async (req, res) => {
  try {
    const { id_pengajar } = req.params;
    const {
      nama,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      mapel,
      email,
      no_kontak,
      status,
      password,
      confirmPassword
    } = req.body;

    // 1. Ambil data lama
    const check = await db.query(`
      SELECT p.*, u.email AS email_lama, u.username,
             u.password_hash
      FROM pengajar p
      LEFT JOIN users u ON p.id_users = u.id_users
      WHERE p.id_pengajar=$1
    `, [id_pengajar]);

    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const oldData = check.rows[0];
    const id_users = oldData.id_users;

    // ================================
    // Normalisasi email
    // ================================
    const emailDB = oldData.email_lama ? oldData.email_lama.toLowerCase().trim() : null;
    const emailReq = email ? email.toLowerCase().trim() : null;

    // ================================
    // Prepare object perubahan
    // ================================
    const changes = {};


    // ================================
    // Cek & Update Password
    // ================================
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Password tidak sama" });
      }

      const password_hash = await bcrypt.hash(password, 10);

      await db.query(
        `UPDATE users SET password_hash=$1 WHERE id_users=$2`,
        [password_hash, id_users]
      );

      changes.password = "updated"; // demi keamanan tidak tampilkan lama/baru
    }

    // ================================
    // Siapkan perubahan data pengajar
    // ================================
    const newData = {
      nama,
      no_kontak,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      mapel,
      status
    };

    const fields = ["nama", "no_kontak", "alamat", "tempat_lahir", "tanggal_lahir", "mapel", "status"];

    fields.forEach(field => {
      if (newData[field] !== undefined && newData[field] !== oldData[field]) {
        changes[field] = { old: oldData[field], new: newData[field] };
      }
    });

    // ================================
    // Update tabel pengajar
    // ================================
    await db.query(
      `UPDATE pengajar SET 
        nama=$1,
        no_kontak=$2,
        alamat=$3,
        tempat_lahir=$4,
        tanggal_lahir=$5,
        mapel=$6,
        status=$7
       WHERE id_pengajar=$8`,
      [
        nama,
        no_kontak,
        alamat,
        tempat_lahir,
        tanggal_lahir,
        mapel,
        status,
        id_pengajar
      ]
    );

    // ================================
    // Response final
    // ================================
    res.json({
      message: "Pengajar berhasil diperbarui",
      id_pengajar,
      updated_fields: changes
    });

  } catch (err) {
    console.error("UPDATE PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};



/* =========================================
   5. Delete Pengajar
========================================= */
exports.deletePengajar = async (req, res) => {
  try {
    const { id_pengajar } = req.params;

    const check = await db.query(
      `SELECT * FROM pengajar WHERE id_pengajar=$1`,
      [id_pengajar]
    );
    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const id_users = check.rows[0].id_users;

    await db.query(`DELETE FROM pengajar WHERE id_pengajar=$1`, [id_pengajar]);
    await db.query(`DELETE FROM users WHERE id_users=$1`, [id_users]);

    res.json({
      message: "Pengajar berhasil dihapus",
      id_pengajar
    });

  } catch (err) {
    console.error("DELETE PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
