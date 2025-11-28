const express = require("express");
const router = express.Router();

const { verifyToken, onlySantri } = require("../middleware/auth");
const { getDashboardSantri } = require("../controllers/santridashboardcontrollers");

// Dashboard Santri Lengkap
router.get("/me", verifyToken, onlySantri, getDashboardSantri);

module.exports = router;
