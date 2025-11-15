const pool = require("../config/db");

exports.tambahKelas = async (req, res) => {
  const { id_program, id_pengajar, nama_kelas, kapasitas } = req.body;
  if (!nama_kelas) return res.status(400).json({ message: "nama_kelas diperlukan" });

  try {
    const q = `INSERT INTO kelas (id_program, id_pengajar, nama_kelas, kapasitas) VALUES ($1,$2,$3,$4) RETURNING *`;
    const r = await pool.query(q, [id_program || null, id_pengajar || null, nama_kelas, kapasitas || 20]);
    res.status(201).json({ message: "Kelas dibuat", kelas: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat kelas" });
  }
};

exports.getKelas = async (req, res) => {
  try {
    const q = `SELECT k.*, p.nama_program, pg.nama as pengajar_nama FROM kelas k
               LEFT JOIN program p ON k.id_program = p.id
               LEFT JOIN pengajar pg ON k.id_pengajar = pg.id
               ORDER BY k.id`;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil kelas" });
  }
};

exports.updateKelas = async (req, res) => {
  const { id } = req.params;
  const { id_program, id_pengajar, nama_kelas, kapasitas, status } = req.body;
  try {
    await pool.query(`UPDATE kelas SET id_program=$1, id_pengajar=$2, nama_kelas=$3, kapasitas=$4, status=$5 WHERE id=$6`,
      [id_program, id_pengajar, nama_kelas, kapasitas, status, id]);
    res.json({ message: "Kelas diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui kelas" });
  }
};

exports.hapusKelas = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM kelas WHERE id=$1", [id]);
    res.json({ message: "Kelas dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus kelas" });
  }
};

// Penempatan santri ke kelas (single atau massal)
exports.penempatanSantri = async (req, res) => {
  // body: { id_kelas, ids_santri: [1,2,3] }
  const { id_kelas, ids_santri } = req.body;
  if (!id_kelas || !Array.isArray(ids_santri)) return res.status(400).json({ message: "id_kelas dan ids_santri [] diperlukan" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const id_santri of ids_santri) {
      // cek unik
      await client.query(`INSERT INTO santri_kelas (id_santri, id_kelas) VALUES ($1,$2) ON CONFLICT (id_santri, id_kelas) DO NOTHING`, [id_santri, id_kelas]);
    }
    await client.query("COMMIT");
    res.json({ message: "Penempatan selesai" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Gagal melakukan penempatan" });
  } finally {
    client.release();
  }
};
