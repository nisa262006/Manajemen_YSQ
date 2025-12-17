const db = require("../config/db");

// ===================== ADMIN ===============================

// Tambah kelas
exports.tambahKelas = async (req, res) => {
  const { nama_kelas, kapasitas, id_pengajar, id_program, kategori } = req.body;

  await db.query(
    `INSERT INTO kelas (nama_kelas, kapasitas, id_pengajar, id_program, kategori)
     VALUES ($1, $2, $3, $4, $5)`,
    [nama_kelas, kapasitas, id_pengajar, id_program, kategori]
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
      k.kategori,
      p.nama_program,
      pg.nama AS nama_pengajar,
      u.email AS email_pengajar
    FROM kelas k
    LEFT JOIN program p ON p.id_program = k.id_program
    LEFT JOIN pengajar pg ON pg.id_pengajar = k.id_pengajar
    LEFT JOIN users u ON u.id_users = pg.id_users
    ORDER BY k.id_kelas DESC
  `);

  res.json(result.rows);
};

// Detail kelas
exports.getDetailKelas = async (req, res) => {
  const { id_kelas } = req.params;

  const kelas = await db.query(
    "SELECT * FROM kelas WHERE id_kelas = $1",
    [id_kelas]
  );

  if (kelas.rowCount === 0)
    return res.status(404).json({ message: "Kelas tidak ditemukan" });

  const santri = await db.query(`
    SELECT s.id_santri, s.nama, s.nis
    FROM santri_kelas sk
    JOIN santri s ON s.id_santri = sk.id_santri
    WHERE sk.id_kelas = $1
     AND s.status = 'aktif'
  `, [id_kelas]);

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
  const { nama_kelas, kapasitas, id_pengajar, id_program, kategori } = req.body;

  await db.query(
    `UPDATE kelas SET
      nama_kelas = COALESCE($1, nama_kelas),
      kapasitas = COALESCE($2, kapasitas),
      id_pengajar = COALESCE($3, id_pengajar),
      id_program = COALESCE($4, id_program),
      kategori = COALESCE($5, kategori)
     WHERE id_kelas = $6`,
    [nama_kelas, kapasitas, id_pengajar, id_program, kategori, id_kelas]
  );

  res.json({ message: "Kelas berhasil diupdate" });
};

// Delete kelas
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
    `INSERT INTO santri_kelas (id_santri, id_kelas)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [id_santri, id_kelas]
  );

  res.json({ message: "Santri berhasil ditambahkan ke kelas" });

  const cekSantri = await db.query(
    `SELECT status FROM santri WHERE id_santri = $1`,
    [id_santri]
  );
  
  if (cekSantri.rowCount === 0 || cekSantri.rows[0].status !== 'aktif') {
    return res.status(400).json({
      message: "Santri nonaktif tidak boleh dimasukkan ke kelas"
    });
  }
  
};

// Pindah santri antar kelas
exports.pindahSantriKelas = async (req, res) => {
  const { id_santri } = req.params;
  const { id_kelas_baru } = req.body;

  if (!id_kelas_baru) {
    return res.status(400).json({ message: "id_kelas_baru wajib dikirim" });
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
  const result = await db.query(
    `SELECT k.*
     FROM kelas k
     JOIN pengajar p ON p.id_pengajar = k.id_pengajar
     WHERE p.id_users = $1`,
    [req.users.id_users]
  );

  res.json(result.rows);
};


// ===================== DETAIL KELAS UNTUK PENGAJAR ===============================

exports.getDetailKelasPengajar = async (req, res) => {
  const { id_kelas } = req.params;
  const id_users = req.users.id_users; // dari token

  try {
    // 1. Pastikan kelas ini memang diajar oleh pengajar yang login
    const kelas = await db.query(
      `SELECT k.*, pg.id_pengajar
       FROM kelas k
       JOIN pengajar pg ON pg.id_pengajar = k.id_pengajar
       WHERE k.id_kelas = $1 AND pg.id_users = $2`,
      [id_kelas, id_users]
    );

    if (kelas.rowCount === 0) {
      return res.status(403).json({ message: "Kelas ini bukan milik pengajar" });
    }

    const id_pengajar = kelas.rows[0].id_pengajar;

    // 2. Ambil santri dalam kelas
    const santri = await db.query(
      `SELECT s.id_santri, s.nama, s.nis, s.status
        FROM santri_kelas sk
        JOIN santri s ON s.id_santri = sk.id_santri
        WHERE sk.id_kelas = $1
          AND s.status = 'aktif'
        `,[id_kelas]
    );

    // 3. Ambil jadwal kelas
    const jadwal = await db.query(
      `SELECT *
       FROM jadwal
       WHERE id_kelas = $1 AND id_pengajar = $2`,
      [id_kelas, id_pengajar]
    );

    return res.json({
      kelas: kelas.rows[0],
      santri: santri.rows,
      jadwal: jadwal.rows
    });

  } catch (err) {
    console.error("ERROR DETAIL KELAS PENGAJAR:", err);
    res.status(500).json({ message: "Gagal mengambil detail kelas pengajar" });
  }
};


// ====================== DETAIL KELA SUNTUK SANTRI==============//
exports.kelasSantriMe = async (req, res) => {
  try {
    const id_users = req.users.id_users;

    const santriRes = await db.query(`
      SELECT 
        s.id_santri,
        s.nis,
        s.nama,
        s.kategori,
        s.status,
        k.id_kelas,
        k.nama_kelas
      FROM santri s
      JOIN santri_kelas sk ON sk.id_santri = s.id_santri
      JOIN kelas k ON k.id_kelas = sk.id_kelas
      WHERE s.id_users = $1
      LIMIT 1
    `, [id_users]);

    if (santriRes.rowCount === 0) {
      return res.status(404).json({
        message: "Santri belum terdaftar di kelas"
      });
    }

    const santri = santriRes.rows[0];

    const jadwalRes = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        u.username AS pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      JOIN pengajar p ON k.id_pengajar = p.id_pengajar
      JOIN users u ON p.id_users = u.id_users
      WHERE k.id_kelas = $1
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
    `, [santri.id_kelas]);
    

    return res.json({
      santri,
      jadwal: jadwalRes.rows
    });

  } catch (err) {
    console.error("KELAS SANTRI ERROR:", err);
    return res.status(500).json({
      message: "Gagal memuat data dashboard santri"
    });
  }
};
