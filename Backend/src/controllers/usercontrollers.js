const db = require("../config/db");

// Admin: Lihat semua user
exports.getAllUsers = async (req, res) => {
  const users = await db.query("SELECT id_user, email, role, status_user FROM users ORDER BY id_user ASC");
  res.json(users.rows);
};

// Admin: Lihat user tertentu
exports.getUserById = async (req, res) => {
  const { id_user } = req.params;

  const user = await db.query("SELECT * FROM users WHERE id_user = $1", [id_user]);

  if (user.rowCount === 0) return res.status(404).json({ message: "User tidak ditemukan" });

  res.json(user.rows[0]);
};

// Admin: Update user
exports.updateUser = async (req, res) => {
  const { id_user } = req.params;
  const { email, status_user } = req.body;

  await db.query(
    "UPDATE users SET email = $1, status_user = $2 WHERE id_user = $3",
    [email, status_user, id_user]
  );

  res.json({ message: "Data user berhasil diupdate" });
};

// Admin: Hapus user
exports.deleteUser = async (req, res) => {
  const { id_user } = req.params;

  await db.query("DELETE FROM users WHERE id_user = $1", [id_user]);

  res.json({ message: "User berhasil dihapus" });
};

// Admin: Update role
exports.updateRole = async (req, res) => {
  const { id_user } = req.params;
  const { role } = req.body;

  await db.query("UPDATE users SET role = $1 WHERE id_user = $2", [role, id_user]);

  res.json({ message: "Role user berhasil diupdate" });
};

// Pengajar / Santri: Profil miliknya sendiri
exports.myProfile = async (req, res) => {
  const user = await db.query(
    "SELECT id_user, email, role, status_user FROM users WHERE id_user = $1",
    [req.user.id_user]
  );

  res.json(user.rows[0]);
};
