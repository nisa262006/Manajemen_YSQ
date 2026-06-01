const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const { getMyProfile } = require("../controllers/mecontrollers");

// GET /api/me → Ambil profil user yang sedang login (Santri/Pengajar/Admin)
router.get("/", verifyToken, getMyProfile);

module.exports = router;
