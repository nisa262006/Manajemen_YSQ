const pool = require("../config/db");

exports.absenSantri = async (req, res) => {
  // body: { id_santri, id_jadwal, status }
  const { id_santri, id_jadwal, status } = req.body;
  if (!id_santri || !id_jadwal || !status) return res.status(400).json({ message: "id_santri, id_jadwal, status wajib" });
  if (!['Hadir','Izin','Sakit','Alpha'].includes(status)) return res.status(400).json({ message: "status invalid" });

  try {
    await pool.query(`INSERT INTO presensi_peserta (id_santri, id_jadwal, status) VALUES ($1,$2,$3)`, [id_santri, id_jadwal, status]);
    res.json({ message: "Absensi tercatat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mencatat absensi" });
  }
};

exports.getAbsensiBySantri = async (req, res) => {
  const { id_santri } = req.params;
  try {
    const q = `SELECT p.*, j.hari, j.jam_mulai, j.jam_selesai, k.nama_kelas
               FROM presensi_peserta p
               JOIN jadwal j ON p.id_jadwal = j.id
               JOIN kelas k ON j.id_kelas = k.id
               WHERE p.id_santri=$1
               ORDER BY p.tanggal DESC`;
    const r = await pool.query(q,[id_santri]);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil absensi" });
  }
};
