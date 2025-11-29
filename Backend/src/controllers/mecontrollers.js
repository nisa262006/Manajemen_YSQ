const pool = require("../config/db");

exports.getMyProfile = async (req, res) => {
  try {
    const { id_users, role } = req.users;

    let query = "";
    let params = [id_users];

    if (role === "santri") {
      query = `
      SELECT 
        s.id_santri,
        s.nama_santri,
        s.nis,
        s.id_kelas,
        u.nama AS nama_user,
        u.role
      FROM santri s
      JOIN users u ON u.id_users = s.id_users
      WHERE s.id_users = $1
    `;

    }

    else if (role === "pengajar") {
      query = `
        SELECT p.*, u.nama, u.role
        FROM pengajar p
        JOIN users u ON u.id_users = p.id_users
        WHERE p.id_users = $1
      `;
    }

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

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data profil tidak ditemukan" });
    }

    res.json({
      success: true,
      role,
      profile: result.rows[0]
    });

  } catch (err) {
    console.error("ME API ERROR:", err);
    res.status(500).json({ message: "Gagal mengambil data user" });
  }
};
