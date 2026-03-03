const express = require("express");
const router = express.Router();
const { verifyToken, onlyPengajar, onlySantri } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/tugasmateriajarcontrollers");

// --- MATERI ---
router.post("/materi", verifyToken, onlyPengajar, upload.single("file"), ctrl.uploadMateri);
router.get("/materi/jadwal/:id_jadwal/pengajar",
  verifyToken,
  onlyPengajar,
  ctrl.getMateriByJadwalPengajar
);

// Perbaikan PUT Materi (Tambahkan upload.single jika ingin bisa ganti file saat edit)
router.put("/materi/:id", verifyToken, onlyPengajar, upload.single("file"), ctrl.updateMateri);

// --- TUGAS ---
router.post("/tugas", verifyToken, onlyPengajar, upload.single("file"), ctrl.createTugas); // Gunakan upload jika tugas juga pakai file
router.get("/tugas/kelas/:id/pengajar", verifyToken, onlyPengajar, ctrl.getTugasByKelasPengajar);
// Ganti baris ini di tugasmateriajarroutes.js
router.put("/tugas/:id", verifyToken, onlyPengajar, upload.single("file"), ctrl.updateTugas);
router.get("/tugas/:id/status", verifyToken, onlyPengajar, ctrl.getStatusPengumpulan);
router.get(
  "/tugas/materi/:id",
  verifyToken,
  onlyPengajar,
  ctrl.getTugasByMateri
);

// --- SANTRI ---
router.get(
  "/materi/jadwal/:id_jadwal",
  verifyToken,
  onlySantri,
  ctrl.getMateriByJadwalForSantri
);

router.get("/tugas/kelas/:id", verifyToken, onlySantri, ctrl.getTugasByKelas);
router.post(
  "/tugas/submit",
  verifyToken,
  onlySantri,
  upload.single("file"),
  ctrl.submitTugasSantri
);

router.get(
  "/tugas/:id_tugas/submission/me",
  verifyToken,
  onlySantri,
  ctrl.getMySubmission
);

router.get(
  "/materi/jadwal/:id_jadwal",
  verifyToken,
  onlySantri,
  ctrl.getMateriByJadwal
);

module.exports = router;