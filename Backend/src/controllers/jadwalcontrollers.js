const pool = require("../config/db");

exports.tambahJadwal = async (req, res) => {
  const { id_kelas, hari, jam_mulai, jam_selesai, lokasi } = req.body;
  if (!id_kelas || !hari || !jam_mulai || !jam_selesai) return res.status(400).json({ message: "id_kelas, hari, jam_mulai, jam_selesai wajib" });

  try {
    const r = await pool.query(`INSERT INTO jadwal (id_kelas, hari, jam_mulai, jam_selesai, lokasi) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id_kelas, hari, jam_mulai, jam_selesai, lokasi || null]);
    res.status(201).json({ message: "Jadwal ditambahkan", jadwal: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah jadwal" });
  }
};

exports.getJadwalByKelas = async (req, res) => {
  const { id_kelas } = req.params;
  try {
    const r = await pool.query("SELECT * FROM jadwal WHERE id_kelas=$1 ORDER BY hari, jam_mulai", [id_kelas]);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil jadwal" });
  }
};

exports.updateJadwal = async (req, res) => {
  const { id } = req.params;
  const { hari, jam_mulai, jam_selesai, lokasi } = req.body;
  try {
    await pool.query("UPDATE jadwal SET hari=$1, jam_mulai=$2, jam_selesai=$3, lokasi=$4 WHERE id=$5",
      [hari, jam_mulai, jam_selesai, lokasi, id]);
    res.json({ message: "Jadwal diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui jadwal" });
  }
};

exports.deleteJadwal = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM jadwal WHERE id=$1", [id]);
    res.json({ message: "Jadwal dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus jadwal" });
  }
};
