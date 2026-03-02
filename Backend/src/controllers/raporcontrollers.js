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

    const {
      id_santri,
      id_jadwal,
      periode,
      nilai_pekanan,
      ujian_tilawah,
      nilai_teori,
      nilai_presensi,
      nilai_akhir,
      catatan
    } = req.body;

    if (!periode || !id_jadwal)
      return res.status(400).json({ message: "Periode & Jadwal wajib dipilih" });

    const cek = await db.query(
      `SELECT id_rapor FROM rapor_tahsin
       WHERE id_santri=$1 AND id_jadwal=$2 AND periode=$3`,
      [id_santri, id_jadwal, periode]
    );

    if (cek.rowCount > 0)
      return res.status(400).json({ message: "Rapor sudah ada di sesi ini" });

    const { predikat, keterangan } = hitungPredikat(nilai_akhir);

    await db.query(
      `INSERT INTO rapor_tahsin
       (id_santri,id_pengajar,id_jadwal,periode,
        nilai_pekanan,ujian_tilawah,nilai_teori,
        nilai_presensi,nilai_akhir,predikat,
        keterangan,catatan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id_santri,
        id_pengajar,
        id_jadwal,
        periode,
        nilai_pekanan,
        ujian_tilawah,
        nilai_teori,
        nilai_presensi,
        nilai_akhir,
        predikat,
        keterangan,
        catatan
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal simpan rapor" });
  }
};

/* =====================================================
   RAPOR TAHFIDZ (HEADER + VALIDASI KELAS)
===================================================== */
exports.createRaporTahfidz = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    if (!id_pengajar)
      return res.status(403).json({ message: "Bukan pengajar" });

    const { id_santri, id_jadwal, periode } = req.body;

    if (!id_santri || !id_jadwal || !periode)
      return res.status(400).json({ message: "Parameter tidak lengkap" });

    // 🔥 VALIDASI TAMBAHAN: Cek apakah jadwal ini benar-benar untuk kelas Tahfidz
    const cekKategori = await db.query(
      `SELECT k.kategori 
       FROM jadwal j
       JOIN kelas k ON j.id_kelas = k.id_kelas
       WHERE j.id_jadwal = $1 AND j.id_pengajar = $2`,
      [id_jadwal, id_pengajar]
    );

    if (cekKategori.rowCount === 0) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan atau bukan milik Anda" });
    }

    const kategori = cekKategori.rows[0].kategori.toLowerCase();
    if (!kategori.includes("tahfidz")) {
      return res.status(400).json({ 
        message: `Gagal:Rapor Tahfidz hanya untuk kelas kategori Tahfidz.` 
      });
    }

    // Cek apakah rapor sudah pernah dibuat untuk periode ini
    const cekRapor = await db.query(
      `SELECT id_rapor 
       FROM rapor_tahfidz 
       WHERE id_santri = $1 
         AND id_jadwal = $2
         AND periode = $3`,
      [id_santri, id_jadwal, periode]
    );

    if (cekRapor.rowCount > 0)
      return res.status(400).json({ message: "Rapor sudah ada di sesi ini" });

    const q = await db.query(
      `INSERT INTO rapor_tahfidz
       (id_santri, id_pengajar, id_jadwal, periode)
       VALUES ($1,$2,$3,$4)
       RETURNING id_rapor`,
      [id_santri, id_pengajar, id_jadwal, periode]
    );

    res.json({
      success: true,
      id_rapor: q.rows[0].id_rapor,
      message: "Header Rapor Tahfidz Berhasil Dibuat"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Kesalahan server saat validasi kategori kelas" });
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
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    // Ambil nilai_akhir dari input pengajar
    const { nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi, nilai_akhir, catatan } = req.body;

    // Predikat tetap otomatis dihitung dari nilai_akhir yang baru saja diketik
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
  } catch (err) {
    res.status(500).json({ message: "Gagal memperbarui rapor" });
  }
};

exports.getRaporPengajar = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    if (!id_pengajar) return res.status(403).json({ message: "Bukan pengajar" });

    const tahsin = await db.query(
      `SELECT r.*, s.nama AS nama_santri,
              j.hari, j.jam_mulai, j.jam_selesai,
              k.nama_kelas
       FROM rapor_tahsin r
       JOIN santri s ON r.id_santri = s.id_santri
       JOIN jadwal j ON r.id_jadwal = j.id_jadwal
       JOIN kelas k ON j.id_kelas = k.id_kelas
       WHERE r.id_pengajar = $1
       ORDER BY r.created_at DESC`,
      [id_pengajar]
    );

    const tahfidz = await db.query(
      `SELECT r.*, s.nama AS nama_santri,
              j.hari, j.jam_mulai, j.jam_selesai,
              k.nama_kelas
       FROM rapor_tahfidz r
       JOIN santri s ON r.id_santri = s.id_santri
       JOIN jadwal j ON r.id_jadwal = j.id_jadwal
       JOIN kelas k ON j.id_kelas = k.id_kelas
       WHERE r.id_pengajar = $1
       ORDER BY r.created_at DESC`,
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

    // Anggap "ALL" atau string kosong sebagai pencarian global
    const isFilterPeriode = periode && periode !== "ALL" && periode !== "";

    const queryText = `
      SELECT 
        s.id_santri,
        s.nama AS nama_santri,
        k.nama_kelas,
        k.kategori,
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        -- Mengambil nilai Tahsin (Terbaru jika filter periode adalah ALL)
        (SELECT rt.nilai_akhir FROM rapor_tahsin rt 
         WHERE rt.id_santri = s.id_santri 
         AND rt.id_jadwal = j.id_jadwal 
         AND ($1::varchar IS NULL OR rt.periode = $1)
         ORDER BY rt.created_at DESC LIMIT 1) AS nilai_tahsin,

        -- Mengambil nilai Tahfidz (Terbaru jika filter periode adalah ALL)
        (SELECT rtf.nilai_akhir FROM rapor_tahfidz rtf 
         WHERE rtf.id_santri = s.id_santri 
         AND rtf.id_jadwal = j.id_jadwal 
         AND ($1::varchar IS NULL OR rtf.periode = $1)
         ORDER BY rtf.created_at DESC LIMIT 1) AS nilai_tahfidz,

        -- Mengambil nilai Presensi
        (SELECT rt.nilai_presensi FROM rapor_tahsin rt 
         WHERE rt.id_santri = s.id_santri 
         AND rt.id_jadwal = j.id_jadwal 
         AND ($1::varchar IS NULL OR rt.periode = $1)
         ORDER BY rt.created_at DESC LIMIT 1) AS nilai_presensi,

        -- Ambil info periode terbaru yang ditemukan (untuk label di UI)
        COALESCE(
          (SELECT rt.periode FROM rapor_tahsin rt WHERE rt.id_santri = s.id_santri AND rt.id_jadwal = j.id_jadwal ORDER BY rt.created_at DESC LIMIT 1),
          (SELECT rtf.periode FROM rapor_tahfidz rtf WHERE rtf.id_santri = s.id_santri AND rtf.id_jadwal = j.id_jadwal ORDER BY rtf.created_at DESC LIMIT 1),
          'Belum Ada'
        ) AS periode_data
         
      FROM santri s
      JOIN santri_jadwal sj ON sj.id_santri = s.id_santri
      JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
      JOIN kelas k ON k.id_kelas = j.id_kelas
      WHERE j.id_pengajar = $2
        AND (NULLIF($3,'') IS NULL OR k.id_kelas::text = $3)
        AND (NULLIF($4,'') IS NULL OR TRIM(k.kategori) ILIKE TRIM($4))
      ORDER BY j.hari, j.jam_mulai, s.nama ASC;
    `;

    const values = [
      isFilterPeriode ? periode : null, 
      id_pengajar, 
      id_kelas || '', 
      kategori || ''
    ];

    const result = await db.query(queryText, values);

    const listFormatted = result.rows.map(row => {
      const isTahfidzClass = row.nama_kelas.toLowerCase().includes('tahfidz');
      let status = 'Belum Selesai';

      if (isTahfidzClass) {
        if (row.nilai_tahsin !== null && row.nilai_tahfidz !== null) status = 'Selesai';
      } else {
        if (row.nilai_tahsin !== null) status = 'Selesai';
      }

      return {
        ...row,
        nilai_tahsin: row.nilai_tahsin ?? 0,
        nilai_tahfidz: row.nilai_tahfidz ?? 0,
        nilai_presensi: row.nilai_presensi ?? 0,
        status_rapor: status
      };
    });

    res.json({
      success: true,
      summary: { 
        total_santri: listFormatted.length, 
        selesai: listFormatted.filter(r => r.status_rapor === 'Selesai').length, 
        belum_selesai: listFormatted.filter(r => r.status_rapor === 'Belum Selesai').length 
      },
      list: listFormatted
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
      `SELECT s.id_santri, s.nama, s.nis,
       k.nama_kelas,
       p.nama AS nama_pengajar
FROM santri s
JOIN santri_jadwal sj ON s.id_santri = sj.id_santri
JOIN jadwal j ON sj.id_jadwal = j.id_jadwal
JOIN kelas k ON j.id_kelas = k.id_kelas
JOIN pengajar p ON j.id_pengajar = p.id_pengajar
WHERE s.id_users = $1
LIMIT 1`, [id_users]
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
      `SELECT *
       FROM rapor_tahsin
       WHERE id_santri = $1
         AND periode = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [santri.id_santri, selectedPeriode]
    );

    // 5. Ambil Rapor Tahfidz berdasarkan periode
    const tahfidzQ = await db.query(
      `SELECT *
       FROM rapor_tahfidz
       WHERE id_santri = $1
         AND periode = $2
       ORDER BY created_at DESC
       LIMIT 1`,
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

/* =====================================================
   DETAIL RAPOR UNTUK PENGAJAR (PER SANTRI)
===================================================== */
exports.getDetailRaporPengajar = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    const { id_santri, periode } = req.query;

    if (!id_santri || !periode)
      return res.status(400).json({ message: "Parameter tidak lengkap" });

    // ================= TAHSIN =================
    const tahsin = await db.query(
      `SELECT *
       FROM rapor_tahsin
       WHERE id_santri = $1
         AND periode = $2
         AND id_pengajar = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [id_santri, periode, id_pengajar]
    );

    // ================= TAHFIDZ =================
    const tahfidz = await db.query(
      `SELECT *
       FROM rapor_tahfidz
       WHERE id_santri = $1
         AND periode = $2
         AND id_pengajar = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [id_santri, periode, id_pengajar]
    );

    let raporTahfidz = tahfidz.rows[0] || null;

    if (raporTahfidz) {
      const simakan = await db.query(
        `SELECT juz, nilai
         FROM tahfidz_simakan
         WHERE id_rapor = $1
         ORDER BY juz`,
        [raporTahfidz.id_rapor]
      );
      raporTahfidz.simakan = simakan.rows;
    }

    res.json({
      success: true,
      rapor_tahsin: tahsin.rows[0] || null,
      rapor_tahfidz: raporTahfidz
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSantriByJadwal = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    const { id_jadwal } = req.params;

    if (!id_jadwal)
      return res.status(400).json({ message: "Jadwal tidak valid" });

    // 🔒 Pastikan jadwal milik pengajar
    const cekJadwal = await db.query(
      `SELECT 1 FROM jadwal 
       WHERE id_jadwal = $1 AND id_pengajar = $2`,
      [id_jadwal, id_pengajar]
    );

    if (cekJadwal.rowCount === 0)
      return res.status(403).json({ message: "Bukan sesi Anda" });

    const santri = await db.query(
      `SELECT s.id_santri, s.nama
       FROM santri s
       JOIN santri_jadwal sj ON s.id_santri = sj.id_santri
       WHERE sj.id_jadwal = $1
       ORDER BY s.nama ASC`,
      [id_jadwal]
    );

    res.json(santri.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal ambil santri" });
  }
};