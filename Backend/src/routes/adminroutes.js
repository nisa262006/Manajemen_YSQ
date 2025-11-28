const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/adminController");
const auth = require("../middlewares/auth");

// Dashboard Admin
router.get("/dashboard", auth, adminCtrl.dashboard);

// Data detail
router.get("/santri", auth, adminCtrl.getSantri);
router.get("/pengajar", auth, adminCtrl.getPengajar);
router.get("/kelas", auth, adminCtrl.getKelas);

module.exports = router;
