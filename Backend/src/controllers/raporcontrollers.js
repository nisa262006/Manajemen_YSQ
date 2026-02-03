const db = require("../config/db");

/* ================= HELPER ================= */
async function getIdPengajar(id_users) {
  const q = await db.query(
    `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
    [id_users]
  );
  return q.rows[0]?.id_pengajar ?? null;
}

/* ================= HELPER PREDIKAT ================= */
function hitungPredikat(nilai) {
  const n = parseFloat(nilai);
  if (n >= 90) return { predikat: "Mumtaz", keterangan: "Istimewa" };
  if (n >= 80) return { predikat: "Jayyid Jiddan", keterangan: "Sangat Baik" };
  if (n >= 70) return { predikat: "Jayyid", keterangan: "Baik" };
  if (n >= 60) return { predikat: "Maqbul", keterangan: "Cukup" };
  return { predikat: "Dhaif", keterangan: "Kurang" };
}

/* =====================================================
   RAPOR TAHSIN
===================================================== */
exports.createRaporTahsin = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    const { id_santri, periode, nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi, catatan } = req.body;

    if (!periode) return res.status(400).json({ message: "Periode harus dipilih" });

    // 🔴 CEK DUPLIKAT: Pastikan santri belum punya rapor Tahsin di periode ini
    const cekDuplikat = await db.query(
      `SELECT id_rapor FROM rapor_tahsin WHERE id_santri = $1 AND periode = $2`,
      [id_santri, periode]
    );

    if (cekDuplikat.rowCount > 0) {
      return res.status(400).json({ message: `Rapor Tahsin untuk periode ${periode} sudah ada.` });
    }

    // Hitung Nilai & Predikat
    const nilai_akhir = (Number(nilai_pekanan) + Number(ujian_tilawah) + Number(nilai_teori) + Number(nilai_presensi)) / 4;
    const { predikat, keterangan } = hitungPredikat(nilai_akhir);

    await db.query(
      `INSERT INTO rapor_tahsin 
       (id_santri, id_pengajar, periode, nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi, nilai_akhir, predikat, keterangan, catatan) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id_santri, id_pengajar, periode, nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi, nilai_akhir, predikat, keterangan, catatan]
    );

    res.json({ success: true, message: "Rapor Tahsin tersimpan untuk periode " + periode });
  } catch (err) {
    res.status(500).json({ message: "Gagal menyimpan rapor" });
  }
};

/* =====================================================
   RAPOR TAHFIDZ (HEADER + VALIDASI KELAS)
===================================================== */
exports.createRaporTahfidz = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    if (!id_pengajar) return res.status(403).json({ message: "Bukan pengajar" });

    const { id_santri, periode } = req.body; 

    if (!periode) return res.status(400).json({ message: "Periode harus dipilih" });

    // 🔍 VALIDASI KELAS: Cek apakah santri berada di kelas "Tahfidz"
    const cekKelas = await db.query(
      `SELECT k.nama_kelas 
       FROM santri_kelas sk
       JOIN kelas k ON sk.id_kelas = k.id_kelas
       WHERE sk.id_santri = $1`,
      [id_santri]
    );

    const isTahfidz = cekKelas.rows.some(row => 
      row.nama_kelas.toLowerCase().includes("tahfidz")
    );

    if (!isTahfidz) {
      return res.status(400).json({ 
        message: "Gagal! Rapor Tahfidz hanya tersedia untuk santri di kelas Tahfidz." 
      });
    }

    // 🔴 CEK DUPLIKAT: Pastikan santri belum punya rapor Tahfidz di periode ini
    const cekRapor = await db.query(
      `SELECT id_rapor FROM rapor_tahfidz WHERE id_santri = $1 AND periode = $2`,
      [id_santri, periode]
    );

    if (cekRapor.rowCount > 0) {
      return res.status(400).json({ message: `Rapor Tahfidz untuk periode ${periode} sudah ada.` });
    }

    const q = await db.query(
      `INSERT INTO rapor_tahfidz (id_santri, id_pengajar, periode)
       VALUES ($1,$2,$3)
       RETURNING id_rapor`,
      [id_santri, id_pengajar, periode]
    );

    res.json({
      success: true,
      id_rapor: q.rows[0].id_rapor,
      message: "Header Rapor Tahfidz Berhasil Dibuat"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kesalahan server" });
  }
};

