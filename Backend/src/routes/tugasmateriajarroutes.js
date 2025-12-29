const express = require("express");
const router = express.Router();
const { verifyToken, onlyPengajar, onlySantri } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/tugasmateriajarcontrollers");

// --- MATERI ---
router.post("/materi", verifyToken, onlyPengajar, upload.single("file"), ctrl.uploadMateri);
router.get("/materi/kelas/:id/pengajar", verifyToken, onlyPengajar, ctrl.getMateriByKelasPengajar);

// Perbaikan PUT Materi (Tambahkan upload.single jika ingin bisa ganti file saat edit)
router.put("/materi/:id", verifyToken, onlyPengajar, upload.single("file"), ctrl.updateMateri);

// --- TUGAS ---
router.post("/tugas", verifyToken, onlyPengajar, upload.single("file"), ctrl.createTugas); // Gunakan upload jika tugas juga pakai file
router.get("/tugas/kelas/:id/pengajar", verifyToken, onlyPengajar, ctrl.getTugasByKelasPengajar);
router.put("/tugas/:id", verifyToken, onlyPengajar, ctrl.updateTugas);
router.get("/tugas/:id/status", verifyToken, onlyPengajar, ctrl.getStatusPengumpulan);
router.get(
  "/tugas/materi/:id",
  verifyToken,
  onlyPengajar,
  ctrl.getTugasByMateri
);


// --- SANTRI ---
router.get("/materi/kelas/:id", verifyToken, onlySantri, ctrl.getMateriByKelas);
router.get("/tugas/kelas/:id", verifyToken, onlySantri, ctrl.getTugasByKelas);
router.post("/tugas/:id/submit", verifyToken, onlySantri, upload.single("file"), ctrl.submitTugas);

module.exports = router;