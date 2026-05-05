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

// Update
router.put("/:id_jadwal", verifyToken, onlyAdmin, updateJadwal);

// Delete
router.delete("/:id_jadwal", verifyToken, onlyAdmin, deleteJadwal);


// ===================== PENGAJAR =============================

// Jadwal kelas yang dia ampu
router.get("/pengajar/me", verifyToken, onlyPengajar, jadwalPengajar);


// ===================== SANTRI =============================

// Jadwal kelas santri sendiri
router.get("/santri/me", verifyToken, onlySantri, jadwalSantri);

module.exports = router;
