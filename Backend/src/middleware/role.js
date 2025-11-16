const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth)
    return res.status(401).json({ message: "Token tidak ditemukan" });

  const token = auth.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // {id_user, role}
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

exports.onlyAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Akses khusus admin" });
  next();
};

exports.onlyPengajar = (req, res, next) => {
  if (req.user.role !== "pengajar")
    return res.status(403).json({ message: "Akses khusus pengajar" });
  next();
};

exports.onlySantri = (req, res, next) => {
  if (req.user.role !== "santri")
    return res.status(403).json({ message: "Akses khusus santri" });
  next();
};
