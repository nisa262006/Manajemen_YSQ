const db = require("../config/db");
const ExcelJS = require("exceljs");

/* ============================================================
   1. GET SEMUA SANTRI (Dengan Filter + Pagination)
============================================================ */
exports.getAllSantri = async (req, res) => {
  try {
    let { page, limit, q, kategori, status } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];
    let i = 1;

    if (q) {
      where.push(`(LOWER(s.nama) LIKE LOWER($${i}) OR LOWER(s.nis) LIKE LOWER($${i}))`);
      params.push(`%${q}%`);
      i++;
    }

    if (kategori) {
      where.push(`s.kategori = $${i}`);
      params.push(kategori);
      i++;
    }

    if (status) {
      where.push(`s.status = $${i}`);
      params.push(status);
      i++;
    }

    const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

    const santriQuery = await db.query(
      `
      SELECT 
        s.id_santri,
        s.nis,
        s.nama,
        s.kategori,
        s.no_wa,
        s.email,
        s.tempat_lahir,
        s.tanggal_lahir,
        s.status,
        s.alamat,
        s.tanggal_terdaftar,

        u.username,
        u.email AS user_email,

        sk.id_kelas,
        COALESCE(k.nama_kelas, '-') AS nama_kelas

      FROM santri s
      LEFT JOIN users u ON s.id_users = u.id_users
      LEFT JOIN santri_kelas sk ON sk.id_santri = s.id_santri
      LEFT JOIN kelas k ON k.id_kelas = sk.id_kelas
      ${whereSQL}
      ORDER BY s.id_santri ASC
      LIMIT $${i} OFFSET $${i + 1}
      `,
      [...params, limit, offset]
    );

    const countQuery = await db.query(
      `SELECT COUNT(*) FROM santri s ${whereSQL}`,
      params
    );

    res.json({
      message: "List santri",
      filter: { q, kategori, status },
      pagination: {
        current_page: page,
        per_page: limit,
        total_data: Number(countQuery.rows[0].count),
        total_page: Math.ceil(Number(countQuery.rows[0].count) / limit)
      },
      data: santriQuery.rows
    });

  } catch (err) {
    console.error("GET ALL SANTRI ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

/* ============================================================
   2. DETAIL SANTRI
============================================================ */
exports.getSantriById = async (req, res) => {
  try {
    const { id_santri } = req.params;

    const result = await db.query(
      `
      SELECT 
          s.id_santri,
          s.nis,
          s.nama,
          s.kategori,
          s.no_wa,
          s.email,
          s.tempat_lahir,
          s.tanggal_lahir,
          s.status,
          s.alamat,
          s.tanggal_terdaftar,

          u.username,
          u.email AS user_email,

          sk.id_kelas,
          k.nama_kelas

      FROM santri s
      LEFT JOIN users u ON s.id_users = u.id_users
      LEFT JOIN santri_kelas sk ON sk.id_santri = s.id_santri
      LEFT JOIN kelas k ON k.id_kelas = sk.id_kelas
      WHERE s.id_santri = $1
      `,
      [id_santri]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Santri tidak ditemukan" });
    }

    res.json({
      message: "Detail santri",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("GET SANTRI ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};



/* ============================================================
   3. UPDATE SANTRI
============================================================ */
exports.updateSantri = async (req, res) => {
  try {
    const { id_santri } = req.params;

    const {
      nama,
      kategori,
      no_wa,
      email,
      tempat_lahir,
      tanggal_lahir,
      status,
      alamat,
      user_email
    } = req.body;

    // Cek keberadaan santri
    const check = await db.query(
      `
      SELECT s.*, u.id_users, u.email AS user_email
      FROM santri s
      LEFT JOIN users u ON s.id_users = u.id_users
      WHERE s.id_santri = $1
      `,
      [id_santri]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Santri tidak ditemukan" });
    }

    const oldData = check.rows[0];
    const id_users = oldData.id_users;

    /* ==== UPDATE EMAIL USER JIKA BERUBAH ==== */
    const oldEmail = (oldData.user_email || "").toLowerCase().trim();
    const newEmail = (user_email || email || "").toLowerCase().trim();

    if (newEmail && newEmail !== oldEmail) {

      const cekEmail = await db.query(
        `SELECT email FROM users WHERE email=$1 AND id_users != $2`,
        [newEmail, id_users]
      );

      if (cekEmail.rowCount > 0) {
        return res.status(400).json({ message: "Email sudah digunakan user lain" });
      }

      await db.query(
        `UPDATE users SET email=$1 WHERE id_users=$2`,
        [newEmail, id_users]
      );
    }

    /* ==== UPDATE SANTRI ==== */
    await db.query(
      `
      UPDATE santri SET
        nama=$1,
        kategori=$2,
        no_wa=$3,
        email=$4,
        tempat_lahir=$5,
        tanggal_lahir=$6,
        status=$7,
        alamat=$8
      WHERE id_santri=$9
      `,
      [
        nama,
        kategori,
        no_wa,
        email,
        tempat_lahir,
        tanggal_lahir,
        status,
        alamat,
        id_santri
      ]
    );

    res.json({
      message: "Santri berhasil diperbarui",
      data: {
        id_santri,
        nama,
        kategori,
        no_wa,
        email: newEmail,
        tempat_lahir,
        tanggal_lahir,
        alamat,
        status
      }
    });

  } catch (err) {
    console.error("UPDATE SANTRI ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};



/* ============================================================
   4. DELETE SANTRI + USERNYA
============================================================ */
exports.deleteSantri = async (req, res) => {
  try {
    const { id_santri } = req.params;

    const check = await db.query(
      `SELECT * FROM santri WHERE id_santri = $1`,
      [id_santri]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Santri tidak ditemukan" });
    }

    const id_users = check.rows[0].id_users;

    await db.query(`DELETE FROM santri WHERE id_santri=$1`, [id_santri]);
    await db.query(`DELETE FROM users WHERE id_users=$1`, [id_users]);

    res.json({ message: "Santri berhasil dihapus", id_santri });

  } catch (err) {
    console.error("DELETE SANTRI ERROR:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};



/* ============================================================
   5. EXPORT EXCEL (Dengan tanggal terdaftar)
============================================================ */
exports.exportSantriExcel = async (req, res) => {
  try {
    const santri = await db.query(`
      SELECT 
        s.id_santri, s.nis, s.nama, s.kategori,
        s.no_wa, s.email, s.tempat_lahir,
        s.tanggal_lahir, s.alamat, s.tanggal_terdaftar,
        s.status
      FROM santri s
      ORDER BY s.id_santri ASC
    `);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data Santri");

    sheet.addRow([
      "ID", "NIS", "Nama", "Kategori", "No WA",
      "Email", "Tempat Lahir", "Tanggal Lahir",
      "Alamat", "Tanggal Terdaftar", "Status"
    ]);

    santri.rows.forEach(s => {
      sheet.addRow([
        s.id_santri,
        s.nis,
        s.nama,
        s.kategori,
        s.no_wa,
        s.email,
        s.tempat_lahir,
        s.tanggal_lahir,
        s.alamat,
        s.tanggal_terdaftar,
        s.status
      ]);
    });

    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
    });

    const fileName = `data-santri-${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("EXPORT EXCEL ERROR:", err);
    res.status(500).json({ message: "Gagal export Excel" });
  }
};
