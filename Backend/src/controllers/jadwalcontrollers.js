const db = require("../config/db");

// ======================================================
// =====================  ADMIN =========================
// ======================================================

// ➤ Tambah Jadwal
exports.tambahJadwal = async (req, res) => {
  const { id_kelas, hari, jam_mulai, jam_selesai, id_pengajar, kapasitas } = req.body;

  if (!id_kelas || !hari || !jam_mulai || !jam_selesai) {
    return res.status(400).json({ message: "id_kelas, hari, jam_mulai, dan jam_selesai wajib diisi" });
  }

  try {
    const result = await db.query(
      `INSERT INTO jadwal
       (id_kelas, hari, jam_mulai, jam_selesai, id_pengajar, kapasitas)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_jadwal`,
      [id_kelas, hari, jam_mulai, jam_selesai, id_pengajar || null, kapasitas || null]
    );

    res.status(201).json({
      message: "Jadwal berhasil ditambahkan",
      jadwal: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah jadwal" });
  }
};


// ➤ List semua jadwal
// ➤ Ambil Semua Jadwal (Untuk Tabel Admin)
exports.getAllJadwal = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        j.id_jadwal,
        j.id_kelas,        -- 🔥 WAJIB TAMBAH INI
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.kapasitas,
        k.nama_kelas,
        p.nama AS nama_pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON j.id_pengajar = p.id_pengajar
      ORDER BY 
        CASE 
          WHEN j.hari='Senin' THEN 1
          WHEN j.hari='Selasa' THEN 2
          WHEN j.hari='Rabu' THEN 3
          WHEN j.hari='Kamis' THEN 4
          WHEN j.hari='Jumat' THEN 5
          WHEN j.hari='Sabtu' THEN 6
          WHEN j.hari='Minggu' THEN 7
        END, j.jam_mulai ASC
    `);

    res.json({ success: true, data: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data jadwal" });
  }
};

// ➤ Get detail jadwal
exports.getJadwalById = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    const result = await db.query(`
      SELECT 
        j.*,                -- Ini akan mengambil id_pengajar, hari, jam, dll
        k.nama_kelas,
        p.nama AS nama_pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON j.id_pengajar = p.id_pengajar
      WHERE j.id_jadwal = $1
    `, [id_jadwal]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    res.json(result.rows[0]); // Data ini dikirim ke frontend
  } catch (err) {
    console.error("ERR getJadwalById:", err);
    res.status(500).json({ message: "Gagal mengambil detail jadwal" });
  }
};

// ➤ Update jadwal
exports.updateJadwal = async (req, res) => {
  try {
    const { id_jadwal } = req.params;
    const { hari, jam_mulai, jam_selesai, id_pengajar, id_kelas, kapasitas } = req.body;

    const result = await db.query(
      `UPDATE jadwal 
       SET hari=COALESCE($1, hari),
           jam_mulai=COALESCE($2, jam_mulai),
           jam_selesai=COALESCE($3, jam_selesai),
           id_pengajar=COALESCE($4, id_pengajar),
           id_kelas=COALESCE($5, id_kelas),
           kapasitas=COALESCE($6, kapasitas)
       WHERE id_jadwal=$7
       RETURNING id_jadwal`,
      [hari || null, jam_mulai || null, jam_selesai || null, id_pengajar || null, id_kelas || null, kapasitas || null, id_jadwal]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    res.json({ success: true, message: "Jadwal berhasil diupdate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update jadwal" });
  }
};


// ➤ Hapus jadwal
exports.deleteJadwal = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    const result = await db.query(
      "DELETE FROM jadwal WHERE id_jadwal = $1 RETURNING id_jadwal",
      [id_jadwal]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    res.json({ message: "Jadwal berhasil dihapus" });
  } catch (err) {
    console.error("ERR deleteJadwal:", err);
    res.status(500).json({ message: "Gagal menghapus jadwal" });
  }
};

// ➤ Ambil semua sesi jadwal berdasarkan ID Pengajar (Untuk tabel di Modal Edit)
exports.getJadwalByPengajar = async (req, res) => {
  try {
    const { id_pengajar } = req.params;

    const result = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        k.kategori,
        k.nama_kelas
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE j.id_pengajar = $1
      ORDER BY 
        CASE 
          WHEN j.hari='Senin' THEN 1
          WHEN j.hari='Selasa' THEN 2
          WHEN j.hari='Rabu' THEN 3
          WHEN j.hari='Kamis' THEN 4
          WHEN j.hari='Jumat' THEN 5
          WHEN j.hari='Sabtu' THEN 6
          WHEN j.hari='Minggu' THEN 7
        END, j.jam_mulai ASC
    `, [id_pengajar]);

    res.json(result.rows);
  } catch (err) {
    console.error("ERR getJadwalByPengajar:", err);
    res.status(500).json({ message: "Gagal mengambil daftar sesi pengajar" });
  }
};


