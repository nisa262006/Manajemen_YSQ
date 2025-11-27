const db = require("../config/db");

// ===================== ADMIN =============================

// Tambah jadwal
exports.tambahJadwal = async (req, res) => {
  const { id_kelas, hari, jam_mulai, jam_selesai, lokasi } = req.body;

  await db.query(
    `INSERT INTO jadwal(id_kelas, hari, jam_mulai, jam_selesai, lokasi)
     VALUES($1,$2,$3,$4,$5)`,
    [id_kelas, hari, jam_mulai, jam_selesai, lokasi]
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
    LEFT JOIN pengajar p ON p.id_pengajar = k.id_pengajar
    ORDER BY j.id_jadwal ASC
  `);

  res.json(result.rows);
};

// Update jadwal
exports.updateJadwal = async (req, res) => {
  const { id_jadwal } = req.params;
  const { hari, jam_mulai, jam_selesai, lokasi } = req.body;

  await db.query(
    `UPDATE jadwal 
     SET hari=$1, jam_mulai=$2, jam_selesai=$3, lokasi=$4
     WHERE id_jadwal=$5`,
    [hari, jam_mulai, jam_selesai, lokasi, id_jadwal]
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
  const { id_users } = req.users;

  const result = await db.query(
    `SELECT j.*, k.nama_kelas 
     FROM jadwal j
     JOIN kelas k ON j.id_kelas = k.id_kelas
     JOIN pengajar p ON p.id_pengajar = k.id_pengajar
     WHERE p.id_users = $1`,
    [id_users]
  );

  res.json(result.rows);
};


// ===================== SANTRI =============================

// Jadwal kelas santri sendiri
exports.jadwalSantri = async (req, res) => {
  const { id_users } = req.users;

  const result = await db.query(
    `SELECT j.*, k.nama_kelas
     FROM jadwal j
     JOIN kelas k ON j.id_kelas = k.id_kelas
     JOIN santri_kelas sk ON sk.id_kelas = k.id_kelas
     JOIN santri s ON s.id_santri = sk.id_santri
     WHERE s.id_users = $1`,
    [id_users]
  );

  res.json(result.rows);
};
