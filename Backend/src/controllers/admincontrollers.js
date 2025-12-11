const db = require("../config/db");

// =======================================
// GET ADMIN PROFILE
// =======================================
exports.getAdminProfile = async (req, res) => {
    try {
      const id_admin = req.params.id_admin;
  
      const result = await db.query(
        `SELECT 
            a.id_admin,
            a.nama,
            a.email,
            a.no_wa,
            a.foto,
            u.id_users,
            u.role
          FROM admin a
          LEFT JOIN users u ON a.id_users = u.id_users
          WHERE a.id_admin = $1`,
        [id_admin]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Data admin tidak ditemukan" });
      }
  
      res.json({
        message: "Profil admin ditemukan",
        data: result.rows[0]
      });
  
    } catch (err) {
      console.error("GET ADMIN PROFILE ERROR:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  };
  
// =======================================
// UPDATE ADMIN PROFILE
// =======================================
exports.updateAdminProfile = async (req, res) => {
    try {
      const id_admin = req.params.id_admin;
      const { nama, email, no_wa, foto } = req.body;
  
      // cek data admin
      const oldData = await db.query(
        `SELECT * FROM admin WHERE id_admin = $1`,
        [id_admin]
      );
  
      if (oldData.rowCount === 0) {
        return res.status(404).json({ message: "Data admin tidak ditemukan" });
      }
  
      const old = oldData.rows[0];
  
      // Update
      await db.query(
        `UPDATE admin SET
            nama = $1,
            email = $2,
            no_wa = $3,
            foto = $4
          WHERE id_admin = $5`,
        [
          nama || old.nama,
          email || old.email,
          no_wa || old.no_wa,
          foto || old.foto,
          id_admin
        ]
      );
  
      res.json({
        message: "Profil admin berhasil diperbarui",
        data: {
          id_admin,
          nama: nama || old.nama,
          email: email || old.email,
          no_wa: no_wa || old.no_wa,
          foto: foto || old.foto
        }
      });
  
    } catch (err) {
      console.error("UPDATE ADMIN PROFILE ERROR:", err);
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  };
  