const express = require("express");
const router = express.Router();

const { verifyToken, onlyPengajar, onlySantri, onlyAdmin } =
  require("../middleware/auth");

const ctrl = require("../controllers/nilaidanprogrescontrollers");

// ================= PENGAJAR =================
router.post("/progres", verifyToken, onlyPengajar, ctrl.createProgres);
router.put("/progres/:id", verifyToken, onlyPengajar, ctrl.updateProgres);
router.delete("/progres/:id", verifyToken, onlyPengajar, ctrl.deleteProgres);

router.get("/rekap/kelas/:id_kelas", verifyToken, onlyPengajar, ctrl.rekapKelas);

// ================= SANTRI =================
router.get("/saya", verifyToken, onlySantri, ctrl.getProgresSantri);

// ================= ADMIN =================
router.get("/laporan", verifyToken, onlyAdmin, ctrl.getLaporanAdmin);

module.exports = router;