exports.tambahSantriKeJadwal = async (req, res) => {
  const { id_jadwal } = req.params;
  const { id_santri } = req.body;

  try {
    // Hapus dari sesi lama (kalau ada)
    await db.query(
      `DELETE FROM santri_jadwal WHERE id_santri = $1`,
      [id_santri]
    );

    // Masukkan ke sesi baru
    await db.query(
      `INSERT INTO santri_jadwal (id_santri, id_jadwal)
       VALUES ($1, $2)`,
      [id_santri, id_jadwal]
    );

    res.json({ message: "Santri berhasil dipindahkan ke sesi baru" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memindahkan santri ke sesi" });
  }
};

// ======================================================
// ===================== PENGAJAR =======================
// ======================================================

// ➤ Ambil jadwal milik pengajar (GET /jadwal/pengajar/me)
exports.jadwalPengajar = async (req, res) => {
  try {
    const { id_users } = req.user;

    const pg = await db.query(
      `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
      [id_users]
    );

    if (pg.rowCount === 0) {
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const id_pengajar = pg.rows[0].id_pengajar;

    const result = await db.query(`
      SELECT 
        j.id_jadwal,
        j.id_kelas,            -- 🔥 INI KUNCINYA
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        k.kategori,
        k.nama_kelas
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE j.id_pengajar = $1
      ORDER BY j.hari, j.jam_mulai
    `, [id_pengajar]);

    res.json(result.rows);

  } catch (err) {
    console.error("ERR jadwalPengajar:", err);
    res.status(500).json({ message: "Gagal mengambil jadwal pengajar" });
  }
};


// ➤ Ambil kelas pengajar berdasarkan hari (UNTUK ABSENSI)
exports.jadwalPengajarByHari = async (req, res) => {
  try {
    const { id_users } = req.user;
    const { hari } = req.params;

    const pg = await db.query(
      `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
      [id_users]
    );
    if (pg.rowCount === 0) {
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const id_pengajar = pg.rows[0].id_pengajar;

    const result = await db.query(`
      SELECT DISTINCT
        k.id_kelas,
        k.nama_kelas,
        j.id_jadwal,
        j.jam_mulai,
        j.jam_selesai
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE j.id_pengajar = $1
        AND LOWER(j.hari) = LOWER($2)
      ORDER BY j.jam_mulai ASC
    `, [id_pengajar, hari]);

    res.json({ success: true, data: result.rows });

  } catch (err) {
    console.error("ERR jadwalPengajarByHari:", err);
    res.status(500).json({ message: "Gagal mengambil jadwal berdasarkan hari" });
  }
};


// ======================================================
// ===================== SANTRI =========================
// ======================================================

// ➤ Ambil jadwal santri sendiri
exports.jadwalSantri = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.kapasitas,

        k.nama_kelas,
        k.kategori,

        p.nama AS nama_pengajar,

        s.nama AS nama_santri,
        s.nis,
        s.kategori AS kategori_santri

      FROM santri s
      JOIN santri_jadwal sj ON sj.id_santri = s.id_santri
      JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
      JOIN kelas k ON k.id_kelas = j.id_kelas
      LEFT JOIN pengajar p ON p.id_pengajar = j.id_pengajar

      WHERE s.id_users = $1

      ORDER BY 
        CASE 
          WHEN j.hari='Senin' THEN 1
          WHEN j.hari='Selasa' THEN 2
          WHEN j.hari='Rabu' THEN 3
          WHEN j.hari='Kamis' THEN 4
          WHEN j.hari='Jumat' THEN 5
          WHEN j.hari='Sabtu' THEN 6
          WHEN j.hari='Minggu' THEN 7
        END,
        j.jam_mulai
    `, [req.user.id_users]);

    res.json(result.rows);

  } catch (err) {
    console.error("ERR jadwalSantri:", err);
    res.status(500).json({ message: "Gagal mengambil jadwal santri" });
  }
};

exports.getSantriByJadwal = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    const result = await db.query(`
      SELECT 
        s.id_santri,
        s.nama
      FROM santri s
      JOIN santri_jadwal sj ON sj.id_santri = s.id_santri
      WHERE sj.id_jadwal = $1
      ORDER BY s.nama ASC
    `, [id_jadwal]);

    res.json({ success: true, data: result.rows });

  } catch (err) {
    console.error("🔥 ERROR getSantriByJadwal:", err);
    res.status(500).json({ message: "Gagal mengambil santri" });
  }
};