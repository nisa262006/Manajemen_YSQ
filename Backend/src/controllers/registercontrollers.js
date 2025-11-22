const db = require("../config/db");
const bcrypt = require("bcrypt");
const ExcelJS = require("exceljs");

/* ======================================================
   1. DAFTAR PENDAFTAR (PUBLIC)
====================================================== */
exports.daftarPendaftar = async (req, res) => {
  try {
    const { nama, email, no_wa, tempat_lahir, tanggal_lahir } = req.body;

    await db.query(
      `INSERT INTO pendaftar 
        (nama, email, no_wa, tempat_lahir, tanggal_lahir, status)
       VALUES ($1, $2, $3, $4, $5, 'menunggu')`,
      [nama, email, no_wa, tempat_lahir, tanggal_lahir]
    );

    return res.json({ message: "Pendaftaran berhasil. Menunggu verifikasi admin." });
  } catch (err) {
    console.error("daftarPendaftar error:", err);
    return res.status(500).json({ message: "Gagal mendaftar", error: err.message });
  }
};


/* ======================================================
   2. GET SEMUA PENDAFTAR
====================================================== */
exports.getAllPendaftar = async (req, res) => {
  try {
    const data = await db.query(
      "SELECT * FROM pendaftar ORDER BY id_pendaftar DESC"
    );
    return res.json(data.rows);
  } catch (err) {
    console.error("getAllPendaftar error:", err);
    return res.status(500).json({ message: "Gagal mengambil pendaftar", error: err.message });
  }
};


/* ======================================================
   GENERATE NIS
====================================================== */
function generateNIS(id_users) {
  return `YSQ-${new Date().getFullYear()}-${String(id_users).padStart(4, "0")}`;
}


/* ======================================================
   3. TERIMA PENDAFTAR (ADMIN)
====================================================== */
// === Terima pendaftar ===
exports.terimaPendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1. Ambil data pendaftar
    const result = await client.query(
      "SELECT * FROM pendaftar WHERE id_pendaftar = $1",
      [id_pendaftar]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Pendaftar tidak ditemukan" });
    }

    const p = result.rows[0];

    // 2. Cek apakah user sudah ada
    const checkUser = await client.query(
      "SELECT id_users FROM users WHERE email = $1",
      [p.email]
    );

    let id_users;

    if (checkUser.rowCount > 0) {
      id_users = checkUser.rows[0].id_users;
    } else {
      // 3. Buat user baru
      const defaultPassword = "12345";
      const hash = await bcrypt.hash(defaultPassword, 10);

      const newUser = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'santri')
         RETURNING id_users`,
        [p.email, hash]
      );

      id_users = newUser.rows[0].id_users;
    }

    // 4. Buat NIS
    const nis = `YSQ-${new Date().getFullYear()}-${String(id_users).padStart(4, "0")}`;

    // 5. Masukkan ke tabel santri
    await client.query(
      `INSERT INTO santri 
        (id_users, nis, nama, kategori, no_wa, email, tempat_lahir, tanggal_lahir, status)
       VALUES ($1, $2, $3, 'dewasa', $4, $5, $6, $7, 'aktif')`,
      [
        id_users,
        nis,
        p.nama,
        p.no_wa,
        p.email,
        p.tempat_lahir,
        p.tanggal_lahir
      ]
    );

    // 6. Update status pendaftar
    await client.query(
      "UPDATE pendaftar SET status = 'diterima' WHERE id_pendaftar = $1",
      [id_pendaftar]
    );

    await client.query("COMMIT");
    return res.json({ message: "Pendaftar diterima", nis });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("terimaPendaftar error:", err);
    return res.status(500).json({ message: "Gagal menerima pendaftar", error: err.message });
  } finally {
    client.release();
  }
};


/* ======================================================
   4. TOLAK PENDAFTAR
====================================================== */
exports.tolakPendaftar = async (req, res) => {
  try {
    await db.query(
      "UPDATE pendaftar SET status = 'ditolak' WHERE id_pendaftar = $1",
      [req.params.id_pendaftar]
    );
    return res.json({ message: "Pendaftar ditolak." });
  } catch (err) {
    console.error("tolakPendaftar error:", err);
    return res.status(500).json({ message: "Gagal menolak", error: err.message });
  }
};


/* ======================================================
   5. HAPUS PENDAFTAR
====================================================== */
exports.deletePendaftar = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM pendaftar WHERE id_pendaftar = $1",
      [req.params.id_pendaftar]
    );

    return res.json({ message: "Pendaftar dihapus." });

  } catch (err) {
    console.error("deletePendaftar error:", err);
    return res.status(500).json({ message: "Gagal menghapus", error: err.message });
  }
};


/* ======================================================
   6. RESET SEMUA PENDAFTAR (kecuali diterima)
====================================================== */
exports.resetAllPendaftar = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM pendaftar WHERE status != 'diterima'"
    );

    return res.json({
      message: "Reset berhasil.",
      deleted: result.rowCount
    });

  } catch (err) {
    console.error("resetAllPendaftar error:", err);
    return res.status(500).json({ message: "Gagal reset", error: err.message });
  }
};


/* ======================================================
   7. EXPORT EXCEL
====================================================== */
exports.exportExcelPendaftar = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id_pendaftar, nama, email, no_wa, status FROM pendaftar ORDER BY id_pendaftar ASC"
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Pendaftar");

    sheet.columns = [
      { header: "ID", key: "id_pendaftar", width: 8 },
      { header: "Nama", key: "nama", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "WA", key: "no_wa", width: 20 },
      { header: "Status", key: "status", width: 15 }
    ];

    result.rows.forEach(row => sheet.addRow(row));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=pendaftar.xlsx");

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("exportExcelPendaftar error:", err);
    return res.status(500).json({ message: "Gagal export", error: err.message });
  }
};
