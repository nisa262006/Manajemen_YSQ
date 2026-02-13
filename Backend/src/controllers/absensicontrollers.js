const db = require("../config/db");

/* =========================================================
   HELPER
========================================================= */
async function getIdPengajar(id_users) {
  const q = await db.query(
    `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
    [id_users]
  );
  return q.rows[0]?.id_pengajar ?? null;
}

function getHariFromTanggal(tanggal) {
  if (!tanggal) return null;

  // tanggal harus YYYY-MM-DD
  const [year, month, day] = tanggal.split("-").map(Number);

  // Pakai Date lokal (tanpa UTC)
  const localDate = new Date(year, month - 1, day);

  return localDate
    .toLocaleDateString("id-ID", { weekday: "long" })
    .toLowerCase();
}

const exportAbsensi = async (req, res) => {
  try {
    const { kelas, tanggal } = req.query;

    // TODO: sesuaikan query dengan struktur tabelmu
    res.status(200).json({
      success: true,
      message: "Export absensi berhasil",
      data: []
    });
  } catch (error) {
    console.error("Export absensi error:", error);
    res.status(500).json({ success: false, message: "Gagal export absensi" });
  }
};

/* =========================================================
   CATAT ABSENSI SANTRI (PENGAJAR) - MODIFIED
========================================================= */
exports.catatAbsensiSantri = async (req, res) => {
  try {
    const { id_santri, id_jadwal, tanggal, status_absensi, catatan } = req.body;
    const id_users = req.user.id_users;

    // Gunakan tanggal hari ini jika tidak dikirim dari frontend
    const tanggalFinal = tanggal || new Date().toISOString().split('T')[0];

    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    // 🔒 CEK SANTRI AKTIF
    const cekSantri = await db.query(
      `SELECT status FROM santri WHERE id_santri = $1`,
      [id_santri]
    );

    if (cekSantri.rowCount === 0)
      return res.status(404).json({ message: "Santri tidak ditemukan" });

    if (cekSantri.rows[0].status !== "aktif")
      return res.status(403).json({
        message: "Santri nonaktif tidak bisa diabsen"
      });

    // 🔒 CEK SANTRI TERDAFTAR DI KELAS + JADWAL
    const cekTerdaftar = await db.query(`
      SELECT j.id_jadwal
      FROM santri_kelas sk
      JOIN jadwal j ON sk.id_kelas = j.id_kelas
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE sk.id_santri = $1
        AND j.id_jadwal = $2
        AND k.id_pengajar = $3
    `, [id_santri, id_jadwal, id_pengajar]);

    if (cekTerdaftar.rowCount === 0)
      return res.status(400).json({
        message: "Santri tidak terdaftar pada kelas ini atau jadwal bukan milik Anda"
      });

    // 🔓 LOGIKA CEK HARI DIHAPUS
    // Pengajar sekarang bisa absen di tanggal mana saja (misal: kelas pengganti)

    // 🔒 CEK DUPLIKAT (Agar tidak absen 2x di hari & jadwal yang sama)
    const duplikat = await db.query(`
      SELECT 1 FROM absensi
      WHERE id_santri=$1 AND id_jadwal=$2 AND tanggal=$3
    `, [id_santri, id_jadwal, tanggalFinal]);

    if (duplikat.rowCount > 0)
      return res.status(400).json({
        message: "Absensi santri sudah tercatat untuk tanggal ini"
      });

    // ✅ INSERT DATA
    await db.query(`
      INSERT INTO absensi
      (id_santri, id_jadwal, tanggal, status_absensi, catatan)
      VALUES ($1,$2,$3,$4,$5)
    `, [id_santri, id_jadwal, tanggalFinal, status_absensi, catatan ?? null]);

    res.json({
      success: true,
      message: "Absensi santri berhasil disimpan"
    });

  } catch (err) {
    console.error("ABSENSI SANTRI ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   ADMIN → LIHAT SEMUA ABSENSI SANTRI
========================================================= */
exports.getAllAbsensiSantri = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.id_absensi,
        TO_CHAR(a.tanggal, 'YYYY-MM-DD') AS tanggal,
        a.status_absensi,
        a.catatan,
        s.nama AS nama_santri,
        k.nama_kelas,
        j.hari,
        j.jam_mulai,
        j.jam_selesai
      FROM absensi a
      JOIN santri s ON a.id_santri = s.id_santri
      JOIN jadwal j ON a.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE s.status = 'aktif'
      ORDER BY a.tanggal DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
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
    const id_users = req.user.id_users;

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


/* ======================================================================
   PENGAJAR → MELIHAT ABSENSI SANTRI DI KELASNYA
====================================================================== */
exports.getAbsensiKelasPengajar = async (req, res) => {
  try {
    const id_users = req.user.id_users;

    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar) {
      return res.status(403).json({ message: "Anda bukan pengajar" });
    }

    const result = await db.query(`
      SELECT
      a.id_absensi,
      TO_CHAR(a.tanggal, 'YYYY-MM-DD') AS tanggal,
      a.status_absensi,
      a.catatan,
      s.nama AS nama_santri,
      k.id_kelas,            -- 🔥 TAMBAHKAN
      j.id_jadwal,           -- 🔥 TAMBAHKAN
      k.nama_kelas,
      j.hari,
      j.jam_mulai,
      j.jam_selesai
    FROM absensi a
    JOIN santri s ON a.id_santri = s.id_santri
    JOIN jadwal j ON a.id_jadwal = j.id_jadwal
    JOIN kelas k ON j.id_kelas = k.id_kelas
    WHERE k.id_pengajar = $1
    ORDER BY a.tanggal DESC
    `, [id_pengajar]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("ERROR getAbsensiKelasPengajar:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================================
   SANTRI → MELIHAT ABSENSI SENDIRI (HANYA JIKA AKTIF)
====================================================================== */
exports.getAbsensiSantri = async (req, res) => {
  try {
    const id_users = req.user.id_users;

    const result = await db.query(`
      SELECT
        a.id_absensi,
        TO_CHAR(a.tanggal, 'YYYY-MM-DD') AS tanggal,
        a.status_absensi,
        a.catatan,
        k.nama_kelas,
        j.hari,
        j.jam_mulai,
        j.jam_selesai
      FROM absensi a
      JOIN santri s ON a.id_santri = s.id_santri
      JOIN jadwal j ON a.id_jadwal = j.id_jadwal
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE s.id_users = $1
        AND s.status = 'aktif'
      ORDER BY a.tanggal DESC
    `, [id_users]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error("ERROR getAbsensiSantri:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================================
   PENGAJAR → MENCATAT ABSENSI PENGAJAR SENDIRI (FIXED)
============================================================================ */
exports.catatAbsensiPengajar = async (req, res) => {
  try {
    const id_users = req.user.id_users;

    // PERBAIKAN: Tambahkan fallback agar tidak mengirim undefined ke DB
    // Pastikan nama field status_absensi sesuai dengan yang dikirim Frontend (cek Inspect -> Network)
    let { id_jadwal, tanggal, status_absensi, catatan } = req.body;

    // Jika frontend mengirimkan dengan nama "status", kita tangkap di sini
    if (!status_absensi && req.body.status) {
        status_absensi = req.body.status;
    }

    const tanggalFinal = tanggal || new Date().toISOString().split('T')[0];

    const id_pengajar = await getIdPengajar(id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Anda bukan pengajar" });

    // Validasi dasar: Jangan biarkan status_absensi kosong sebelum masuk ke Query
    if (!status_absensi) {
      return res.status(400).json({ message: "Status absensi harus dipilih" });
    }

    // 🔒 CEK JADWAL
    const cekJadwal = await db.query(`
      SELECT j.id_jadwal
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      WHERE j.id_jadwal = $1 AND k.id_pengajar = $2
    `, [id_jadwal, id_pengajar]);

    if (cekJadwal.rowCount === 0)
      return res.status(403).json({ message: "Jadwal bukan milik Anda" });

    // 🔒 CEK DUPLIKAT
    const cekDuplikat = await db.query(`
      SELECT 1 FROM absensi_pengajar
      WHERE id_pengajar=$1 AND id_jadwal=$2 AND tanggal=$3
    `, [id_pengajar, id_jadwal, tanggalFinal]);

    if (cekDuplikat.rowCount > 0)
      return res.status(400).json({ message: "Absensi pengajar sudah tercatat untuk tanggal ini" });

    // ✅ INSERT DATA - Pastikan menggunakan nilai default string kosong atau null yang valid
    const insert = await db.query(`
      INSERT INTO absensi_pengajar
      (id_pengajar, id_jadwal, tanggal, status_absensi, catatan)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
        id_pengajar,
        id_jadwal,
        tanggalFinal,
        status_absensi,
        catatan || null // Jika catatan undefined, kirim null asli ke DB
    ]);

    res.json({
      success: true,
      message: "Absensi pengajar berhasil dicatat",
      data: insert.rows[0]
    });

  } catch (err) {
    console.error("ABSENSI PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* ============================================================================
   PENGAJAR → MELIHAT ABSENSI DIRI SENDIRI
============================================================================ */
exports.getAbsensiPengajar = async (req, res) => {
  try {
    const id_users = req.user.id_users;

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
        TO_CHAR(ap.tanggal, 'YYYY-MM-DD') AS tanggal,
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

    res.json(result.rows);

  } catch (err) {
    console.error("Error getAllAbsensiPengajar:", err);
    res.status(500).json({ message: "Gagal mengambil data absensi pengajar" });
  }
};


// Backend/src/controllers/absensiControllers.js (Asumsi nama filenya)
exports.getRekapAbsensiPengajar = async (req, res) => {
  try {
      const id_users = req.user.id_users;

      // Logika query database kamu...
      const result = await db.query(`SELECT
              COUNT(*) FILTER (WHERE status = 'hadir') as total_hadir,
              COUNT(*) FILTER (WHERE status = 'izin') as total_izin,
              COUNT(*) FILTER (WHERE status = 'alfa') as total_alfa
          FROM absensi_pengajar ap
          JOIN pengajar p ON ap.id_pengajar = p.id_pengajar
          WHERE p.id_users = $1
      `, [id_users]);

      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Gagal mengambil rekap" });
  }
};