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

    // Cek Email unik
    const cekEmail = await db.query(
      `SELECT email FROM users WHERE email=$1`,
      [email]
    );
    if (cekEmail.rowCount > 0) {
      return res.status(400).json({ message: "Email sudah digunakan" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // =============================
    // 1️⃣ Generate NIP otomatis
    // =============================
    const tahun2 = String(new Date().getFullYear()).slice(2);
    const getMax = await db.query(`SELECT MAX(id_pengajar) AS max FROM pengajar`);
    const next = (getMax.rows[0].max || 0) + 1;
    const nomor = String(next).padStart(3, "0");
    const nip = `YSQ${tahun2}PGJ${nomor}`;

    // =============================
    // 2️⃣ Generate username otomatis
    // =============================
    const cleanName = nama.toLowerCase().replace(/\s+/g, "");
    const username = `${nip}_${cleanName}`;

    // Cek username unik
    const cekUsername = await db.query(
      `SELECT username FROM users WHERE username=$1`,
      [username]
    );
    if (cekUsername.rowCount > 0) {
      return res.status(400).json({
        message: "Username otomatis tabrakan, coba masukkan nama berbeda"
      });
    }

    // =============================
    // 3️⃣ Insert ke USERS
    // =============================
    const newUser = await db.query(
      `INSERT INTO users (email, username, password_hash, role, status_user)
       VALUES ($1, $2, $3, 'pengajar', 'aktif')
       RETURNING id_users`,
      [email, username, password_hash]
    );

    const id_users = newUser.rows[0].id_users;

    // =============================
    // 4️⃣ Insert ke PENGAJAR (email & nip WAJIB MASUK)
    // =============================
    await db.query(
      `INSERT INTO pengajar 
        (id_users, nip, nama, no_kontak, alamat, tempat_lahir, tanggal_lahir, mapel, email, status, tanggal_terdaftar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'aktif', NOW())`,
      [
        id_users,
        nip,
        nama,
        no_kontak || null,
        alamat || null,
        tempat_lahir || null,
        tanggal_lahir || null,
        mapel || null,
        email || null
      ]
    );

    return res.json({
      message: "Pengajar berhasil ditambahkan",
      id_users,
      nip,
      username,
      email,
      password_plain: password
    });

  } catch (err) {
    console.error("TAMBAH PENGAJAR ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

/* =========================================
   2. Ambil Semua Pengajar (Dengan Pagination)
========================================= */
exports.getAllPengajar = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id_pengajar,
        p.nip,
        p.nama,
        p.email,
        p.no_kontak,
        p.status,
        p.mapel,
        -- Menggabungkan banyak kelas menjadi satu string, jika tidak ada tampilkan '-'
        COALESCE(STRING_AGG(k.nama_kelas, ', '), '-') AS nama_kelas
      FROM pengajar p
      LEFT JOIN kelas k ON k.id_pengajar = p.id_pengajar
      GROUP BY p.id_pengajar -- Wajib menggunakan GROUP BY karena ada STRING_AGG
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
   3. Detail Pengajar by ID
========================================= */
exports.getPengajarById = async (req, res) => {
  try {
    const { id_pengajar } = req.params;

    const result = await db.query(`
      SELECT 
        p.*,
        u.username,
        u.email AS user_email,
    
        k.id_kelas,
        k.nama_kelas
      FROM pengajar p
      LEFT JOIN users u ON p.id_users = u.id_users
      LEFT JOIN kelas k ON k.id_pengajar = p.id_pengajar
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
   4. Update Pengajar (FINAL TANPA ERROR NIP)
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

    // Ambil data lama
    const check = await db.query(`
      SELECT p.*, u.email AS user_email, u.username 
      FROM pengajar p
      LEFT JOIN users u ON p.id_users = u.id_users
      WHERE p.id_pengajar = $1
    `, [id_pengajar]);

    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const oldData = check.rows[0];
    const id_users = oldData.id_users;

    let changes = {};

    // ===============================
    // Update Password (opsional)
    // ===============================
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Password tidak sama" });
      }

      const password_hash = await bcrypt.hash(password, 10);

      await db.query(
        `UPDATE users SET password_hash=$1 WHERE id_users=$2`,
        [password_hash, id_users]
      );

      changes.password = "updated";
    }

    // ===============================
    // Data pengajar yang boleh diupdate
    // ===============================
    const updatePengajar = {
      nama,
      no_kontak,
      alamat,
      tempat_lahir,
      tanggal_lahir,
      mapel,
      email,
      status
    };

    // Track perubahan
    for (let key in updatePengajar) {
      if (
        updatePengajar[key] !== undefined &&
        updatePengajar[key] !== oldData[key]
      ) {
        changes[key] = { old: oldData[key], new: updatePengajar[key] };
      }
    }

    // ===============================
    // EKSEKUSI UPDATE
    // ===============================
    await db.query(
      `UPDATE pengajar SET 
        nama=$1,
        no_kontak=$2,
        alamat=$3,
        tempat_lahir=$4,
        tanggal_lahir=$5,
        mapel=$6,
        email=$7,
        status=$8
      WHERE id_pengajar=$9`,
      [
        nama,
        no_kontak,
        alamat,
        tempat_lahir,
        tanggal_lahir,
        mapel,
        email,
        status,
        id_pengajar
      ]
    );

    return res.json({
      message: "Pengajar berhasil diperbarui",
      id_pengajar,
      nip: oldData.nip,   // ⬅ nip hanya dibaca, tidak membuat variabel baru!
      updated_fields: changes
    });

  } catch (err) {
    console.error("UPDATE PENGAJAR ERROR:", err);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};


/* =========================================
   5. Delete Pengajar (PERBAIKAN)
========================================= */
exports.deletePengajar = async (req, res) => {
  const client = await db.connect();
  try {
    const { id_pengajar } = req.params;
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT id_users, email FROM pengajar WHERE id_pengajar=$1`,
      [id_pengajar]
    );

    if (check.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const { id_users, email } = check.rows[0];

    // Hapus dari pendaftar dan users
    await client.query(`DELETE FROM pendaftar WHERE email = $1`, [email]);
    await client.query(`DELETE FROM users WHERE id_users = $1`, [id_users]);

    await client.query("COMMIT");
    res.json({ message: "Pengajar berhasil dihapus sepenuhnya" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Terjadi kesalahan server" });
  } finally {
    client.release();
  }
};