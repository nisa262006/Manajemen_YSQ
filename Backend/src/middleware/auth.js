const jwt = require("jsonwebtoken");

// ================= VERIFY TOKEN ==================
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "Token required" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.users = decoded; 
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// ================= ADMIN ONLY ==================
exports.onlyAdmin = (req, res, next) => {
  if (req.users.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

// ================= SANTRI ONLY ==================
exports.onlySantri = (req, res, next) => {
  if (req.users.role !== "santri") {
    return res.status(403).json({ message: "Santri only" });
  }
  next();
};

// ================= PENGAJAR ONLY ==================
exports.onlyPengajar = (req, res, next) => {
  if (req.users.role !== "pengajar") {
    return res.status(403).json({ message: "Pengajar only" });
  }
  next();
};
