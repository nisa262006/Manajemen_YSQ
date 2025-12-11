const jwt = require("jsonwebtoken");

// ================= VERIFY TOKEN ==================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "Token required" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id_users || !decoded.role) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    if (decoded.status_users && decoded.status_users.toLowerCase() !== "aktif") {
      return res.status(403).json({ message: "Akun tidak aktif / diblokir" });
    }

    req.users = decoded;
    next();

  } catch (err) {
    console.error("JWT ERROR:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
};

// ================= ADMIN ONLY ==================
const onlyAdmin = (req, res, next) => {
  if (req.users.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

// ================= SANTRI ONLY ==================
const onlySantri = (req, res, next) => {
  if (req.users.role !== "santri") {
    return res.status(403).json({ message: "Santri only" });
  }
  next();
};

// ================= PENGAJAR ONLY ==================
const onlyPengajar = (req, res, next) => {
  if (req.users.role !== "pengajar") {
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
