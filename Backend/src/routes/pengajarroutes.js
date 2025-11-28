const express = require("express");
const router = express.Router();
const pengajarCtrl = require("../controllers/pengajarController");
const auth = require("../middlewares/auth");

router.get("/me", auth, pengajarCtrl.me);
router.get("/dashboard", auth, pengajarCtrl.dashboard);
router.get("/kelas", auth, pengajarCtrl.getKelas);
router.get("/santri", auth, pengajarCtrl.getSantriByKelas);

module.exports = router;
