const db = require("../config/db");

exports.getDashboardSantri = async (req, res) => {
  try {
    const id_users = req.users.id_users;

    // 1. Ambil data santri
    const santriResult = await db.query(`
      SELECT 
        s.id_santri,
        s.nis,
        s.nama,
        s.kategori,
        s.status,
        s.id_kelas,
        k.nama_kelas,
        k.level
      FROM santri s
      LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
      WHERE s.id_users = $1
    `, [id_users]);

    if (santriResult.rowCount === 0) {
      return res.status(404).json({ message: "Data santri tidak ditemukan" });
    }

    const santri = santriResult.rows[0];

    // 2. JIKA BELUM PUNYA KELAS → KIRIM JADWAL KOSONG
    if (!santri.id_kelas) {
      return res.json({
        santri,
        jadwal: []
      });
    }

    // 3. Ambil jadwal jika sudah punya kelas
    const jadwalResult = await db.query(`
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
    `, [santri.id_kelas]);

    res.json({
      santri,
      jadwal: jadwalResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
