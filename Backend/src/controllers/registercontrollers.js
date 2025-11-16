const db = require("../config/db");
const bcrypt = require("bcrypt");

// Publik: daftar santri
exports.daftarPendaftar = async (req, res) => {
  const { nama, email, wa } = req.body;

  await db.query(
    "INSERT INTO santri(nama, status) VALUES($1, 'Menunggu')",
    [nama]
  );

  res.json({ message: "Pendaftaran berhasil, menunggu verifikasi admin" });
};

// Admin: lihat semua pendaftar
exports.getAllPendaftar = async (req, res) => {
  const data = await db.query("SELECT * FROM santri ORDER BY id_santri DESC");
  res.json(data.rows);
};

// Admin: update status pendaftar
exports.updateStatus = async (req, res) => {
  const { id_santri } = req.params;
  const { status } = req.body;

  // Jika admin menerima pendaftar
  if (status === "Diterima") {
    const password = "12345";
    const hash = await bcrypt.hash(password, 10);

    const newUser = await db.query(
      "INSERT INTO users(email, password_hash, role) VALUES($1,$2,'santri') RETURNING id_user",
      ["email@dummy.com", hash]
    );

    await db.query(
      "UPDATE santri SET status = 'Aktif', id_user = $1 WHERE id_santri = $2",
      [newUser.rows[0].id_user, id_santri]
    );

    return res.json({ message: "Pendaftar diterima dan akun dibuat" });
  }

  // Jika admin menolak
  await db.query(
    "UPDATE santri SET status = $1 WHERE id_santri = $2",
    [status, id_santri]
  );

  res.json({ message: "Status pendaftar diperbarui" });
};

// Admin: hapus pendaftar
exports.deletePendaftar = async (req, res) => {
  const { id_santri } = req.params;

  await db.query("DELETE FROM santri WHERE id_santri = $1", [id_santri]);

  res.json({ message: "Data pendaftar dihapus" });
};
