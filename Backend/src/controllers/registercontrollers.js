const db = require("../config/db");

/* ================================
   1. Daftar Pendaftar (Public)
================================ */
exports.daftarPendaftar = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      nama,
      email,
      alamat,          // ✅ AMBIL
      no_wa,
      tanggal_lahir,
      tempat_lahir
    } = req.body;

    const tanggalFix = tanggal_lahir ? tanggal_lahir.split("T")[0] : null;

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO pendaftar 
      (nama, email, alamat, no_wa, tanggal_lahir, tempat_lahir, status)
      VALUES ($1,$2,$3,$4,$5,$6,'pending')
      RETURNING *
      `,
      [nama, email, alamat, no_wa, tanggalFix, tempat_lahir]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Gagal mendaftar" });
  } finally {
    client.release();
  }
};


/* ================================
   2. Get semua pendaftar (Admin)
================================ */
exports.getAllPendaftar = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM pendaftar ORDER BY id_pendaftar DESC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET ALL ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data pendaftar" });
  }
};


/* Get santri pendaftar (Admin)*/
exports.getPendaftarById = async (req, res) => {
  try {
    const { id_pendaftar } = req.params;
    const q = await db.query(
      `SELECT * FROM pendaftar WHERE id_pendaftar = $1`,
      [id_pendaftar]
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ message: "Pendaftar tidak ditemukan" });
    }

    res.json(q.rows[0]);
  } catch (err) {
    console.error("ERROR getPendaftarById:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.terimaPendaftar = async (req, res) => {
  const client = await db.connect();
  const bcrypt = require("bcrypt");

  try {
    const { id_pendaftar } = req.params;
    const { sumber = "pendaftar", password } = req.body;

    await client.query("BEGIN");

    // 1️⃣ Ambil pendaftar
    const cek = await client.query(
      `SELECT * FROM pendaftar WHERE id_pendaftar=$1`,
      [id_pendaftar]
    );

    if (cek.rowCount === 0) {
      throw new Error("Pendaftar tidak ditemukan");
    }

    const p = cek.rows[0];

    if (p.status === "diterima") {
      throw new Error("Pendaftar sudah diterima");
    }

    // 2️⃣ Cek email user
    const cekEmail = await client.query(
      `SELECT id_users FROM users WHERE email=$1`,
      [p.email]
    );

    if (cekEmail.rowCount > 0) {
      throw new Error("Email sudah terdaftar sebagai user");
    }

    // 3️⃣ Hitung kategori
    const tahun = new Date().getFullYear();
    const umur = tahun - new Date(p.tanggal_lahir).getFullYear();
    const kategori = umur <= 12 ? "anak" : "dewasa";
    const kodeKategori = kategori === "anak" ? "ANK" : "DWS";

    // 4️⃣ PASSWORD (🔥 FIX UTAMA 🔥)
    let rawPassword;

    if (sumber === "admin") {
      if (!password) throw new Error("Password wajib diisi admin");
      rawPassword = password;       // ✅ PAKAI PASSWORD ADMIN
    } else {
      const cleanName = p.nama.toLowerCase().replace(/\s+/g, "");
      rawPassword = `${cleanName}123`; // ✅ AUTO
    }

    const password_hash = await bcrypt.hash(rawPassword, 10);

    // 5️⃣ Generate NIS
    const tahun2 = String(tahun).slice(2);
    const max = await client.query(
      `SELECT COALESCE(MAX(id_santri),0) AS max FROM santri`
    );

    const nis = `YSQ${tahun2}${kodeKategori}${String(
      max.rows[0].max + 1
    ).padStart(3, "0")}`;

    const username = `${nis}_${p.nama.toLowerCase().replace(/\s+/g, "")}`;

    // 6️⃣ Insert USER
    const user = await client.query(
      `INSERT INTO users (email, username, password_hash, role, status_user)
       VALUES ($1,$2,$3,'santri','aktif')
       RETURNING id_users`,
      [p.email, username, password_hash]
    );

    const id_users = user.rows[0].id_users;

    // 7️⃣ Insert SANTRI
    await client.query(
      `
      INSERT INTO santri (
        id_users, nis, nama, kategori,
        no_wa, email, tempat_lahir,
        tanggal_lahir, alamat,
        status, tanggal_terdaftar
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,
        $8,$9,
        'aktif', NOW()
      )
      `,
      [
        id_users,
        nis,
        p.nama,
        kategori,
        p.no_wa,
        p.email,
        p.tempat_lahir,
        p.tanggal_lahir,
        p.alamat || null
      ]
    );

    // 8️⃣ Update pendaftar
    await client.query(
      `UPDATE pendaftar SET status='diterima', id_users=$1 WHERE id_pendaftar=$2`,
      [id_users, id_pendaftar]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Pendaftar berhasil diterima",
      nis,
      username,
      password: rawPassword, // ⚠️ kirim sekali saja
      sumber
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("TERIMA ERROR:", err.message);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};


/* ================================
   4. Tolak pendaftar
================================ */
exports.tolakPendaftar = async (req, res) => {
  try {
    const { id_pendaftar } = req.params;

    await db.query(
      `UPDATE pendaftar SET status = 'ditolak' WHERE id_pendaftar = $1`,
      [id_pendaftar]
    );

    res.json({ message: "Pendaftar ditolak" });

  } catch (err) {
    console.error("TOLAK ERROR:", err);
    res.status(500).json({ message: "Gagal menolak pendaftar" });
  }
};

/* ================================
   5. Hapus satu pendaftar
================================ */
exports.deletePendaftar = async (req, res) => {
  try {
    const { id_pendaftar } = req.params;

    await db.query(`DELETE FROM pendaftar WHERE id_pendaftar = $1`, [
      id_pendaftar,
    ]);

    res.json({ message: "Pendaftar dihapus" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Gagal menghapus pendaftar" });
  }
};

/* ================================
   6. Reset semua pendaftar
================================ */
exports.resetAllPendaftar = async (req, res) => {
  try {
    await db.query(`DELETE FROM pendaftar`);
    res.json({ message: "Semua pendaftar dihapus" });

  } catch (err) {
    console.error("RESET ERROR:", err);
    res.status(500).json({ message: "Gagal reset pendaftar" });
  }
};

/* ================================
   7. Export Excel (belum diisi)
================================ */
exports.exportExcelPendaftar = async (req, res) => {
  res.json({ message: "Export Excel belum dibuat" });
};