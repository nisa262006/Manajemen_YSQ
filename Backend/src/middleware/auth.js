const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// ================= VERIFY TOKEN ==================
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token required" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1️⃣ Ambil user
    const userRes = await pool.query(
      `SELECT id_users, role, status_user FROM users WHERE id_users = $1`,
      [decoded.id_users]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    const user = userRes.rows[0];

    // 2️⃣ BLOK USER NONAKTIF (ADMIN / PENGAJAR)
    if (user.role !== "santri" && user.status_user !== "aktif") {
      return res.status(403).json({
        message: "Akun sudah dinonaktifkan"
      });
    }

    // 3️⃣ BLOK SANTRI NONAKTIF (CEK KE TABEL SANTRI)
    if (user.role === "santri") {
      const santriRes = await pool.query(
        `SELECT status FROM santri WHERE id_users = $1`,
        [user.id_users]
      );

      if (
        santriRes.rowCount === 0 ||
        santriRes.rows[0].status !== "aktif"
      ) {
        return res.status(403).json({
          message: "Akun santri tidak aktif"
        });
      }
    }

    // 4️⃣ Inject ke request
    req.users = {
      id_users: user.id_users,
      role: user.role
    };

    next();

  } catch (err) {
    console.error("JWT ERROR:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
};



// ================= ROLE GUARDS ==================
const onlyAdmin = (req, res, next) => {
  if (req.users.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

const onlySantri = (req, res, next) => {
  if (req.users.role !== "santri")
    return res.status(403).json({ message: "Santri only" });
  next();
};

const onlyPengajar = (req, res, next) => {
  if (req.users.role !== "pengajar")
    return res.status(403).json({ message: "Pengajar only" });
  next();
};

module.exports = {
  verifyToken,
  onlyAdmin,
  onlySantri,
  onlyPengajar
};
