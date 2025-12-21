const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userRes = await pool.query(
      `SELECT id_users, role, status_user 
       FROM users 
       WHERE id_users = $1`,
      [decoded.id_users]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = userRes.rows[0];

    if (user.role !== "santri" && user.status_user !== "aktif") {
      return res.status(403).json({ message: "Account inactive" });
    }

    if (user.role === "santri") {
      const santriRes = await pool.query(
        `SELECT status FROM santri WHERE id_users = $1`,
        [user.id_users]
      );

      if (
        santriRes.rowCount === 0 ||
        santriRes.rows[0].status !== "aktif"
      ) {
        return res.status(403).json({ message: "Santri inactive" });
      }
    }

    req.user = {
      id_users: user.id_users,
      role: user.role
    };

    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const onlyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

const onlySantri = (req, res, next) => {
  if (req.user.role !== "santri") {
    return res.status(403).json({ message: "Santri only" });
  }
  next();
};

const onlyPengajar = (req, res, next) => {
  if (req.user.role !== "pengajar") {
    return res.status(403).json({ message: "Pengajar only" });
  }
  next();
};

module.exports = {
  verifyToken,
  onlyAdmin,
  onlySantri,
  onlyPengajar
};
