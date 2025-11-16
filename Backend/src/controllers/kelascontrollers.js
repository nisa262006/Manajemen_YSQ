const db = require("../config/db");

// ===================== ADMIN ===============================

// Tambah kelas
exports.tambahKelas = async (req, res) => {
  const { nama_kelas, kapasitas, id_pengajar } = req.body;

  await db.query(
    "INSERT INTO kelas(nama_kelas, kapasitas, id_pengajar) VALUES($1,$2,$3)",
    [nama_kelas, kapasitas, id_pengajar]
  );

  res.json({ message: "Kelas berhasil ditambahkan" });
};


// List kelas
exports.getAllKelas = async (req, res) => {
  const result = await db.query(`
    SELECT 
      k.id_kelas, 
      k.nama_kelas, 
      k.kapasitas,
      u.nama_lengkap AS pengajar
    FROM kelas k
    LEFT JOIN users u ON k.id_pengajar = u.id_user
    ORDER BY k.id_kelas ASC
  `);

  res.json(result.rows);
};


// Detail kelas (santri + jadwal)
exports.getDetailKelas = async (req, res) => {
  const { id_kelas } = req.params;

  const kelas = await db.query("SELECT * FROM kelas WHERE id_kelas = $1", [id_kelas]);
  if (kelas.rowCount === 0)
    return res.status(404).json({ message: "Kelas tidak ditemukan" });

  const santri = await db.query(
    "SELECT id_santri, nama FROM santri WHERE id_kelas = $1",
    [id_kelas]
  );

  const jadwal = await db.query(
    "SELECT * FROM jadwal WHERE id_kelas = $1",
    [id_kelas]
  );

  res.json({
    kelas: kelas.rows[0],
    santri: santri.rows,
    jadwal: jadwal.rows
  });
};


// Update kelas
exports.updateKelas = async (req, res) => {
  const { id_kelas } = req.params;
  const { nama_kelas, kapasitas, id_pengajar } = req.body;

  await db.query(
    `UPDATE kelas 
     SET nama_kelas = $1, kapasitas = $2, id_pengajar = $3 
     WHERE id_kelas = $4`,
    [nama_kelas, kapasitas, id_pengajar, id_kelas]
  );

  res.json({ message: "Kelas berhasil diupdate" });
};


// Hapus kelas
exports.deleteKelas = async (req, res) => {
  const { id_kelas } = req.params;

  await db.query("DELETE FROM kelas WHERE id_kelas = $1", [id_kelas]);

  res.json({ message: "Kelas berhasil dihapus" });
};


// Tambah santri ke kelas
exports.tambahSantriKeKelas = async (req, res) => {
  const { id_kelas } = req.params;
  const { id_santri } = req.body;

  await db.query(
    "UPDATE santri SET id_kelas = $1 WHERE id_santri = $2",
    [id_kelas, id_santri]
  );

  res.json({ message: "Santri ditambahkan ke kelas" });
};


// Pindah santri antar kelas
exports.pindahSantriKelas = async (req, res) => {
  const { id_santri } = req.params;
  const { id_kelas_baru } = req.body;

  await db.query(
    "UPDATE santri SET id_kelas = $1 WHERE id_santri = $2",
    [id_kelas_baru, id_santri]
  );

  res.json({ message: "Santri berhasil dipindahkan" });
};



// ===================== PENGAJAR ===============================

// Melihat kelas miliknya
exports.kelasPengajar = async (req, res) => {
  const result = await db.query(
    "SELECT * FROM kelas WHERE id_pengajar = $1",
    [req.user.id_user]
  );

  res.json(result.rows);
};



// ===================== SANTRI ===============================

// ===================== SANTRI ===============================

// Santri lihat kelas miliknya
exports.kelasSantri = async (req, res) => {
  try {
    console.log("USER:", req.user); // debugging

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({ message: "User tidak terautentikasi" });
    }

    const result = await db.query(
      `SELECT k.* 
       FROM kelas k
       JOIN santri s ON k.id_kelas = s.id_kelas
       WHERE s.id_user = $1`,
      [req.user.id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Santri belum punya kelas." });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server", error });
  }
};

