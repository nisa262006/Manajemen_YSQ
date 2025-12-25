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

/* ================= PENGAJAR ================= */

// CREATE / INPUT PROGRES
exports.createProgres = async (req, res) => {
  const id_pengajar = await getIdPengajar(req.user.id_users);
  const { id_santri, id_kelas, minggu_ke, catatan, nilai } = req.body;

  // validasi kelas milik pengajar
  const cek = await db.query(
    "SELECT 1 FROM kelas WHERE id_kelas=$1 AND id_pengajar=$2",
    [id_kelas, id_pengajar]
  );
  if (cek.rowCount === 0)
    return res.status(403).json({ message: "Bukan kelas Anda" });

  const q = await db.query(`
    INSERT INTO progres_pembelajaran
    (id_santri,id_kelas,minggu_ke,catatan,nilai)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (id_santri,id_kelas,minggu_ke)
    DO UPDATE SET catatan=$4, nilai=$5
    RETURNING *
  `, [id_santri, id_kelas, minggu_ke, catatan, nilai]);

  res.json(q.rows[0]);
};

// UPDATE PROGRES
exports.updateProgres = async (req, res) => {
  const { id } = req.params;
  const { catatan, nilai } = req.body;

  await db.query(`
    UPDATE progres_pembelajaran
    SET catatan=$1, nilai=$2
    WHERE id_progres=$3
  `, [catatan, nilai, id]);

  res.json({ message: "Progres diperbarui" });
};

// DELETE PROGRES
exports.deleteProgres = async (req, res) => {
  await db.query(
    "DELETE FROM progres_pembelajaran WHERE id_progres=$1",
    [req.params.id]
  );
  res.json({ message: "Progres dihapus" });
};

// REKAP NILAI PER KELAS
exports.rekapKelas = async (req, res) => {
  const { id_kelas } = req.params;

  const q = await db.query(`
    SELECT s.nama,
           AVG(p.nilai) AS rata_nilai,
           COUNT(p.id_progres) AS jumlah_penilaian
    FROM progres_pembelajaran p
    JOIN santri s ON p.id_santri=s.id_santri
    WHERE p.id_kelas=$1
    GROUP BY s.nama
    ORDER BY s.nama
  `, [id_kelas]);

  res.json(q.rows);
};

/* ================= SANTRI ================= */

exports.getProgresSantri = async (req, res) => {
  const id_santri = await getIdSantri(req.user.id_users);

  const q = await db.query(`
    SELECT p.*, k.nama_kelas
    FROM progres_pembelajaran p
    JOIN kelas k ON p.id_kelas=k.id_kelas
    WHERE p.id_santri=$1
    ORDER BY p.created_at DESC
  `, [id_santri]);

  res.json(q.rows);
};

/* ================= ADMIN ================= */

exports.getLaporanAdmin = async (req, res) => {
  const q = await db.query(`
    SELECT
      s.nama AS nama_santri,
      k.nama_kelas,
      AVG(p.nilai) AS rata_nilai,
      COUNT(p.id_progres) AS total_penilaian
    FROM progres_pembelajaran p
    JOIN santri s ON p.id_santri=s.id_santri
    JOIN kelas k ON p.id_kelas=k.id_kelas
    GROUP BY s.nama, k.nama_kelas
    ORDER BY k.nama_kelas, s.nama
  `);

  res.json(q.rows);
};
