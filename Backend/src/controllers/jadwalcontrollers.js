const db = require("../config/db");

// ===================== ADMIN =============================

// Tambah jadwal
exports.tambahJadwal = async (req, res) => {
  const { id_kelas, hari, jam_mulai, jam_selesai } = req.body;

  await db.query(
    "INSERT INTO jadwal(id_kelas, hari, jam_mulai, jam_selesai) VALUES($1,$2,$3,$4)",
    [id_kelas, hari, jam_mulai, jam_selesai]
  );

  res.json({ message: "Jadwal berhasil ditambahkan" });
};

// List semua jadwal
exports.getAllJadwal = async (req, res) => {
  const result = await db.query(`
    SELECT 
      j.*,
      k.nama_kelas,
      u.nama_lengkap AS pengajar
    FROM jadwal j
    JOIN kelas k ON j.id_kelas = k.id_kelas
    LEFT JOIN users u ON k.id_pengajar = u.id_user
    ORDER BY j.id_jadwal ASC
  `);

  res.json(result.rows);
};

// Update jadwal
exports.updateJadwal = async (req, res) => {
  const { id_jadwal } = req.params;
  const { hari, jam_mulai, jam_selesai } = req.body;

  await db.query(
    "UPDATE jadwal SET hari = $1, jam_mulai = $2, jam_selesai = $3 WHERE id_jadwal = $4",
    [hari, jam_mulai, jam_selesai, id_jadwal]
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
  const { id_user } = req.user;

  const result = await db.query(
    `SELECT j.*, k.nama_kelas 
     FROM jadwal j
     JOIN kelas k ON j.id_kelas = k.id_kelas
     WHERE k.id_pengajar = $1`,
    [id_user]
  );

  res.json(result.rows);
};


// ===================== SANTRI =============================

// Jadwal kelas santri
exports.jadwalSantri = async (req, res) => {
  const { id_user } = req.user;

  const result = await db.query(
    `SELECT j.*, k.nama_kelas 
     FROM jadwal j
     JOIN kelas k ON j.id_kelas = k.id_kelas
     JOIN santri s ON s.id_kelas = k.id_kelas
     WHERE s.id_user = $1`,
    [id_user]
  );

  res.json(result.rows);
};
