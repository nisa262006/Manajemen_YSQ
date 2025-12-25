const db = require("../config/db");

/* ================= HELPER ================= */
async function getIdPengajar(id_users) {
  const q = await db.query(
    "SELECT id_pengajar FROM pengajar WHERE id_users=$1",
    [id_users]
  );
  return q.rows[0]?.id_pengajar;
}

async function getIdSantri(id_users) {
  const q = await db.query(
    "SELECT id_santri FROM santri WHERE id_users=$1",
    [id_users]
  );
  return q.rows[0]?.id_santri;
}

/* =====================================================
   =================== PENGAJAR ========================
===================================================== */

// ================= TUGAS =================

// CREATE TUGAS
exports.createTugas = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    const { id_kelas, judul, deskripsi, due_date, allow_file, allow_text } = req.body;

    const q = await db.query(`
      INSERT INTO tugas
      (id_kelas,id_pengajar,judul,deskripsi,due_date,allow_file,allow_text)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [id_kelas, id_pengajar, judul, deskripsi, due_date, allow_file, allow_text]);

    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat tugas" });
  }
};

// LIST TUGAS PENGAJAR
exports.getTugasPengajar = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);

    const q = await db.query(`
      SELECT t.*, k.nama_kelas
      FROM tugas t
      JOIN kelas k ON t.id_kelas = k.id_kelas
      WHERE t.id_pengajar = $1
      ORDER BY t.due_date DESC
    `, [id_pengajar]);

    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil tugas" });
  }
};

// UPDATE TUGAS
exports.updateTugas = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, deskripsi, due_date } = req.body;

    await db.query(`
      UPDATE tugas
      SET judul=$1, deskripsi=$2, due_date=$3
      WHERE id_tugas=$4
    `, [judul, deskripsi, due_date, id]);

    res.json({ message: "Tugas diperbarui" });
  } catch (err) {
    res.status(500).json({ message: "Gagal update tugas" });
  }
};

// DELETE TUGAS
exports.deleteTugas = async (req, res) => {
  try {
    await db.query("DELETE FROM tugas WHERE id_tugas=$1", [req.params.id]);
    res.json({ message: "Tugas dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus tugas" });
  }
};

// MONITORING TUGAS
exports.monitoringTugas = async (req, res) => {
  try {
    const { id } = req.params;

    const q = await db.query(`
      SELECT s.id_santri, s.nama,
        CASE
          WHEN pt.id_pengumpulan IS NULL THEN 'BELUM'
          ELSE 'SUDAH'
        END AS status
      FROM santri_kelas sk
      JOIN santri s ON sk.id_santri = s.id_santri
      LEFT JOIN pengumpulan_tugas pt
        ON pt.id_santri = s.id_santri
       AND pt.id_tugas = $1
      WHERE sk.id_kelas = (
        SELECT id_kelas FROM tugas WHERE id_tugas = $1
      )
      ORDER BY s.nama
    `, [id]);

    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal monitoring tugas" });
  }
};

// ================= MEDIA AJAR =================

// CREATE MEDIA
exports.createMedia = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);
    const { id_kelas, judul, tipe, file_path, link_url } = req.body;

    const q = await db.query(`
      INSERT INTO media_ajar
      (id_kelas,id_pengajar,judul,tipe,file_path,link_url)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [id_kelas, id_pengajar, judul, tipe, file_path, link_url]);

    res.json(q.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan media ajar" });
  }
};

// LIST MEDIA PENGAJAR
exports.getMediaPengajar = async (req, res) => {
  try {
    const id_pengajar = await getIdPengajar(req.user.id_users);

    const q = await db.query(`
      SELECT m.*, k.nama_kelas
      FROM media_ajar m
      JOIN kelas k ON m.id_kelas = k.id_kelas
      WHERE m.id_pengajar = $1
      ORDER BY m.created_at DESC
    `, [id_pengajar]);

    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil media ajar" });
  }
};

// DELETE MEDIA
exports.deleteMedia = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM media_ajar WHERE id_media=$1",
      [req.params.id]
    );
    res.json({ message: "Media ajar dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus media" });
  }
};

/* =====================================================
   =================== SANTRI ==========================
===================================================== */

// LIST TUGAS SANTRI
exports.getTugasSantri = async (req, res) => {
  try {
    const id_santri = await getIdSantri(req.user.id_users);

    const q = await db.query(`
      SELECT t.*, k.nama_kelas,
        pt.id_pengumpulan,
        pt.submitted_at
      FROM santri_kelas sk
      JOIN tugas t ON sk.id_kelas = t.id_kelas
      JOIN kelas k ON t.id_kelas = k.id_kelas
      LEFT JOIN pengumpulan_tugas pt
        ON pt.id_tugas = t.id_tugas
       AND pt.id_santri = $1
      WHERE sk.id_santri = $1
      ORDER BY t.due_date ASC
    `, [id_santri]);

    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil tugas santri" });
  }
};

// SUBMIT TUGAS
exports.submitTugas = async (req, res) => {
  try {
    const id_santri = await getIdSantri(req.user.id_users);
    const { id_tugas, jawaban_text, file_path } = req.body;

    await db.query(`
      INSERT INTO pengumpulan_tugas
      (id_tugas,id_santri,jawaban_text,file_path)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (id_tugas,id_santri)
      DO UPDATE SET
        jawaban_text = $3,
        file_path = $4,
        submitted_at = NOW()
    `, [id_tugas, id_santri, jawaban_text, file_path]);

    res.json({ message: "Tugas berhasil dikumpulkan" });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengumpulkan tugas" });
  }
};

// MEDIA SANTRI
exports.getMediaSantri = async (req, res) => {
  try {
    const id_santri = await getIdSantri(req.user.id_users);

    const q = await db.query(`
      SELECT m.*, k.nama_kelas
      FROM media_ajar m
      JOIN kelas k ON m.id_kelas = k.id_kelas
      JOIN santri_kelas sk ON sk.id_kelas = k.id_kelas
      WHERE sk.id_santri = $1
      ORDER BY m.created_at DESC
    `, [id_santri]);

    res.json(q.rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil media santri" });
  }
};
