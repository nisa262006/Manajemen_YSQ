const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.daftarPendaftar = async (req, res) => {
  const { nama, email, no_wa, tempat_lahir, tanggal_lahir } = req.body;

  await db.query(
    `INSERT INTO pendaftar 
    (nama, email, no_wa, tempat_lahir, tanggal_lahir, status)
    VALUES ($1, $2, $3, $4, $5, 'menunggu')`,
    [nama, email, no_wa, tempat_lahir, tanggal_lahir]
  );

  res.json({ message: "Pendaftaran berhasil. Menunggu verifikasi admin." });
};

exports.getAllPendaftar = async (req, res) => {
  const data = await db.query("SELECT * FROM pendaftar ORDER BY id_pendaftar DESC");
  res.json(data.rows);
};

function generateNIS(id) {
  return `YSQ-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

exports.terimaPendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;

  // ambil data pendaftar
  const result = await db.query(
    "SELECT * FROM pendaftar WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  if (result.rowCount === 0)
    return res.status(404).json({ message: "Pendaftar tidak ditemukan" });

  const p = result.rows[0];

  // create user login
  const defaultPassword = "12345";
  const hash = await bcrypt.hash(defaultPassword, 10);

  const user = await db.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'santri')
     RETURNING id_user`,
    [p.email, hash]
  );

  const id_user = user.rows[0].id_user;

  // generate NIS
  const nis = generateNIS(id_pendaftar);

  // pindahkan ke tabel santri
  await db.query(
    `INSERT INTO santri 
      (id_user, nis, nama, email, no_wa, tempat_lahir, tanggal_lahir, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'aktif')`,
    [
      id_user,
      nis,
      p.nama,
      p.email,
      p.no_wa,
      p.tempat_lahir,
      p.tanggal_lahir
    ]
  );

  // update status pendaftar
  await db.query(
    "UPDATE pendaftar SET status = 'diterima' WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  res.json({ message: "Pendaftar diterima, akun santri dibuat.", nis });
};

exports.tolakPendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;

  await db.query(
    "UPDATE pendaftar SET status = 'ditolak' WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  res.json({ message: "Pendaftar ditolak." });
};

exports.deletePendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;

  await db.query(
    "DELETE FROM pendaftar WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  res.json({ message: "Pendaftar dihapus." });
};

