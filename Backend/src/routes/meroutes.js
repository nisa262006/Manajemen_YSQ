const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");

router.get("/", auth.verifyToken, async (req, res) => {
  try {
    const { id_users, role } = req.users;

    // Ambil data dasar user
    const baseUser = await pool.query(
      `SELECT id_users, email, username, role, status_user
       FROM users
       WHERE id_users = $1`,
      [id_users]
    );

    if (baseUser.rowCount === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    const profile = baseUser.rows[0];
    let roleData = {};

    if (role === "pengajar") {
      const q = await pool.query(
        `SELECT id_pengajar, nama, no_kontak, alamat, status
         FROM pengajar
         WHERE id_users = $1`,
        [id_users]
      );
      roleData = q.rows[0] ?? {};
    } else if (role === "santri") {
      const q = await pool.query(
        `SELECT id_santri, nis, nama, kategori, no_wa, email, tempat_lahir, tanggal_lahir
         FROM santri
         WHERE id_users = $1`,
        [id_users]
      );
      roleData = q.rows[0] ?? {};
    } else if (role === "admin") {
      const q = await pool.query(
        `SELECT id_admin, nama
         FROM admin
         WHERE id_users = $1`,
        [id_users]
      );
      roleData = q.rows[0] ?? {};
    }

    res.json({
      success: true,
      role,
      profile: {
        ...profile,
        ...roleData,
      },
    });
  } catch (err) {
    console.error("ERROR /api/me:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
