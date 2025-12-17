const pool = require("../config/db");

exports.getMyProfile = async (req, res) => {
  try {
    const { id_users, role } = req.users;

    let query = "";
    let params = [id_users];

    // ==========================
    // SANTRI
    // ==========================
    if (role === "santri") {
      query = `
        SELECT 
          s.id_santri,
          s.nis,
          s.nama,
          s.status,
          u.nama AS nama_user,
          u.role
        FROM santri s
        JOIN users u ON u.id_users = s.id_users
        WHERE s.id_users = $1
      `;
    }

    // ==========================
    // PENGAJAR
    // ==========================
    else if (role === "pengajar") {
      query = `
        SELECT p.*, u.nama, u.role
        FROM pengajar p
        JOIN users u ON u.id_users = p.id_users
        WHERE p.id_users = $1
      `;
    }

    // ==========================
    // ADMIN
    // ==========================
    else if (role === "admin") {
      query = `
        SELECT a.*, u.nama, u.role
        FROM admin a
        JOIN users u ON u.id_users = a.id_users
        WHERE a.id_users = $1
      `;
    }

    else {
      return res.status(400).json({ message: "Role tidak dikenali" });
    }

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Profil tidak ditemukan" });
    }

    const profile = result.rows[0];

    // 🔒 BLOKIR SANTRI NONAKTIF
    if (role === "santri" && profile.status !== "aktif") {
      return res.status(403).json({
        message: "Akun santri tidak aktif. Hubungi admin."
      });
    }

    res.json({
      success: true,
      role,
      profile
    });

  } catch (err) {
    console.error("ME API ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};