/* =====================================================
   SIMAKAN PER JUZ (1–30)
===================================================== */
exports.inputSimakan = async (req, res) => {
  try {
    const { id_rapor, juz, nilai } = req.body;

    await db.query(
      `INSERT INTO tahfidz_simakan (id_rapor, juz, nilai)
       VALUES ($1,$2,$3)
       ON CONFLICT (id_rapor, juz)
       DO UPDATE SET nilai = EXCLUDED.nilai`,
      [id_rapor, juz, nilai]
    );

    res.json({ message: `Nilai simakan Juz ${juz} tersimpan` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FINALISASI RAPOR TAHFIDZ ================= */
exports.finalisasiTahfidz = async (req, res) => {
  try {
    const { id_rapor, nilai_ujian_akhir } = req.body;

    const q = await db.query(
      `SELECT AVG(nilai) AS rata FROM tahfidz_simakan WHERE id_rapor = $1`,
      [id_rapor]
    );

    const rata_simakan = Number(q.rows[0].rata || 0);
    const nilai_akhir = (rata_simakan + Number(nilai_ujian_akhir)) / 2;
    
    const { predikat, keterangan } = hitungPredikat(nilai_akhir);

    await db.query(
      `UPDATE rapor_tahfidz
       SET nilai_rata_simakan = $1, 
           nilai_ujian_akhir = $2, 
           nilai_akhir = $3, 
           predikat = $4, 
           keterangan = $5
       WHERE id_rapor = $6`,
      [rata_simakan, nilai_ujian_akhir, nilai_akhir, predikat, keterangan, id_rapor]
    );

    res.json({ 
        success: true, 
        message: "Rapor Berhasil Difinalisasi!",
        data: { id_rapor, nilai_akhir, predikat } 
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal finalisasi rapor" });
  }
};

////////////////////////////////////////////////////////
exports.updateRaporTahsin = async (req, res) => {
  const id_pengajar = await getIdPengajar(req.user.id_users);
  const { nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi, catatan } = req.body;

  const nilai_akhir = (Number(nilai_pekanan) + Number(ujian_tilawah) + Number(nilai_teori) + Number(nilai_presensi)) / 4;
  const { predikat, keterangan } = hitungPredikat(nilai_akhir);

  await db.query(
    `
    UPDATE rapor_tahsin
    SET nilai_pekanan=$1, ujian_tilawah=$2, nilai_teori=$3, nilai_presensi=$4, nilai_akhir=$5, predikat=$6, keterangan=$7, catatan=$8
    WHERE id_rapor=$9 AND id_pengajar=$10
    `,
    [nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi, nilai_akhir, predikat, keterangan, catatan, req.params.id, id_pengajar]
  );

  res.json({ message: "Rapor Tahsin diperbarui" });
};

exports.getRaporPengajar = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    if (!id_pengajar) return res.status(403).json({ message: "Bukan pengajar" });

    const tahsin = await db.query(
      `SELECT r.*, s.nama AS nama_santri 
       FROM rapor_tahsin r 
       JOIN santri s ON r.id_santri = s.id_santri 
       WHERE r.id_pengajar = $1 ORDER BY r.created_at DESC`,
      [id_pengajar]
    );

    const tahfidz = await db.query(
      `SELECT r.*, s.nama AS nama_santri 
       FROM rapor_tahfidz r 
       JOIN santri s ON r.id_santri = s.id_santri 
       WHERE r.id_pengajar = $1 ORDER BY r.created_at DESC`,
      [id_pengajar]
    );

    res.json({
      success: true,
      tahsin: tahsin.rows,
      tahfidz: tahfidz.rows
    });
  } catch (err) {
    console.error("GET RAPOR PENGAJAR ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getRekapLaporan = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    const { periode, id_kelas, kategori } = req.query;

    const queryText = `
   SELECT
  s.id_santri,
  s.nama AS nama_santri,
  k.nama_kelas,
  k.kategori,

  COALESCE(rt.nilai_akhir, 0) AS nilai_tahsin,
  COALESCE(rt.nilai_presensi, 0) AS nilai_presensi,

  CASE 
    WHEN rt.id_rapor IS NOT NULL THEN 'Selesai'
    ELSE 'Belum Dibuat'
  END AS status_rapor,

  CASE 
    WHEN k.nama_kelas ILIKE '%tahfidz%' THEN (
      SELECT COUNT(*)
      FROM rapor_tahfidz rtf
      JOIN tahfidz_simakan ts ON ts.id_rapor = rtf.id_rapor
      WHERE rtf.id_santri = s.id_santri
        AND ($1 = '' OR rtf.periode = $1)
    )
    ELSE 0
  END AS juz_tahfidz

FROM santri s
JOIN santri_kelas sk ON s.id_santri = sk.id_santri
JOIN kelas k ON sk.id_kelas = k.id_kelas

LEFT JOIN rapor_tahsin rt
  ON rt.id_santri = s.id_santri
 AND ($1 = '' OR rt.periode = $1)

WHERE k.id_pengajar = $2
  AND (NULLIF($3,'') IS NULL OR k.id_kelas::text = $3)
  AND (NULLIF($4,'') IS NULL OR TRIM(k.kategori) ILIKE TRIM($4))

ORDER BY s.nama ASC;
 `;

    const values = [periode || '', id_pengajar, id_kelas || '', kategori || ''];
    const result = await db.query(queryText, values);
    
    const total = result.rows.length;
    const selesai = result.rows.filter(r => r.status_rapor === 'Selesai').length;

    res.json({
      success: true,
      summary: { 
        total_santri: total, 
        selesai: selesai, 
        belum_selesai: total - selesai 
      },
      list: result.rows
    });
  } catch (error) {
    console.error("EROR REKAP LAPORAN:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getPeriodePengajar = async (req, res) => {
  const id_pengajar = await getIdPengajar(req.user.id_users);

  const q = await db.query(`
    SELECT DISTINCT periode
    FROM rapor_tahsin
    WHERE id_pengajar = $1

    UNION

    SELECT DISTINCT periode
    FROM rapor_tahfidz
    WHERE id_pengajar = $1

    ORDER BY periode DESC
  `, [id_pengajar]);

  res.json(q.rows.map(r => r.periode));
};


///////////////////////////////////////////////////////
exports.deleteRaporTahsin = async (req, res) => {
  const id_pengajar = await getIdPengajar(req.user.id_users);

  await db.query(
    `DELETE FROM rapor_tahsin WHERE id_rapor=$1 AND id_pengajar=$2`,
    [req.params.id, id_pengajar]
  );

  res.json({ message: "Rapor Tahsin dihapus" });
};

////////////////////////////////////////////////////////
exports.deleteRaporTahfidz = async (req, res) => {
  const id_pengajar = await getIdPengajar(req.user.id_users);

  await db.query(
    `DELETE FROM tahfidz_simakan WHERE id_rapor=$1`,
    [req.params.id]
  );

  await db.query(
    `DELETE FROM rapor_tahfidz WHERE id_rapor=$1 AND id_pengajar=$2`,
    [req.params.id, id_pengajar]
  );

  res.json({ message: "Rapor Tahfidz dihapus" });
};



/* =====================================================
   SANTRI LIHAT RAPOR (TAHSIN + TAHFIDZ)
===================================================== */
exports.getRaporSantri = async (req, res) => {
  try {
    const { id_users } = req.user;
    const { periode } = req.query; // Ambil parameter periode jika ada

    // 1. Identitas Santri
    const identitas = await db.query(
      `SELECT s.id_santri, s.nama, s.nis, k.nama_kelas, p.nama AS nama_pengajar
       FROM santri s
       JOIN santri_kelas sk ON s.id_santri = sk.id_santri
       JOIN kelas k ON sk.id_kelas = k.id_kelas
       JOIN pengajar p ON k.id_pengajar = p.id_pengajar
       WHERE s.id_users = $1`, [id_users]
    );

    if (identitas.rowCount === 0) return res.status(404).json({ message: "Data tidak ditemukan" });
    const santri = identitas.rows[0];

    // 2. Ambil Daftar Semua Periode yang Pernah Ada (Untuk Dropdown)
    const listPeriode = await db.query(
      `(SELECT periode FROM rapor_tahsin WHERE id_santri = $1)
       UNION 
       (SELECT periode FROM rapor_tahfidz WHERE id_santri = $1)
       ORDER BY periode DESC`, [santri.id_santri]
    );

    // 3. Tentukan periode mana yang mau diambil (Default: terbaru)
    const selectedPeriode = periode || (listPeriode.rows[0]?.periode);

    // 4. Ambil Rapor Tahsin berdasarkan periode
    const tahsinQ = await db.query(
      `SELECT * FROM rapor_tahsin WHERE id_santri = $1 AND periode = $2`,
      [santri.id_santri, selectedPeriode]
    );

    // 5. Ambil Rapor Tahfidz berdasarkan periode
    const tahfidzQ = await db.query(
      `SELECT * FROM rapor_tahfidz WHERE id_santri = $1 AND periode = $2`,
      [santri.id_santri, selectedPeriode]
    );

    let raporTahfidz = tahfidzQ.rows[0] || null;
    if (raporTahfidz) {
      const simakan = await db.query(
        `SELECT juz, nilai FROM tahfidz_simakan WHERE id_rapor = $1 ORDER BY juz`,
        [raporTahfidz.id_rapor]
      );
      raporTahfidz.simakan = simakan.rows;
    }

    res.json({
      success: true,
      santri: {
        nama: santri.nama, nis: santri.nis,
        kelas: santri.nama_kelas, pengajar: santri.nama_pengajar
      },
      periode_list: listPeriode.rows.map(r => r.periode),
      selected_periode: selectedPeriode,
      rapor_tahsin: tahsinQ.rows[0] || null,
      rapor_tahfidz: raporTahfidz
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};