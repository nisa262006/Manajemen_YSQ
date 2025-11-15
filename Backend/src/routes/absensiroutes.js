const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const allow = require("../middleware/role");
const { absenSantri, getAbsensiBySantri } = require("../controllers/absensicontrollers");

// Pengajar atau staff mencatat absensi
router.post("/", auth, allow(['pengajar','staf']), absenSantri);

// Lihat absensi per santri (admin/staf/pengajar)
router.get("/santri/:id_santri", auth, allow(['admin','staf','pengajar','santri']), getAbsensiBySantri);

module.exports = router;
