const db = require("../config/db");

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
    const { id_kelas, judul, deskripsi, tipe_file, tipe_konten, link_url } = req.body;
    
    // Ambil ID Pengajar otomatis dari id_users di token
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    if (!id_pengajar) {
      return res.status(403).json({ error: "Hanya pengajar terdaftar yang bisa upload materi" });
    }

    let filePath = null;
    if (tipe_konten === "file") {
      if (!req.file) return res.status(400).json({ error: "File wajib diunggah untuk tipe konten file" });
      filePath = req.file.filename;
    }

    await db.query(
      `INSERT INTO materi_ajar
       (id_kelas, id_pengajar, judul, deskripsi, tipe_file, tipe_konten, file_path, link_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id_kelas,
        id_pengajar,
        judul,
        deskripsi,
        tipe_file || "materi",
        tipe_konten,
        filePath,         // Akan null jika tipe_konten = 'link'
        link_url || null  // Akan null jika tipe_konten = 'file'
      ]
    );

    res.json({ success: true, message: "Materi berhasil disimpan" });
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
    const { id_kelas, id_materi, judul, deskripsi, deadline } = req.body;

if (!id_materi)
  return res.status(400).json({ message: "id_materi wajib" });

    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    if (!id_pengajar) {
      return res.status(403).json({ error: "Pengajar tidak valid" });
    }

    const filePath = req.file ? req.file.filename : null;
    const linkUrl = req.body.link_url || null;

    const result = await db.query(
      `INSERT INTO tugas
       (id_kelas, id_materi, id_pengajar, judul, deskripsi, deadline, file_path, link_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        id_kelas,
        id_materi,
        id_pengajar, // ✅ BENAR
        judul,
        deskripsi,
        deadline,
        filePath,
        linkUrl
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
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
exports.getMateriByKelasPengajar = async (req, res) => {
  try {
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");
    const result = await db.query(
      `SELECT * FROM materi_ajar WHERE id_kelas = $1 AND id_pengajar = $2 ORDER BY created_at DESC`,
      [req.params.id, id_pengajar]
    );
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
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    // Jika ada file baru diunggah, gunakan file baru, jika tidak tetap gunakan yang lama (logika sederhana)
    let query = `UPDATE materi_ajar SET judul=$1, deskripsi=$2, tipe_konten=$3, link_url=$4`;
    let params = [judul, deskripsi, tipe_konten, link_url || null];

    if (req.file) {
      query += `, file_path=$5 WHERE id_materi=$6 AND id_pengajar=$7`;
      params.push(req.file.filename, req.params.id, id_pengajar);
    } else {
      query += ` WHERE id_materi=$5 AND id_pengajar=$6`;
      params.push(req.params.id, id_pengajar);
    }

    await db.query(query, params);
    res.json({ success: true, message: "Materi berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// PENGAJAR - UPDATE TUGAS
// ===============================
exports.updateTugas = async (req, res) => {
  try {
    const { judul, deskripsi, deadline } = req.body;
    const id_pengajar = await getRoleSpecificId(req.user.id_users, "pengajar");

    await db.query(
      `UPDATE tugas SET judul=$1, deskripsi=$2, deadline=$3 
       WHERE id_tugas=$4 AND id_pengajar=$5`,
      [judul, deskripsi, deadline, req.params.id, id_pengajar]
    );

    res.json({ success: true, message: "Tugas berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// SANTRI - SUBMIT TUGAS (Opsionalitas File/Link)
// ============================================================
exports.submitTugas = async (req, res) => {
  try {
    const { tipe_konten, link_url } = req.body;
    const id_santri = await getRoleSpecificId(req.user.id_users, "santri");

    let filePath = null;
    if (tipe_konten === "file") {
      if (!req.file) return res.status(400).json({ error: "File tugas wajib ada" });
      filePath = req.file.filename;
    }

    await db.query(
      `INSERT INTO pengumpulan_tugas
       (id_tugas, id_santri, tipe_konten, file_path, link_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, id_santri, tipe_konten, filePath, link_url || null]
    );

    res.json({ success: true, message: "Tugas berhasil dikumpulkan" });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Tugas sudah dikumpulkan sebelumnya" });
    res.status(500).json({ error: err.message });
  }
};

// Fungsi lain (updateTugas, getStatusPengumpulan, dll) tinggal menyesuaikan pemanggilan id_pengajar
// ===============================
// SANTRI - LIHAT / DOWNLOAD MATERI
// ===============================
exports.getMateriByKelas = async (req, res) => {
  const result = await db.query(
    `SELECT id_materi, judul, deskripsi, tipe_file, tipe_konten, file_path, link_url, created_at
     FROM materi_ajar
     WHERE id_kelas = $1
     ORDER BY created_at DESC`,
    [req.params.id]
  );

  res.json(result.rows);
};

// ===============================
// SANTRI - LIHAT TUGAS
// ===============================
exports.getTugasByKelas = async (req, res) => {
  const result = await db.query(
    `SELECT id_tugas, judul, deskripsi, deadline, tipe_tugas
     FROM tugas
     WHERE id_kelas = $1`,
    [req.params.id]
  );

  res.json(result.rows);
};

// ===============================
// PENGAJAR - LIHAT STATUS PENGUMPULAN
// ===============================
// Backend/src/controllers/tugasmateriajarcontrollers.js

exports.getStatusPengumpulan = async (req, res) => {
  try {
    const { id } = req.params; // id_tugas

    // Query ini mengambil semua santri yang terdaftar di kelas tempat tugas tersebut berada
    const result = await db.query(
      `SELECT 
        s.nama,
        pt.submitted_at,
        pt.file_path,
        pt.link_url,
        CASE 
          WHEN pt.id_pengumpulan IS NOT NULL THEN 'Sudah Kirim'
          ELSE 'Belum Kirim'
        END AS status
      FROM tugas t
      JOIN santri_kelas sk ON t.id_kelas = sk.id_kelas
      JOIN santri s ON sk.id_santri = s.id_santri
      LEFT JOIN pengumpulan_tugas pt ON t.id_tugas = pt.id_tugas AND s.id_santri = pt.id_santri
      WHERE t.id_tugas = $1`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};