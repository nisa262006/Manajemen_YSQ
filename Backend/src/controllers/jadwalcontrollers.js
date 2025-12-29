const db = require("../config/db");

// ======================================================
// =====================  ADMIN =========================
// ======================================================

// ➤ Tambah Jadwal
exports.tambahJadwal = async (req, res) => {
  try {
    const { id_kelas, hari, jam_mulai, jam_selesai, kategori, id_pengajar } = req.body;

    if (!id_kelas || !hari || !jam_mulai || !jam_selesai || !kategori) {
      return res.status(400).json({ message: "Lengkapi semua field jadwal" });
    }

    await db.query(
      `INSERT INTO jadwal(id_kelas, hari, jam_mulai, jam_selesai, kategori, id_pengajar)
       VALUES($1,$2,$3,$4,$5,$6)`,
      [id_kelas, hari, jam_mulai, jam_selesai, kategori, id_pengajar]
    );

    res.json({ message: "Jadwal berhasil ditambahkan" });

  } catch (err) {
    console.error("ERR tambahJadwal:", err);
    res.status(500).json({ message: "Gagal menambah jadwal" });
  }
};


// ➤ List semua jadwal
exports.getAllJadwal = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        j.*,
        k.nama_kelas,
        k.kapasitas,
        p.nama AS nama_pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON p.id_pengajar = j.id_pengajar
      ORDER BY j.id_jadwal ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("ERR getAllJadwal:", err);
    res.status(500).json({ message: "Gagal mengambil jadwal" });
  }
};


// ➤ Get detail jadwal
exports.getJadwalById = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    const result = await db.query(`
      SELECT 
        j.*,
        k.nama_kelas,
        k.kapasitas,
        p.nama AS nama_pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON j.id_pengajar = p.id_pengajar
      WHERE j.id_jadwal = $1
    `, [id_jadwal]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ERR getJadwalById:", err);
    res.status(500).json({ message: "Gagal mengambil detail jadwal" });
  }
};


// ➤ Update jadwal
exports.updateJadwal = async (req, res) => {
  try {
    const { id_jadwal } = req.params;
    const { hari, jam_mulai, jam_selesai, kategori, id_pengajar } = req.body;

    await db.query(
      `UPDATE jadwal 
       SET hari=$1, jam_mulai=$2, jam_selesai=$3, kategori=$4, id_pengajar=$5
       WHERE id_jadwal=$6`,
      [hari, jam_mulai, jam_selesai, kategori, id_pengajar, id_jadwal]
    );

    res.json({ message: "Jadwal berhasil diupdate" });
  } catch (err) {
    console.error("ERR updateJadwal:", err);
    res.status(500).json({ message: "Gagal update jadwal" });
  }
};


// ➤ Hapus jadwal
exports.deleteJadwal = async (req, res) => {
  try {
    const { id_jadwal } = req.params;

    await db.query("DELETE FROM jadwal WHERE id_jadwal = $1", [id_jadwal]);

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
        j.kategori,
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
        j.kategori,
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
    const { id_users } = req.user;

    const result = await db.query(`
      SELECT 
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        k.nama_kelas,
        p.nama AS nama_pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON p.id_pengajar = j.id_pengajar
      JOIN santri_kelas sk ON sk.id_kelas = k.id_kelas
      JOIN santri s ON s.id_santri = sk.id_santri
      WHERE s.id_users = $1
    `, [id_users]);

    res.json(result.rows);

  } catch (err) {
    console.error("ERR jadwalSantri:", err);
    res.status(500).json({ message: "Gagal mengambil jadwal santri" });
  }
};
