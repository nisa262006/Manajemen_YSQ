const db = require("../config/db");

/* ================================
   1. Daftar Pendaftar (Public)
================================ */
exports.daftarPendaftar = async (req, res) => {
  try {
    const { nama, email, no_wa, kategori } = req.body;

    const result = await db.query(
      `INSERT INTO pendaftar (nama, email, no_wa, kategori, status) 
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [nama, email, no_wa, kategori]
    );

    res.json({
      message: "Pendaftaran berhasil",
      data: result.rows[0]
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
    const { id_pendaftar } = req.params;

    await db.query(
      `UPDATE pendaftar SET status = 'diterima' WHERE id_pendaftar = $1`,
      [id_pendaftar]
    );

    res.json({ message: "Pendaftar diterima" });

  } catch (err) {
    console.error("TERIMA ERROR:", err);
    res.status(500).json({ message: "Gagal menerima pendaftar" });
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
