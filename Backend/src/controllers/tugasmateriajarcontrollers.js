const db = require("../config/db");
const path = require("path"); // Tambahkan ini
const fs = require("fs");

// Helper internal untuk mendapatkan ID Pengajar/Santri dari ID Users
async function getRoleSpecificId(id_users, role) {
  if (role === "pengajar") {
    const res = await db.query("SELECT id_pengajar FROM pengajar WHERE id_users = $1", [id_users]);
    return res.rows[0]?.id_pengajar;
  } else if (role === "santri") {
    const res = await db.query("SELECT id_santri FROM santri WHERE id_users = $1", [id_users]);
    return res.rows[0]?.id_santri;
  }
  return null;
}

// ============================================================
// PENGAJAR - UPLOAD MATERI (Fix id_pengajar & Opsionalitas)
// ============================================================
exports.uploadMateri = async (req, res) => {
  try {
    const { id_jadwal, judul, deskripsi, tipe_file, tipe_konten, link_url, tanggal_manual } = req.body;

    if (!id_jadwal)
      return res.status(400).json({ error: "id_jadwal wajib diisi" });

    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    let filePath = null;
    if (tipe_konten === "file") {
      if (!req.file)
        return res.status(400).json({ error: "File wajib diunggah" });
      filePath = req.file.filename;
    }

    const finalDate = tanggal_manual ? new Date(tanggal_manual) : new Date();

    await db.query(
      `INSERT INTO materi_ajar
       (id_kelas, id_jadwal, id_pengajar, judul, deskripsi, tipe_file, tipe_konten, file_path, link_url, created_at)
       VALUES (
         (SELECT id_kelas FROM jadwal WHERE id_jadwal = $1),
         $1,$2,$3,$4,$5,$6,$7,$8,$9
       )`,
      [
        id_jadwal,
        id_pengajar,
        judul,
        deskripsi,
        tipe_file || "materi",
        tipe_konten,
        filePath,
        link_url || null,
        finalDate
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("UPLOAD MATERI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// PENGAJAR - BUAT TUGAS
// ============================================================
exports.createTugas = async (req, res) => {
  try {
    const { id_jadwal, id_materi, deskripsi, deadline } = req.body;

    if (!id_jadwal)
      return res.status(400).json({ error: "id_jadwal wajib" });

    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    const filePath = req.file ? req.file.filename : null;
    const linkUrl = req.body.link_url || null;

    const result = await db.query(
      `INSERT INTO tugas
       (id_kelas, id_jadwal, id_materi, id_pengajar, deskripsi, deadline, file_path, link_url)
       VALUES (
         (SELECT id_kelas FROM jadwal WHERE id_jadwal = $1),
         $1,$2,$3,$4,$5,$6,$7
       )
       RETURNING *`,
      [
        id_jadwal,
        id_materi,
        id_pengajar,
        deskripsi,
        deadline,
        filePath,
        linkUrl
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("CREATE TUGAS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTugasByMateri = async (req, res) => {
  try {
    const id_materi = req.params.id;

    if (!id_materi) {
      return res.status(400).json({ error: "id_materi wajib" });
    }

    const result = await db.query(
      `SELECT id_tugas, id_materi, deskripsi, deadline, file_path, link_url
FROM tugas
WHERE id_materi = $1
       ORDER BY created_at DESC`,
      [id_materi]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET TUGAS BY MATERI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


// ============================================================
// PENGAJAR - LIHAT MATERI & TUGAS SENDIRI
// ============================================================
// Di tugasmateriajarcontrollers.js
exports.getMateriByJadwalPengajar = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    const result = await db.query(`
      SELECT DISTINCT ON (m.id_materi)
        m.id_materi,
        m.judul,
        m.deskripsi,
        m.file_path,
        m.link_url,
        m.tipe_konten,
        m.created_at,
        t.id_tugas
      FROM materi_ajar m
      LEFT JOIN tugas t ON m.id_materi = t.id_materi
      WHERE m.id_jadwal = $1
      ORDER BY m.id_materi, m.created_at DESC
    `, [id_jadwal]);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTugasByKelasPengajar = async (req, res) => {
  try {
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");
    const result = await db.query(
      `SELECT * FROM tugas WHERE id_kelas = $1 AND id_pengajar = $2 ORDER BY created_at DESC`,
      [req.params.id, id_pengajar]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ... (kode yang sudah ada tetap dipertahankan)

// ===============================
// PENGAJAR - UPDATE MATERI
// ===============================
exports.updateMateri = async (req, res) => {
  try {
    const { judul, deskripsi, tipe_konten, link_url } = req.body;
    const { id } = req.params;
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    // 1. Ambil data materi lama untuk mendapatkan nama file
    const oldMateri = await db.query("SELECT file_path FROM materi_ajar WHERE id_materi = $1", [id]);
    const oldFileName = oldMateri.rows[0]?.file_path;

    let query = `UPDATE materi_ajar SET judul=$1, deskripsi=$2, tipe_konten=$3, link_url=$4`;
    let params = [judul, deskripsi, tipe_konten, link_url || null];

    if (req.file) {
      // 2. Jika ada file baru, hapus file fisik yang lama
      if (oldFileName) deletePhysicalFile(oldFileName, "materi");

      query += `, file_path=$5 WHERE id_materi=$6 AND id_pengajar=$7`;
      params.push(req.file.filename, id, id_pengajar);
    } else {
      query += ` WHERE id_materi=$5 AND id_pengajar=$6`;
      params.push(id, id_pengajar);
    }

    const result = await db.query(query, params);
    if (result.rowCount === 0) return res.status(404).json({ error: "Materi tidak ditemukan" });

    res.json({ success: true, message: "Materi diperbarui dan file lama dibersihkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ===============================
// PENGAJAR - UPDATE TUGAS
// ===============================
exports.updateTugas = async (req, res) => {
  try {
    const { id } = req.params; // id_tugas
    const { deskripsi, deadline, link_url } = req.body; // 🔥 Pastikan 'deadline' ada di sini
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    if (!id_pengajar) return res.status(403).json({ error: "Akses ditolak" });

    // Validasi ketat di backend
    if (!deadline) {
      return res.status(400).json({ error: "Deadline wajib diisi" });
    }

    const oldTugas = await db.query("SELECT file_path FROM tugas WHERE id_tugas = $1", [id]);
    const oldFileName = oldTugas.rows[0]?.file_path;
    // ----------------------------

    let query;
    let params;

    if (req.file) {
      // 2. Jika ada file baru, hapus file lama secara fisik
      if (oldFileName) deletePhysicalFile(oldFileName, "tugas");

      query = `UPDATE tugas SET deskripsi=$1, deadline=$2, link_url=$3, file_path=$4 
               WHERE id_tugas=$5 AND id_pengajar=$6 RETURNING *`;
      params = [deskripsi, deadline, link_url || null, req.file.filename, id, id_pengajar];
    } else {
      query = `UPDATE tugas SET deskripsi=$1, deadline=$2, link_url=$3 
               WHERE id_tugas=$4 AND id_pengajar=$5 RETURNING *`;
      params = [deskripsi, deadline, link_url || null, id, id_pengajar];
    }

    const result = await db.query(query, params);
    if (result.rowCount === 0) return res.status(404).json({ error: "Tugas tidak ditemukan" });

    res.json({ success: true, message: "Tugas berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// SANTRI - SUBMIT TUGAS (Opsionalitas File/Link)
// ============================================================
exports.submitTugasSantri = async (req, res) => {
  try {
    const { id_tugas } = req.body;
    const id_santri = await getRoleSpecificId(req.user.id_users, "santri");

    // 1️⃣ Ambil deadline tugas
    const tugas = await db.query(
      `SELECT deadline FROM tugas WHERE id_tugas = $1`,
      [id_tugas]
    );

    if (!tugas.rows.length) {
      return res.status(404).json({ error: "Tugas tidak ditemukan" });
    }

    const deadline = new Date(tugas.rows[0].deadline);
    const now = new Date();

    // 2️⃣ CEK DEADLINE
    if (now > deadline) {
      return res.status(403).json({
        error: "Waktu pengumpulan telah berakhir"
      });
    }

    // 3️⃣ CEK SUDAH KIRIM
    const cek = await db.query(
      `SELECT id_pengumpulan FROM pengumpulan_tugas 
       WHERE id_tugas = $1 AND id_santri = $2`,
      [id_tugas, id_santri]
    );

    if (cek.rows.length > 0) {
      return res.status(409).json({
        error: "Tugas sudah dikirim"
      });
    }

    // 4️⃣ SIMPAN PENGUMPULAN
    const sekarang = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });

    await db.query(
      `INSERT INTO pengumpulan_tugas (id_tugas, id_santri, file_path, link_url, jawaban_teks, submitted_at)
   VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id_tugas,
        id_santri,
        req.file?.filename || null,
        req.body.link_url || null,
        req.body.jawaban_teks || null,
        sekarang // Memaksa jam Jakarta masuk ke kolom submitted_at
      ]
    );


    res.json({ success: true, message: "Tugas berhasil dikirim" });

  } catch (err) {
    console.error("SUBMIT TUGAS ERROR:", err);
    res.status(500).json({ error: "Gagal mengirim tugas" });
  }
};


// Fungsi lain (updateTugas, getStatusPengumpulan, dll) tinggal menyesuaikan pemanggilan id_pengajar
// ===============================
// SANTRI - LIHAT / DOWNLOAD MATERI
// ===============================
exports.getMateriByJadwalForSantri = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    const result = await db.query(`
      SELECT DISTINCT ON (m.id_materi)
        m.id_materi,
        m.judul,
        m.deskripsi,
        m.file_path,
        m.link_url,
        m.created_at,

        t.id_tugas,
        t.deskripsi AS instruksi_tugas,
        t.deadline,
        t.file_path AS file_tugas,
        t.link_url AS link_tugas

      FROM materi_ajar m
      LEFT JOIN tugas t ON t.id_materi = m.id_materi
      WHERE m.id_jadwal = $1
      ORDER BY m.id_materi, t.created_at DESC
    `, [id_jadwal]);

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ===============================
// SANTRI - LIHAT TUGAS
// ===============================
exports.getTugasByKelas = async (req, res) => {
  try {
    const { id } = req.params; // id_kelas
    const result = await db.query(
      `SELECT * FROM tugas WHERE id_kelas = $1 ORDER BY deadline ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================ MY SUBMIT (LIHAT TUGAS SENDIRI) ===================
exports.getMySubmission = async (req, res) => {
  try {
    const { id_tugas } = req.params;
    const id_santri = await getRoleSpecificId(req.user.id_users, "santri");

    const result = await db.query(
      `SELECT 
        pt.file_path,
        pt.link_url,
        pt.submitted_at,
        pt.nilai,
        pt.jawaban_teks, -- JANGAN PAKAI ALIAS BERBEDA
        pt.catatan_pengajar
       FROM pengumpulan_tugas pt
       WHERE pt.id_tugas = $1
         AND pt.id_santri = $2`,
      [id_tugas, id_santri]
    );

    if (!result.rows.length) {
      return res.json({ submitted: false });
    }

    res.json({
      submitted: true,
      data: result.rows[0] // data.jawaban_teks sekarang tersedia
    });

  } catch (err) {
    console.error("GET MY SUBMISSION ERROR:", err);
    res.status(500).json({ error: "Gagal memuat submission" });
  }
};

// ===============================
// PENGAJAR - LIHAT STATUS PENGUMPULAN
// ===============================
// Backend/src/controllers/tugasmateriajarcontrollers.js

exports.getStatusPengumpulan = async (req, res) => {
  try {
    const { id } = req.params;

    const tugasRes = await db.query(
      `SELECT id_jadwal FROM tugas WHERE id_tugas = $1`,
      [id]
    );

    if (!tugasRes.rowCount)
      return res.status(404).json({ message: "Tugas tidak ditemukan" });

    const id_jadwal = tugasRes.rows[0].id_jadwal;

    const result = await db.query(`
      SELECT 
        s.id_santri,
        s.nama,
        pt.file_path,
        pt.link_url,
        pt.submitted_at,
        CASE 
          WHEN pt.id_pengumpulan IS NOT NULL THEN 'Sudah Kirim'
          ELSE 'Belum Kirim'
        END AS status
      FROM santri_jadwal sj
      JOIN santri s ON s.id_santri = sj.id_santri
      LEFT JOIN pengumpulan_tugas pt 
        ON pt.id_santri = s.id_santri 
        AND pt.id_tugas = $1
      WHERE sj.id_jadwal = $2
      ORDER BY s.nama ASC
    `, [id, id_jadwal]);

    res.json(result.rows);

  } catch (err) {
    console.error("GET STATUS ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil status pengumpulan" });
  }
};

// Gunakan kata kunci 'function' agar bisa dipanggil dari baris mana pun
function deletePhysicalFile(fileName, subFolder) {
  if (!fileName) return;
  try {
    const filePath = path.join(__dirname, "../../public/uploads", subFolder, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ File lama dihapus: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Gagal menghapus file fisik: ${error.message}`);
  }
}

exports.getMateriByJadwal = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    // 1️⃣ Ambil id_kelas dari jadwal
    const kelasRes = await db.query(
      `SELECT id_kelas FROM jadwal WHERE id_jadwal = $1`,
      [id_jadwal]
    );

    if (kelasRes.rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    const id_kelas = kelasRes.rows[0].id_kelas;

    // 2️⃣ Ambil materi berdasarkan kelas
    const materiRes = await db.query(`
      SELECT 
        m.id_materi,
        m.judul,
        m.deskripsi,
        m.file_path,
        m.link_url,
        m.created_at,
        k.nama_kelas,

        t.id_tugas,
        t.deskripsi AS instruksi_tugas,
        t.deadline AS deadline_tugas,
        t.file_path AS file_tugas,
        t.link_url AS link_tugas

      FROM materi_ajar m
      JOIN kelas k ON m.id_kelas = k.id_kelas
      LEFT JOIN tugas t ON t.id_materi = m.id_materi
      WHERE m.id_kelas = $1
      ORDER BY m.created_at DESC
    `, [id_kelas]);

    res.json(materiRes.rows);

  } catch (err) {
    console.error("GET MATERI BY JADWAL ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil materi" });
  }
};