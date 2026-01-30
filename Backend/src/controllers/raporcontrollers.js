const db = require("../config/db");

/* ================= HELPER ================= */
async function getIdPengajar(id_users) {
  const q = await db.query(
    `SELECT id_pengajar FROM pengajar WHERE id_users = $1`,
    [id_users]
  );
  return q.rows[0]?.id_pengajar ?? null;
}

/* =====================================================
   RAPOR TAHSIN
===================================================== */
exports.createRaporTahsin = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    if (!id_pengajar) {
      return res.status(403).json({ message: "Bukan pengajar" });
    }

    const {
      id_santri,
      periode,
      nilai_pekanan,
      ujian_tilawah,
      nilai_teori,
      nilai_presensi,
      catatan
    } = req.body;

    // 🔴 CEK DUPLIKAT DULU
    const cek = await db.query(
      `
      SELECT 1 FROM rapor_tahsin
      WHERE id_santri = $1 AND periode = $2
      `,
      [id_santri, periode]
    );

    if (cek.rowCount > 0) {
      return res.status(400).json({
        message: "Rapor Tahsin untuk periode ini sudah dibuat"
      });
    }

    // hitung nilai akhir
    const nilai_akhir =
      (nilai_pekanan + ujian_tilawah + nilai_teori + nilai_presensi) / 4;

    await db.query(
      `
      INSERT INTO rapor_tahsin
      (id_santri, id_pengajar, periode,
       nilai_pekanan, ujian_tilawah, nilai_teori, nilai_presensi,
       nilai_akhir, catatan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        id_santri,
        id_pengajar,
        periode,
        nilai_pekanan,
        ujian_tilawah,
        nilai_teori,
        nilai_presensi,
        nilai_akhir,
        catatan
      ]
    );

    res.json({ success: true, message: "Rapor Tahsin berhasil disimpan" });

  } catch (err) {
    console.error("TAHSIN ERROR:", err);
    res.status(500).json({ message: "Kesalahan server" });
  }
};


/* =====================================================
   RAPOR TAHFIDZ (HEADER)
===================================================== */
exports.createRaporTahfidz = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    if (!id_pengajar) {
      return res.status(403).json({ message: "Bukan pengajar" });
    }

    const { id_santri, periode } = req.body;

    // 🔴 CEK DUPLIKAT HEADER
    const cek = await db.query(
      `
      SELECT id_rapor FROM rapor_tahfidz
      WHERE id_santri = $1 AND periode = $2
      `,
      [id_santri, periode]
    );

    if (cek.rowCount > 0) {
      return res.status(400).json({
        message: "Rapor Tahfidz untuk periode ini sudah dibuat"
      });
    }

    // cek kelas tahfidz
    const kelas = await db.query(
      `
      SELECT k.nama_kelas
      FROM santri_kelas sk
      JOIN kelas k ON sk.id_kelas = k.id_kelas
      WHERE sk.id_santri = $1
      `,
      [id_santri]
    );

    if (!kelas.rows[0]?.nama_kelas.toLowerCase().includes("tahfidz")) {
      return res.status(403).json({
        message: "Santri bukan kelas Tahfidz"
      });
    }

    const q = await db.query(
      `
      INSERT INTO rapor_tahfidz (id_santri, id_pengajar, periode)
      VALUES ($1,$2,$3)
      RETURNING id_rapor
      `,
      [id_santri, id_pengajar, periode]
    );

    res.json({
      success: true,
      id_rapor: q.rows[0].id_rapor,
      message: "Rapor Tahfidz berhasil dibuat"
    });

  } catch (err) {
    console.error("TAHFIDZ ERROR:", err);
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
      `
      INSERT INTO tahfidz_simakan (id_rapor, juz, nilai)
      VALUES ($1,$2,$3)
      ON CONFLICT (id_rapor, juz)
      DO UPDATE SET nilai = EXCLUDED.nilai
      `,
      [id_rapor, juz, nilai]
    );

    res.json({ message: `Nilai simakan Juz ${juz} tersimpan` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   FINALISASI RAPOR TAHFIDZ
===================================================== */
exports.finalisasiTahfidz = async (req, res) => {
  try {
    const { id_rapor, nilai_ujian_akhir } = req.body;

    const q = await db.query(
      `SELECT AVG(nilai) AS rata FROM tahfidz_simakan WHERE id_rapor=$1`,
      [id_rapor]
    );

    const rata_simakan = Number(q.rows[0].rata || 0);
    const nilai_akhir = (rata_simakan + nilai_ujian_akhir) / 2;

    await db.query(
      `
      UPDATE rapor_tahfidz
      SET nilai_rata_simakan=$1,
          nilai_ujian_akhir=$2,
          nilai_akhir=$3
      WHERE id_rapor=$4
      `,
      [rata_simakan, nilai_ujian_akhir, nilai_akhir, id_rapor]
    );

    res.json({ message: "Rapor Tahfidz berhasil difinalisasi" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

//////////////////////////////////////////////////////////
exports.getRaporPengajar = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);

    const tahsin = await db.query(
      `
      SELECT r.*, s.nama AS nama_santri
      FROM rapor_tahsin r
      JOIN santri s ON r.id_santri = s.id_santri
      WHERE r.id_pengajar = $1
      ORDER BY r.created_at DESC
      `,
      [id_pengajar]
    );

    const tahfidz = await db.query(
      `
      SELECT r.*, s.nama AS nama_santri
      FROM rapor_tahfidz r
      JOIN santri s ON r.id_santri = s.id_santri
      WHERE r.id_pengajar = $1
      ORDER BY r.created_at DESC
      `,
      [id_pengajar]
    );

    res.json({
      success: true,
      tahsin: tahsin.rows,
      tahfidz: tahfidz.rows
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


////////////////////////////////////////////////////////
exports.updateRaporTahsin = async (req, res) => {
  const id_pengajar = await getIdPengajar(req.user.id_users);

  const {
    nilai_pekanan,
    ujian_tilawah,
    nilai_teori,
    nilai_presensi,
    catatan
  } = req.body;

  const nilai_akhir =
    (nilai_pekanan + ujian_tilawah + nilai_teori + nilai_presensi) / 4;

  await db.query(
    `
    UPDATE rapor_tahsin
    SET nilai_pekanan=$1,
        ujian_tilawah=$2,
        nilai_teori=$3,
        nilai_presensi=$4,
        nilai_akhir=$5,
        catatan=$6
    WHERE id_rapor=$7 AND id_pengajar=$8
    `,
    [
      nilai_pekanan,
      ujian_tilawah,
      nilai_teori,
      nilai_presensi,
      nilai_akhir,
      catatan,
      req.params.id,
      id_pengajar
    ]
  );

  res.json({ message: "Rapor Tahsin diperbarui" });
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
    // 1️⃣ Ambil identitas santri + kelas + pengajar
    const identitas = await db.query(
      `
      SELECT 
        s.id_santri,
        s.nama,
        s.nis,
        k.nama_kelas,
        p.nama AS nama_pengajar
      FROM santri s
      JOIN santri_kelas sk ON s.id_santri = sk.id_santri
      JOIN kelas k ON sk.id_kelas = k.id_kelas
      JOIN pengajar p ON k.id_pengajar = p.id_pengajar
      WHERE s.id_users = $1
      `,
      [req.user.id_users]
    );

    if (identitas.rowCount === 0) {
      return res.status(404).json({ message: "Data santri tidak ditemukan" });
    }

    const santri = identitas.rows[0];

    // 2️⃣ Rapor Tahsin
    const tahsinQ = await db.query(
      `
      SELECT *
      FROM rapor_tahsin
      WHERE id_santri = $1
      ORDER BY periode DESC
      LIMIT 1
      `,
      [santri.id_santri]
    );

    // 3️⃣ Rapor Tahfidz (jika ada)
    const tahfidzQ = await db.query(
      `
      SELECT *
      FROM rapor_tahfidz
      WHERE id_santri = $1
      ORDER BY periode DESC
      LIMIT 1
      `,
      [santri.id_santri]
    );

    let raporTahfidz = null;

    if (tahfidzQ.rowCount > 0) {
      const rapor = tahfidzQ.rows[0];

      // 🔑 AMBIL DETAIL SIMAKAN PER JUZ
      const simakanQ = await db.query(
        `
        SELECT juz, nilai
        FROM tahfidz_simakan
        WHERE id_rapor = $1
        ORDER BY juz
        `,
        [rapor.id_rapor]
      );

      rapor.simakan = simakanQ.rows;
      raporTahfidz = rapor;
    }

    res.json({
      success: true,
      santri: {
        nama: santri.nama,
        nis: santri.nis,
        kelas: santri.nama_kelas,
        pengajar: santri.nama_pengajar
      },
      rapor_tahsin: tahsinQ.rows[0] || null,
      rapor_tahfidz: raporTahfidz
    });

  } catch (err) {
    console.error("GET RAPOR SANTRI ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
