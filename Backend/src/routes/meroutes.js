const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const pool = require("../config/db");

// GET /api/me → ambil profile user sesuai role
router.get("/", auth.verifyToken, async (req, res) => {
  try {
    const { id_users, role } = req.users;

    let query;
    if (role === "admin") {
      query = `SELECT * FROM admin WHERE id_users = $1`;
    } else if (role === "pengajar") {
      query = `SELECT * FROM pengajar WHERE id_users = $1`;
    } else if (role === "santri") {
      query = `SELECT * FROM santri WHERE id_users = $1`;
    } else {
      return res.status(400).json({ message: "Role tidak dikenal" });
    }

    const userData = await pool.query(query, [id_users]);

    if (userData.rows.length === 0) {
      return res.status(404).json({ message: "Data user tidak ditemukan" });
    }

    res.json({
      success: true,
      role,
      profile: userData.rows[0],
    });

  } catch (err) {
    console.error("ERROR /api/me:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
