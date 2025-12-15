const db = require("../config/db");

/* ============================================================================
   HELPER → AMBIL id_pengajar DARI TOKEN
============================================================================ */
async function getIdPengajar(id_users) {
  const q = await db.query(
    `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
    [id_users]
  );

  if (q.rowCount === 0) return null;
  return q.rows[0].id_pengajar;
}

/* ============================================================================
   PENGAJAR → MENCATAT ABSENSI SANTRI
============================================================================ */

exports.catatAbsensiSantri = async (req, res) => {
  try {
    const { id_santri, id_jadwal, tanggal, status_absensi, catatan } = req.body;
    const id_users = req.users.id_users;

    // Ambil id_pengajar asli
    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    // 1. Validasi jadwal milik pengajar
    const cekJadwal = await db.query(`
      SELECT j.id_jadwal 
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE j.id_jadwal = $1 AND k.id_pengajar = $2
    `, [id_jadwal, id_pengajar]);

    if (cekJadwal.rowCount === 0)
      return res.status(403).json({ message: "Jadwal bukan milik Anda" });

    // 2. Pastikan santri terdaftar di kelas ini
    const cekSantri = await db.query(`
      SELECT sk.id_santri
      FROM santri_kelas sk
      JOIN jadwal j ON sk.id_kelas = j.id_kelas
      WHERE sk.id_santri = $1 AND j.id_jadwal = $2
    `, [id_santri, id_jadwal]);

    if (cekSantri.rowCount === 0)
      return res.status(400).json({ message: "Santri tidak terdaftar pada kelas ini" });

    // 3. Cegah absensi duplikat
    const cekDuplikat = await db.query(`
      SELECT 1 FROM absensi
      WHERE id_santri = $1 AND id_jadwal = $2 AND tanggal = $3
    `, [id_santri, id_jadwal, tanggal]);

    if (cekDuplikat.rowCount > 0)
      return res.status(400).json({ message: "Absensi sudah tercatat hari ini" });

    // 4. Insert absensi
    await db.query(`
      INSERT INTO absensi(id_santri, id_jadwal, tanggal, status_absensi, catatan)
      VALUES ($1, $2, $3, $4, $5)
    `, [id_santri, id_jadwal, tanggal, status_absensi, catatan]);

    res.json({ message: "Absensi santri dicatat" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ============================================================================
   LIHAT SEMUA ABSENSI SANTRI (ADMIN)
============================================================================ */

exports.getAllAbsensiSantri = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.*,
        s.nama AS nama_santri,
        k.nama_kelas,
        j.hari, j.jam_mulai, j.jam_selesai
      FROM absensi a
      JOIN santri s ON a.id_santri = s.id_santri
      JOIN jadwal j ON a.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      ORDER BY tanggal DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ============================================================================
   UPDATE ABSENSI SANTRI (PENGAJAR)
============================================================================ */

exports.updateAbsensiSantri = async (req, res) => {
  try {
    const { id_absensi } = req.params;
    const { status_absensi } = req.body;
    const id_users = req.users.id_users;

    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    const cek = await db.query(`
      SELECT a.id_absensi
      FROM absensi a
      JOIN jadwal j ON a.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE a.id_absensi = $1 AND k.id_pengajar = $2
    `, [id_absensi, id_pengajar]);

    if (cek.rowCount === 0)
      return res.status(403).json({ message: "Tidak boleh mengubah absensi kelas lain" });

    await db.query(`
      UPDATE absensi SET status_absensi = $1 
      WHERE id_absensi = $2
    `, [status_absensi, id_absensi]);

    res.json({ message: "Absensi santri diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ============================================================================
   PENGAJAR → MELIHAT ABSENSI SANTRI DI KELASNYA
============================================================================ */

exports.getAbsensiKelasPengajar = async (req, res) => {
  try {
    const id_users = req.users.id_users;

    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    const result = await db.query(`
      SELECT 
        a.id_absensi, a.tanggal, a.status_absensi, a.catatan,
        s.nama AS nama_santri,
        k.nama_kelas,
        j.hari, j.jam_mulai, j.jam_selesai
      FROM absensi a
      JOIN santri s ON a.id_santri = s.id_santri
      JOIN jadwal j ON a.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE k.id_pengajar = $1
      ORDER BY tanggal DESC
    `, [id_pengajar]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ============================================================================
   SANTRI → MELIHAT ABSENSI SENDIRI
============================================================================ */

exports.getAbsensiSantri = async (req, res) => {
  try {
    const id_users = req.users.id_users;

    const result = await db.query(`
      SELECT 
        a.*,
        k.nama_kelas,
        j.hari, j.jam_mulai, j.jam_selesai
      FROM absensi a
      JOIN santri s ON a.id_santri = s.id_santri
      JOIN jadwal j ON a.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE s.id_users = $1
      ORDER BY tanggal DESC
    `, [id_users]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ============================================================================
   PENGAJAR → MENCATAT ABSENSI PENGAJAR SENDIRI
============================================================================ */

exports.catatAbsensiPengajar = async (req, res) => {
  try {
    const id_users = req.users.id_users;
    const { id_jadwal, tanggal, status_absensi, catatan } = req.body;

    // Ambil id_pengajar langsung dari token
    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    // Validasi input
    if (!id_jadwal || !tanggal || !status_absensi) {
      return res.status(400).json({
        message: "Lengkapi id_jadwal, tanggal dan status_absensi"
      });
    }

    // Cek apakah jadwal milik pengajar ini
    const cekJadwal = await db.query(`
      SELECT j.id_jadwal
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE j.id_jadwal = $1 AND k.id_pengajar = $2
    `, [id_jadwal, id_pengajar]);

    if (cekJadwal.rowCount === 0)
      return res.status(403).json({ message: "Jadwal bukan milik Anda" });

    // Cegah absensi duplikat
    const cekDuplikat = await db.query(`
      SELECT 1 FROM absensi_pengajar
      WHERE id_pengajar = $1 AND id_jadwal = $2 AND tanggal = $3
    `, [id_pengajar, id_jadwal, tanggal]);

    if (cekDuplikat.rowCount > 0)
      return res.status(400).json({ message: "Absensi sudah tercatat" });

    // Insert absensi pengajar
    const insert = await db.query(`
      INSERT INTO absensi_pengajar 
      (id_pengajar, id_jadwal, tanggal, status_absensi, catatan)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id_pengajar, id_jadwal, tanggal, status_absensi, catatan ?? null]);

    res.json({
      success: true,
      message: "Absensi pengajar dicatat",
      data: insert.rows[0]
    });

  } catch (err) {
    console.error("Gagal mencatat absensi pengajar:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================================
   PENGAJAR → MELIHAT ABSENSI DIRI SENDIRI
============================================================================ */

exports.getAbsensiPengajar = async (req, res) => {
  try {
    const id_users = req.users.id_users;

    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    const result = await db.query(`
      SELECT 
        p.*, 
        k.nama_kelas,
        j.hari, j.jam_mulai
      FROM absensi_pengajar p
      JOIN jadwal j ON p.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE p.id_pengajar = $1
      ORDER BY tanggal DESC
    `, [id_pengajar]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ============================================================================
   ADMIN → MELIHAT SEMUA ABSENSI PENGAJAR
============================================================================ */

exports.getAllAbsensiPengajar = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ap.id_absensi_pengajar,
        ap.id_pengajar,
        ap.id_jadwal,
        ap.tanggal,
        ap.status_absensi,
        ap.catatan,
        p.nama AS nama_pengajar,
        k.nama_kelas
      FROM absensi_pengajar ap
      LEFT JOIN jadwal j ON ap.id_jadwal = j.id_jadwal
      LEFT JOIN kelas k ON j.id_kelas = k.id_kelas
      LEFT JOIN pengajar p ON ap.id_pengajar = p.id_pengajar
      ORDER BY ap.tanggal DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("Error getAllAbsensiPengajar:", err);
    res.status(500).json({ message: "Gagal mengambil data absensi pengajar" });
  }
};

