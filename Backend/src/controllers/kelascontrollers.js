const db = require("../config/db");

// ===================== ADMIN ===============================

// Tambah kelas
exports.tambahKelas = async (req, res) => {
  const { nama_kelas, id_program, kategori } = req.body;

  if (!nama_kelas || nama_kelas.trim() === '') {
    return res.status(400).json({ message: "nama_kelas wajib diisi" });
  }

  if (!kategori || kategori.trim() === '') {
    return res.status(400).json({ message: "kategori wajib diisi" });
  }

  try {
    const result = await db.query(
      `INSERT INTO kelas (nama_kelas, id_program, kategori)
       VALUES ($1, $2, $3)
       RETURNING id_kelas, nama_kelas, kategori`,
      [nama_kelas.trim(), id_program || null, kategori.trim()]
    );

    res.status(201).json({
      message: "Kelas berhasil ditambahkan",
      kelas: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah kelas" });
  }
};

// List kelas

exports.getAllKelas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        k.id_kelas,
        k.nama_kelas,
        k.kategori,
        pr.nama_program,

        COUNT(DISTINCT sj.id_santri) AS jumlah_santri,
        COUNT(DISTINCT j.id_jadwal) AS jumlah_sesi

      FROM kelas k

      LEFT JOIN program pr 
        ON k.id_program = pr.id_program

      LEFT JOIN jadwal j 
        ON j.id_kelas = k.id_kelas

      LEFT JOIN santri_jadwal sj 
        ON sj.id_jadwal = j.id_jadwal

      GROUP BY k.id_kelas, pr.nama_program
      ORDER BY k.nama_kelas ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil daftar kelas" });
  }
};

