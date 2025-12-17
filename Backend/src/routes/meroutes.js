const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");

router.get("/", auth.verifyToken, async (req, res) => {
  try {
    const { id_users, role } = req.users;

    // ================= USER BASE =================
    const baseUser = await pool.query(
      `SELECT id_users, email, username, role, status_user
       FROM users
       WHERE id_users = $1`,
      [id_users]
    );

    if (baseUser.rowCount === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const profile = baseUser.rows[0];
    let roleData = {};

    // ================= SANTRI =================
    if (role === "santri") {
      const q = await pool.query(
        `SELECT 
          id_santri,
          nis,
          nama,
          kategori,
          no_wa,
          email,
          tempat_lahir,
          tanggal_lahir,
          status
         FROM santri
         WHERE id_users = $1`,
        [id_users]
      );

      if (q.rowCount === 0) {
        return res.status(404).json({ message: "Data santri tidak ditemukan" });
      }

      // 🔒 BLOKIR SANTRI NONAKTIF
      if (q.rows[0].status !== "aktif") {
        return res.status(403).json({
          message: "Akun santri tidak aktif"
        });
      }

      roleData = q.rows[0];
    }

    // ================= PENGAJAR =================
    else if (role === "pengajar") {
      const q = await pool.query(
        `SELECT id_pengajar, nama, no_kontak, alamat, status
         FROM pengajar
         WHERE id_users = $1`,
        [id_users]
      );
      roleData = q.rows[0] ?? {};
    }

    // ================= ADMIN =================
    else if (role === "admin") {
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
        ...roleData
      }
    });

  } catch (err) {
    console.error("ERROR /me:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
