const express = require("express");
const router = express.Router();

const { verifyToken, onlyPengajar, onlySantri } = require("../middleware/auth");
const ctrl = require("../controllers/tugasmediaajarcontrollers");

// ================== PENGAJAR ==================
router.post("/tugas", verifyToken, onlyPengajar, ctrl.createTugas);
router.get("/tugas/pengajar", verifyToken, onlyPengajar, ctrl.getTugasPengajar);
router.put("/tugas/:id", verifyToken, onlyPengajar, ctrl.updateTugas);
router.delete("/tugas/:id", verifyToken, onlyPengajar, ctrl.deleteTugas);

// monitoring
router.get("/tugas/:id/monitoring", verifyToken, onlyPengajar, ctrl.monitoringTugas);

// media ajar
router.post("/media", verifyToken, onlyPengajar, ctrl.createMedia);
router.get("/media/pengajar", verifyToken, onlyPengajar, ctrl.getMediaPengajar);
router.delete("/media/:id", verifyToken, onlyPengajar, ctrl.deleteMedia);

// ================== SANTRI ==================
router.get("/tugas/saya", verifyToken, onlySantri, ctrl.getTugasSantri);
router.post("/tugas/kumpul", verifyToken, onlySantri, ctrl.submitTugas);
router.get("/media/saya", verifyToken, onlySantri, ctrl.getMediaSantri);

module.exports = router;
