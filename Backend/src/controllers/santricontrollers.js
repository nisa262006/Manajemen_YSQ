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

    // =============================
    // FILTER
    // =============================
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

    // ======================================================
    // 🔥 QUERY BARU SISTEM YAYASAN
    // ======================================================
    const santriQuery = await db.query(
      `
      SELECT DISTINCT ON (s.id_santri)

  -- 🔹 SEMUA DATA SANTRI
  s.id_santri,
  s.id_users,
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

  -- 🔹 DATA USER (AKUN)
  u.username,
  u.email AS user_email,
  u.status_user,

  -- 🔹 DATA SESI (JIKA ADA)
  sj.id_jadwal,
  j.hari,
  j.jam_mulai,
  j.jam_selesai,
  j.kapasitas,

  -- 🔹 DATA KELAS
  k.id_kelas,
  k.nama_kelas,

  -- 🔹 DATA PENGAJAR
  p.nama AS nama_pengajar

FROM santri s

LEFT JOIN users u 
  ON u.id_users = s.id_users

LEFT JOIN santri_jadwal sj 
  ON sj.id_santri = s.id_santri

LEFT JOIN jadwal j 
  ON j.id_jadwal = sj.id_jadwal

LEFT JOIN kelas k 
  ON k.id_kelas = j.id_kelas

LEFT JOIN pengajar p 
  ON p.id_pengajar = j.id_pengajar

${whereSQL}

ORDER BY s.id_santri, sj.id_jadwal DESC
LIMIT $${i} OFFSET $${i + 1}
      `,
      [...params, limit, offset]
    );

    // =============================
    // COUNT
    // =============================
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
          s.tanggal_terdaftar,      -- tanggal terdaftar santri

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
  const client = await db.connect();

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

    await client.query("BEGIN");

    // =========================
    // CEK DATA LAMA
    // =========================
    const check = await client.query(
      `
      SELECT s.*, u.id_users, u.email AS user_email
      FROM santri s
      JOIN users u ON s.id_users = u.id_users
      WHERE s.id_santri = $1
      `,
      [id_santri]
    );

    if (check.rowCount === 0) {
      throw new Error("Santri tidak ditemukan");
    }

    const old = check.rows[0];
    const id_users = old.id_users;

    // =========================
    // UPDATE EMAIL USER (JIKA BERUBAH)
    // =========================
    const oldEmail = (old.user_email || "").toLowerCase().trim();
    const newEmail = (user_email || email || "").toLowerCase().trim();

    if (newEmail && newEmail !== oldEmail) {
      const cekEmail = await client.query(
        `SELECT 1 FROM users WHERE email=$1 AND id_users != $2`,
        [newEmail, id_users]
      );

      if (cekEmail.rowCount > 0) {
        throw new Error("Email sudah digunakan user lain");
      }

      await client.query(
        `UPDATE users SET email=$1 WHERE id_users=$2`,
        [newEmail, id_users]
      );
    }

    // =========================
    // STATUS USER
    // =========================
    const finalStatus = status ?? old.status;

    await client.query(
      `UPDATE users SET status_user=$1 WHERE id_users=$2`,
      [finalStatus, id_users]
    );

    // =========================
    // AUTO HITUNG UMUR
    // =========================
    function hitungUmur(tgl) {
      if (!tgl) return null;
      const today = new Date();
      const birth = new Date(tgl);
      let umur = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        umur--;
      }
      return umur;
    }

    let finalKategori = kategori ?? old.kategori;

    if (!kategori && tanggal_lahir) {
      const umur = hitungUmur(tanggal_lahir);
      if (umur !== null) {
        finalKategori = umur >= 14 ? "dewasa" : "anak";
      }
    }

    // =========================
    // UPDATE SANTRI
    // =========================
    await client.query(
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
        nama ?? old.nama,
        finalKategori,
        no_wa ?? old.no_wa,
        email ?? old.email,
        tempat_lahir ?? old.tempat_lahir,
        tanggal_lahir ?? old.tanggal_lahir,
        finalStatus,
        alamat ?? old.alamat,
        id_santri
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Data santri berhasil diperbarui",
      data: {
        id_santri,
        nama: nama ?? old.nama,
        kategori: finalKategori,
        status: finalStatus
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("UPDATE SANTRI ERROR:", err.message);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
};


/* ============================================================
    4. DELETE SANTRI (PERBAIKAN FINAL - CLEANING ALL TABLES)
============================================================ */
exports.deleteSantri = async (req, res) => {
  const client = await db.connect();
  try {
    const { id_santri } = req.params;
    const { confirm_tunggakan, confirm_backup } = req.body;

    // 1. Cek Detail Tunggakan (Infaq Belajar / Lainnya)
    const checkBilling = await client.query(
      `SELECT jenis, COUNT(*) as jml 
       FROM billing_santri 
       WHERE id_santri = $1 AND status = 'belum bayar'
       GROUP BY jenis`,
      [id_santri]
    );

    if (checkBilling.rowCount > 0 && !confirm_tunggakan) {
      // Susun pesan otomatis berdasarkan data di database
      // Hasilnya nanti: "Infaq Belajar (2), Infaq Lainnya (1)"
      const detailTunggakan = checkBilling.rows
        .map(item => `${item.jenis} (${item.jml})`)
        .join(", ");

      return res.status(400).json({ 
        type: "VALIDATION_TUNGGAKAN", 
        message: `Santri memiliki tunggakan: ${detailTunggakan}. Tetap hapus data ini?` 
      });
    }

    // 2. Cek Backup
    if (!confirm_backup) {
      return res.status(400).json({ 
        type: "VALIDATION_BACKUP", 
        message: "Konfirmasi: Apakah Anda sudah melakukan ekspor data (Backup) ke Excel?" 
      });
    }

    await client.query("BEGIN");

    // Ambil info email & id_users sebelum data dihapus
    const checkUser = await client.query(`SELECT id_users, email FROM santri WHERE id_santri = $1`, [id_santri]);
    if (checkUser.rowCount === 0) throw new Error("Santri tidak ditemukan");
    const { id_users, email } = checkUser.rows[0];

    // --- PROSES PEMBERSIHAN BERDASARKAN SKEMA TABEL ---

    // A. Hapus Detail Rapor & Tugas (Level Cucu)
    await client.query(`DELETE FROM tahfidz_simakan WHERE id_rapor IN (SELECT id_rapor FROM rapor_tahfidz WHERE id_santri = $1)`, [id_santri]);
    await client.query(`DELETE FROM pengumpulan_tugas WHERE id_santri = $1`, [id_santri]);

    // B. Hapus Rapor & Progres (Level Anak)
    await client.query(`DELETE FROM rapor_tahfidz WHERE id_santri = $1`, [id_santri]);
    await client.query(`DELETE FROM rapor_tahsin WHERE id_santri = $1`, [id_santri]);
    await client.query(`DELETE FROM progres_pembelajaran WHERE id_santri = $1`, [id_santri]);

    // C. Hapus Keuangan (Pembayaran & Billing)
    await client.query(`DELETE FROM pembayaran WHERE id_santri = $1`, [id_santri]);
    await client.query(`DELETE FROM billing_santri WHERE id_santri = $1`, [id_santri]);

    // D. Hapus Pendaftar (Agar email bisa digunakan kembali)
    if (email) await client.query(`DELETE FROM pendaftar WHERE email = $1`, [email]);

    // E. EKSEKUSI FINAL (Hapus User)
    // Karena tabel 'santri', 'santri_kelas', dan 'absensi' sudah pakai ON DELETE CASCADE ke users,
    // maka kita cukup hapus di tabel users saja.
    if (id_users) {
      await client.query(`DELETE FROM users WHERE id_users = $1`, [id_users]);
    } else {
      await client.query(`DELETE FROM santri WHERE id_santri = $1`, [id_santri]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Seluruh data santri berhasil dibersihkan dari sistem." });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DELETE ERROR:", err.message);
    res.status(500).json({ success: false, message: "Gagal: " + err.message });
  } finally {
    client.release();
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
