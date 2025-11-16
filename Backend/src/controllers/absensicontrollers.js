exports.catatAbsensiSantri = async (req, res) => {
  const { id_santri, id_jadwal, tanggal, status } = req.body;
  const pengajar = req.user.id_user;

  // 1. Validasi: jadwal harus milik pengajar
  const cekJadwal = await db.query(`
    SELECT j.id_jadwal 
    FROM jadwal j
    JOIN kelas k ON j.id_kelas = k.id_kelas
    WHERE j.id_jadwal = $1 AND k.id_pengajar = $2
  `, [id_jadwal, pengajar]);

  if (cekJadwal.rowCount === 0)
    return res.status(403).json({ message: "Tidak boleh mengabsen kelas yang bukan milik Anda" });

  // 2. Validasi: santri harus terdaftar pada kelas jadwal tersebut
  const cekSantri = await db.query(`
    SELECT s.id_santri
    FROM santri s
    JOIN kelas k ON s.id_kelas = k.id_kelas
    JOIN jadwal j ON k.id_kelas = j.id_kelas
    WHERE s.id_santri = $1 AND j.id_jadwal = $2
  `, [id_santri, id_jadwal]);

  if (cekSantri.rowCount === 0)
    return res.status(400).json({
      message: "Santri tidak terdaftar pada kelas jadwal tersebut"
    });

  // 3. Cegah absensi ganda
  const cekDuplikat = await db.query(`
    SELECT * FROM presensi_peserta
    WHERE id_santri = $1 AND id_jadwal = $2 AND tanggal = $3
  `, [id_santri, id_jadwal, tanggal]);

  if (cekDuplikat.rowCount > 0)
    return res.status(400).json({
      message: "Absensi sudah tercatat hari ini"
    });

  // 4. Insert absensi
  await db.query(`
    INSERT INTO presensi_peserta(id_santri, id_jadwal, tanggal, status)
    VALUES($1,$2,$3,$4)
  `, [id_santri, id_jadwal, tanggal, status]);

  res.json({ message: "Absensi santri dicatat" });
};


//===========absensi di batasi ============//

exports.updateAbsensiSantri = async (req, res) => {
  const { id_presensi } = req.params;
  const { status } = req.body;
  const pengajar = req.user.id_user;

  // Validasi: hanya absensi kelasnya
  const cek = await db.query(`
    SELECT p.id_presensi
    FROM presensi_peserta p
    JOIN jadwal j ON p.id_jadwal = j.id_jadwal
    JOIN kelas k ON j.id_kelas = k.id_kelas
    WHERE p.id_presensi = $1 AND k.id_pengajar = $2
  `, [id_presensi, pengajar]);

  if (cek.rowCount === 0)
    return res.status(403).json({
      message: "Tidak boleh mengedit absensi kelas lain"
    });

  await db.query(`
    UPDATE presensi_peserta SET status = $1 WHERE id_presensi = $2
  `, [status, id_presensi]);

  res.json({ message: "Absensi santri diperbarui" });
};


//===========pengajar lihat absen santri (kelasnya sendiri)============//

exports.getAbsensiKelasPengajar = async (req, res) => {
  const pengajar = req.user.id_user;

  const result = await db.query(`
    SELECT 
      p.*, 
      s.nama AS nama_santri,
      k.nama_kelas,
      j.hari, j.jam_mulai, j.jam_selesai
    FROM presensi_peserta p
    JOIN santri s ON p.id_santri = s.id_santri
    JOIN jadwal j ON p.id_jadwal = j.id_jadwal
    JOIN kelas k ON j.id_kelas = k.id_kelas
    WHERE k.id_pengajar = $1
    ORDER BY tanggal DESC
  `, [pengajar]);

  res.json(result.rows);
};


//===========absen santri role============//

exports.getAbsensiSantri = async (req, res) => {
  const id_user = req.user.id_user;

  const result = await db.query(`
    SELECT 
      p.*, 
      k.nama_kelas,
      j.hari, j.jam_mulai, j.jam_selesai
    FROM presensi_peserta p
    JOIN santri s ON p.id_santri = s.id_santri
    JOIN jadwal j ON p.id_jadwal = j.id_jadwal
    JOIN kelas k ON j.id_kelas = k.id_kelas
    WHERE s.id_user = $1
    ORDER BY tanggal DESC
  `, [id_user]);

  res.json(result.rows);
};


//absensi pengajar
exports.catatAbsensiPengajar = async (req, res) => {
  const { id_jadwal, tanggal, status } = req.body;
  const id_pengajar = req.user.id_user;

  // Cegah absensi ganda
  const duplikat = await db.query(`
    SELECT * FROM presensi_pengajar
    WHERE id_pengajar = $1 AND id_jadwal = $2 AND tanggal = $3
  `, [id_pengajar, id_jadwal, tanggal]);

  if (duplikat.rowCount > 0)
    return res.status(400).json({ message: "Absensi sudah dicatat hari ini" });

  await db.query(`
    INSERT INTO presensi_pengajar(id_pengajar, id_jadwal, tanggal, status)
    VALUES ($1,$2,$3,$4)
  `, [id_pengajar, id_jadwal, tanggal, status]);

  res.json({ message: "Absensi pengajar dicatat" });
};


//===========pengajar melihat absensi sendiri============//
exports.getAbsensiPengajar = async (req, res) => {
  const id_pengajar = req.user.id_user;

  const result = await db.query(`
    SELECT 
      p.*,
      k.nama_kelas,
      j.hari, j.jam_mulai
    FROM presensi_pengajar p
    JOIN jadwal j ON p.id_jadwal = j.id_jadwal
    JOIN kelas k ON j.id_kelas = k.id_kelas
    WHERE p.id_pengajar = $1
    ORDER BY tanggal DESC
  `, [id_pengajar]);

  res.json(result.rows);
};


//============ADMIN MELIHAT SEMUA ABSEN PENGAJAR===========//

exports.getAllAbsensiPengajar = async (req, res) => {
  const result = await db.query(`
    SELECT 
      p.*,
      u.nama_lengkap AS pengajar,
      k.nama_kelas,
      j.hari, j.jam_mulai
    FROM presensi_pengajar p
    JOIN users u ON p.id_pengajar = u.id_user
    JOIN jadwal j ON p.id_jadwal = j.id_jadwal
    JOIN kelas k ON j.id_kelas = k.id_kelas
    ORDER BY tanggal DESC
  `);

  res.json(result.rows);
};
