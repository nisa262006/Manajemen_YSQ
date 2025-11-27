const express = require("express");
const router = express.Router();

const {
  tambahJadwal,
  getAllJadwal,
  updateJadwal,
  deleteJadwal,
  jadwalPengajar,
  jadwalSantri
} = require("../controllers/jadwalcontrollers");

const {
  verifyToken,
  onlyAdmin,
  onlyPengajar,
  onlySantri
} = require("../middleware/auth");


// ===================== ADMIN =============================

// Tambah jadwal
router.post("/", verifyToken, onlyAdmin, tambahJadwal);

// List semua jadwal
router.get("/", verifyToken, onlyAdmin, getAllJadwal);


// ===================== PENGAJAR =============================

router.get("/pengajar/me", verifyToken, onlyPengajar, jadwalPengajar);


// ===================== SANTRI =============================

router.get("/santri/me", verifyToken, onlySantri, jadwalSantri);


// ===================== ROUTE DINAMIS (HARUS PALING BAWAH) =====================

// Update jadwal
router.put("/:id_jadwal", verifyToken, onlyAdmin, updateJadwal);

// Delete jadwal
router.delete("/:id_jadwal", verifyToken, onlyAdmin, deleteJadwal);


module.exports = router;