// Detail kelas
exports.getDetailKelas = async (req, res) => {
  const { id_kelas } = req.params;
  if (!id_kelas || !/^\d+$/.test(id_kelas)) {
    return res.status(400).json({ message: "ID Kelas tidak valid" });
  }

  try {

    const kelas = await db.query(
      `SELECT * FROM kelas WHERE id_kelas = $1`,
      [id_kelas]
    );

    if (kelas.rowCount === 0)
      return res.status(404).json({ message: "Kelas tidak ditemukan" });

    // 🔥 FIX DI SINI — ambil dari jadwal + santri_jadwal
    const santri = await db.query(`
      SELECT DISTINCT
        s.id_santri,
        s.nama,
        s.nis,
        s.tanggal_lahir,
        s.status,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        p.nama AS nama_pengajar
      FROM jadwal j
      LEFT JOIN santri_jadwal sj ON sj.id_jadwal = j.id_jadwal
      LEFT JOIN santri s ON s.id_santri = sj.id_santri
      LEFT JOIN pengajar p ON p.id_pengajar = j.id_pengajar
      WHERE j.id_kelas = $1
      AND s.status = 'aktif'
      ORDER BY j.hari, j.jam_mulai
    `, [id_kelas]);

    res.json({
      kelas: kelas.rows[0],
      santri: santri.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil detail kelas" });
  }
};


// Update kelas
exports.updateKelas = async (req, res) => {
  const { id_kelas } = req.params;
  if (!id_kelas || !/^\d+$/.test(id_kelas)) {
    return res.status(400).json({ message: "ID Kelas tidak valid" });
  }
  const { nama_kelas, id_program, kategori } = req.body;

  try {
    const result = await db.query(
      `UPDATE kelas
       SET nama_kelas = COALESCE($1, nama_kelas),
           id_program = COALESCE($2, id_program),
           kategori = COALESCE($3, kategori)
       WHERE id_kelas = $4
       RETURNING id_kelas`,
      [nama_kelas || null, id_program || null, kategori || null, id_kelas]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    res.json({ message: "Kelas berhasil diupdate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update kelas" });
  }
};

// Delete kelas
exports.deleteKelas = async (req, res) => {
  const { id_kelas } = req.params;
  if (!id_kelas || !/^\d+$/.test(id_kelas)) {
    return res.status(400).json({ message: "ID Kelas tidak valid" });
  }

  try {
    const result = await db.query(
      "DELETE FROM kelas WHERE id_kelas = $1 RETURNING id_kelas",
      [id_kelas]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Kelas tidak ditemukan" });
    }

    res.json({ message: "Kelas berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus kelas" });
  }
};

// Tambah santri ke kelas
exports.tambahSantriKeKelas = async (req, res) => {
  const { id_kelas } = req.params;
  const { id_santri } = req.body;

  if (!id_kelas || !/^\d+$/.test(id_kelas)) {
    return res.status(400).json({ message: "ID Kelas tidak valid" });
  }
  if (!id_santri || !/^\d+$/.test(id_santri)) {
    return res.status(400).json({ message: "ID Santri tidak valid" });
  }

  try {
    // Hapus dulu dari kelas lama
    await db.query(
      `DELETE FROM santri_kelas WHERE id_santri = $1`,
      [id_santri]
    );

    // Masukkan ke kelas baru
    await db.query(
      `INSERT INTO santri_kelas (id_santri, id_kelas)
       VALUES ($1, $2)`,
      [id_santri, id_kelas]
    );

    res.json({ message: "Santri berhasil dipindahkan ke kelas baru" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memindahkan santri" });
  }
};

// Pindah santri antar kelas
exports.pindahSantriKelas = async (req, res) => {
  const { id_santri } = req.params;
  const { id_kelas_baru } = req.body;

  if (!id_santri || !/^\d+$/.test(id_santri)) {
    return res.status(400).json({ message: "ID Santri tidak valid" });
  }
  if (!id_kelas_baru || !/^\d+$/.test(id_kelas_baru)) {
    return res.status(400).json({ message: "ID Kelas Baru tidak valid" });
  }

  try {
    // 1. Pastikan santri ada
    const cekSantri = await db.query(
      `SELECT * FROM santri WHERE id_santri = $1`,
      [id_santri]
    );

    if (cekSantri.rows.length === 0) {
      return res.status(404).json({ message: "Santri tidak ditemukan" });
    }

    // 2. Hapus kelas lama
    await db.query(
      `DELETE FROM santri_kelas WHERE id_santri = $1`,
      [id_santri]
    );

    // 3. Tambahkan ke kelas baru
    await db.query(
      `INSERT INTO santri_kelas (id_santri, id_kelas)
       VALUES ($1, $2)`,
      [id_santri, id_kelas_baru]
    );

    res.json({
      message: "Santri berhasil dipindahkan ke kelas baru",
      id_santri,
      id_kelas_baru
    });

  } catch (err) {
    console.error("PINDAH SANTRI ERROR:", err);
    res.status(500).json({ message: "Gagal memindahkan santri" });
  }
};


// ===================== PENGAJAR ===============================

// Ambil kelas yang diajar pengajar login
exports.kelasPengajar = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT k.*
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      JOIN pengajar p ON j.id_pengajar = p.id_pengajar
      WHERE p.id_users = $1
    `, [req.user.id_users]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil kelas pengajar" });
  }
};


// ===================== DETAIL KELAS UNTUK PENGAJAR ===============================

exports.getDetailKelasPengajar = async (req, res) => {
  const { id_kelas } = req.params;
  if (!id_kelas || !/^\d+$/.test(id_kelas)) {
    return res.status(400).json({ message: "ID Kelas tidak valid" });
  }
  const id_users = req.user.id_users;

  try {
    // 1️⃣ Validasi pengajar memang punya sesi di kelas ini
    const cek = await db.query(`
      SELECT DISTINCT k.*
      FROM jadwal j
      JOIN kelas k ON k.id_kelas = j.id_kelas
      JOIN pengajar p ON p.id_pengajar = j.id_pengajar
      WHERE k.id_kelas = $1 AND p.id_users = $2
    `, [id_kelas, id_users]);

    if (cek.rowCount === 0) {
      return res.status(403).json({ message: "Kelas ini bukan milik pengajar" });
    }

    // 2️⃣ Ambil sesi + santri
    const result = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        j.kapasitas,
        s.id_santri,
        s.nama,
        s.nis,
        s.status
      FROM jadwal j
      LEFT JOIN santri_jadwal sj ON sj.id_jadwal = j.id_jadwal
      LEFT JOIN santri s ON s.id_santri = sj.id_santri
      JOIN pengajar p ON p.id_pengajar = j.id_pengajar
      WHERE j.id_kelas = $1
        AND p.id_users = $2
      ORDER BY j.hari, j.jam_mulai
    `, [id_kelas, id_users]);

    res.json({
      kelas: cek.rows[0],
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil detail kelas pengajar" });
  }
};


// ====================== DETAIL KELA SUNTUK SANTRI==============//
exports.kelasSantriMe = async (req, res) => {
  try {
    const id_users = req.user.id_users;

    // 1️⃣ Ambil data santri
    const santriRes = await db.query(`
      SELECT id_santri, nama, nis, status
      FROM santri
      WHERE id_users = $1
      LIMIT 1
    `, [id_users]);

    if (santriRes.rowCount === 0) {
      return res.status(404).json({ message: "Data santri tidak ditemukan" });
    }

    const santri = santriRes.rows[0];

    // 2️⃣ Ambil jadwal berdasarkan sesi yang dia ikuti
    const jadwalRes = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        k.nama_kelas,
        p.nama AS nama_pengajar
      FROM santri_jadwal sj
      JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
      JOIN kelas k ON k.id_kelas = j.id_kelas
      LEFT JOIN pengajar p ON p.id_pengajar = j.id_pengajar
      WHERE sj.id_santri = $1
      ORDER BY j.hari, j.jam_mulai
    `, [santri.id_santri]);

    res.json({
      santri,
      jadwal: jadwalRes.rows
    });

  } catch (err) {
    console.error("KELAS SANTRI ERROR:", err);
    res.status(500).json({ message: "Gagal memuat dashboard santri" });
  }
};