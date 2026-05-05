const db = require("../config/db");

/* ================================
   1. Daftar Pendaftar (Public)
================================ */
exports.daftarPendaftar = async (req, res) => {
  try {
    console.log("DATA MASUK:", req.body);

    const { nama, email, no_wa, tanggal_lahir, tempat_lahir } = req.body;

    // Pastikan tanggal hanya "YYYY-MM-DD"
    const tanggalFix = tanggal_lahir ? tanggal_lahir.split("T")[0] : null;

    const result = await db.query(
      `INSERT INTO pendaftar (nama, email, no_wa, tanggal_lahir, tempat_lahir, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [nama, email, no_wa, tanggalFix, tempat_lahir]
    );

    res.json({
      message: "Pendaftaran berhasil",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("DAFTAR ERROR:", err);
    res.status(500).json({ message: "Gagal mendaftar" });
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

/* ================================
   3. Terima pendaftar
================================ */
exports.terimaPendaftar = async (req, res) => {
  try {

    const id = req.params.id_pendaftar;
    console.log("ID PARAM :", id); // cek di terminal

    const cek = await db.query(
      `SELECT * FROM pendaftar WHERE id_pendaftar = $1`,
      [id]
    );

    if (cek.rows.length === 0) {
      return res.status(404).json({ message: "Pendaftar tidak ditemukan" });
    }

    const p = cek.rows[0];

    // 2. Umur -> kategori
    const tahunLahir = new Date(p.tanggal_lahir).getFullYear();
    const tahunSekarang = new Date().getFullYear();
    const umur = tahunSekarang - tahunLahir;

    const kategori = umur <= 12 ? "anak" : "dewasa";

    // 3. Hash password default
    const bcrypt = require("bcrypt");
    const defaultPass = await bcrypt.hash("default123", 10);

    // 4. Buat akun user baru (sesuai tabel)
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, role, status_user)
       VALUES ($1, $2, 'santri', 'aktif')
       RETURNING id_users`,
      [p.email, defaultPass]
    );

    const id_users = newUser.rows[0].id_users;

    // 5. Auto-generate NIS
    const getMax = await db.query(`SELECT MAX(id_santri) AS max FROM santri`);
    const next = (getMax.rows[0].max || 0) + 1;

    const tahun = new Date().getFullYear();
    const nis = `YSQ-${tahun}-${String(next).padStart(4, "0")}`;

    // 6. Insert santri
    await db.query(
      `INSERT INTO santri 
       (id_users, nis, nama, kategori, no_wa, email, tempat_lahir, tanggal_lahir, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'aktif')`,
      [
        id_users,
        nis,
        p.nama,
        kategori,
        p.no_wa,
        p.email,
        p.tempat_lahir,
        p.tanggal_lahir,
      ]
    );

    // 7. Update status pendaftar
    await db.query(
      `UPDATE pendaftar SET status='diterima' WHERE id_pendaftar=$1`,
      [id]
    );

    res.json({
      message: "Pendaftar berhasil diterima",
      id_users,
      nis,
      kategori,
    });

  } catch (err) {
    console.error("TERIMA ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
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
