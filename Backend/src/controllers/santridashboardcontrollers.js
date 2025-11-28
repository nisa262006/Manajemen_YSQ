const db = require("../config/db");

exports.getDashboardSantri = async (req, res) => {
  try {
    const id_users = req.users.id_users;

    // 1. Ambil data santri
    const santri = await db.query(`
      SELECT 
        s.id_santri,
        s.nis,
        s.nama,
        s.kategori,
        s.tempat_lahir,
        s.tanggal_lahir,
        s.no_wa,
        s.status,
        k.id_kelas,
        k.nama_kelas,
        k.level
      FROM santri s
      LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
      WHERE s.id_users = $1
    `, [id_users]);

    if (santri.rowCount === 0)
      return res.status(404).json({ message: "Data santri tidak ditemukan" });

    const infoSantri = santri.rows[0];

    // 2. Ambil jadwal kelas santri
    const jadwal = await db.query(`
      SELECT 
        j.id_jadwal,
        j.hari,
        j.jam_mulai,
        j.jam_selesai,
        u.nama_lengkap AS pengajar
      FROM jadwal j
      JOIN kelas k ON j.id_kelas = k.id_kelas
      JOIN pengajar p ON k.id_pengajar = p.id_pengajar
      JOIN users u ON p.id_users = u.id_users
      WHERE k.id_kelas = $1
      ORDER BY 
        CASE 
          WHEN hari='Senin' THEN 1
          WHEN hari='Selasa' THEN 2
          WHEN hari='Rabu' THEN 3
          WHEN hari='Kamis' THEN 4
          WHEN hari='Jumat' THEN 5
          WHEN hari='Sabtu' THEN 6
          WHEN hari='Minggu' THEN 7
        END,
        jam_mulai ASC
    `, [infoSantri.id_kelas]);

    // 3. Response lengkap
    res.json({
      santri: infoSantri,
      jadwal: jadwal.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
