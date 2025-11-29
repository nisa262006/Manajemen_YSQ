const db = require("../config/db");

// ===================== ADMIN =============================

// Tambah jadwal
exports.tambahJadwal = async (req, res) => {
  const { id_kelas, hari, jam_mulai, jam_selesai, lokasi, id_pengajar } = req.body;

  await db.query(
    `INSERT INTO jadwal(id_kelas, hari, jam_mulai, jam_selesai, lokasi, id_pengajar)
     VALUES($1,$2,$3,$4,$5,$6)`,
    [id_kelas, hari, jam_mulai, jam_selesai, lokasi, id_pengajar]
  );

  res.json({ message: "Jadwal berhasil ditambahkan" });
};

// List semua jadwal
exports.getAllJadwal = async (req, res) => {
  const result = await db.query(`
    SELECT 
      j.*,
      k.nama_kelas,
      p.nama AS pengajar
    FROM jadwal j
    JOIN kelas k ON j.id_kelas = k.id_kelas
    LEFT JOIN pengajar p ON p.id_pengajar = j.id_pengajar
    ORDER BY j.id_jadwal ASC
  `);

  res.json(result.rows);
};

// Update jadwal
exports.updateJadwal = async (req, res) => {
  const { id_jadwal } = req.params;
  const { hari, jam_mulai, jam_selesai, lokasi, id_pengajar } = req.body;

  await db.query(
    `UPDATE jadwal 
     SET hari=$1, jam_mulai=$2, jam_selesai=$3, lokasi=$4, id_pengajar=$5
     WHERE id_jadwal=$6`,
    [hari, jam_mulai, jam_selesai, lokasi, id_pengajar, id_jadwal]
  );

  res.json({ message: "Jadwal berhasil diupdate" });
};

// Delete jadwal
exports.deleteJadwal = async (req, res) => {
  const { id_jadwal } = req.params;

  await db.query("DELETE FROM jadwal WHERE id_jadwal = $1", [id_jadwal]);

  res.json({ message: "Jadwal berhasil dihapus" });
};


// ===================== PENGAJAR =============================

// Jadwal kelas pengajar
exports.jadwalPengajar = async (req, res) => {
  try {
    const { id_users } = req.users;

    // Dapatkan id_pengajar dulu
    const pg = await db.query(
      `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
      [id_users]
    );

    if (pg.rowCount === 0) {
      return res.status(404).json({ message: "Pengajar tidak ditemukan" });
    }

    const id_pengajar = pg.rows[0].id_pengajar;

    // Ambil jadwal pengajar
    const result = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.lokasi,
        k.nama_kelas,
        p.nama AS nama_pengajar
      FROM jadwal j
      LEFT JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON j.id_pengajar = p.id_pengajar
      WHERE j.id_pengajar = $1
      ORDER BY j.hari, j.jam_mulai
    `, [id_pengajar]);

    res.json(result.rows);

  } catch (err) {
    console.error("ERR jadwalPengajar:", err);
    res.status(500).json({ message: "Gagal mengambil jadwal pengajar" });
  }
};


// ===================== SANTRI =============================

// Jadwal kelas santri sendiri
exports.jadwalSantri = async (req, res) => {
  const { id_users } = req.users;

  const result = await db.query(
    `SELECT 
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
    WHERE s.id_users = $1`,
    [id_users]
  );

  res.json(result.rows);
};
