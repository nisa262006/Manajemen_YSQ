const db = require("../config/db");
const bcrypt = require("bcrypt");

// === Daftar pendaftar baru (public) ===
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

// === Ambil semua pendaftar ===
exports.getAllPendaftar = async (req, res) => {
  const data = await db.query("SELECT * FROM pendaftar ORDER BY id_pendaftar DESC");
  res.json(data.rows);
};

// === Generate NIS ===
function generateNIS(id) {
  return `YSQ-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
}

// === Terima pendaftar ===
exports.terimaPendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;

  // Ambil data pendaftar
  const result = await db.query(
    "SELECT * FROM pendaftar WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  if (result.rowCount === 0)
    return res.status(404).json({ message: "Pendaftar tidak ditemukan" });

  const p = result.rows[0];

  // Buat akun user login untuk santri
  const defaultPassword = "12345";
  const hash = await bcrypt.hash(defaultPassword, 10);

  const users = await db.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'santri')
     RETURNING id_users`,
    [p.email, hash]
  );

  const id_users = users.rows[0].id_users;

  // Generate NIS untuk santri
  const nis = generateNIS(id_pendaftar);

  // Pindahkan data ke tabel santri (cocok dg struktur tabel santri kamu)
  await db.query(
    `INSERT INTO santri 
      (id_users, nis, nama, kategori, no_wa, tempat_lahir, tanggal_lahir, status)
     VALUES ($1, $2, $3, 'dewasa', $4, $5, $6, 'aktif')`,
    [
      id_users,
      nis,
      p.nama,
      p.no_wa,
      p.tempat_lahir,
      p.tanggal_lahir,
    ]
  );  

  // Update status pendaftar
  await db.query(
    "UPDATE pendaftar SET status = 'diterima' WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  res.json({ message: "Pendaftar diterima, akun santri dibuat.", nis });
};

// === Tolak pendaftar ===
exports.tolakPendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;

  await db.query(
    "UPDATE pendaftar SET status = 'ditolak' WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  res.json({ message: "Pendaftar ditolak." });
};

// === Hapus pendaftar ===
exports.deletePendaftar = async (req, res) => {
  const { id_pendaftar } = req.params;

  await db.query(
    "DELETE FROM pendaftar WHERE id_pendaftar = $1",
    [id_pendaftar]
  );

  res.json({ message: "Pendaftar dihapus." });
};
