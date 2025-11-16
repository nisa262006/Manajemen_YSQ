const express = require("express");
const router = express.Router();

const {
  tambahKelas,
  getAllKelas,
  getDetailKelas,
  updateKelas,
  deleteKelas,
  tambahSantriKeKelas,
  pindahSantriKelas,
  kelasPengajar,
  kelasSantri
} = require("../controllers/kelascontrollers");

const {
  verifyToken,
  onlyAdmin,
  onlyPengajar,
  onlySantri
} = require("../middleware/auth");

// ======================== ADMIN ============================

// Tambah kelas
router.post("/", verifyToken, onlyAdmin, tambahKelas);

// List semua kelas
router.get("/", verifyToken, onlyAdmin, getAllKelas);

// Detail kelas
router.get("/:id_kelas", verifyToken, onlyAdmin, getDetailKelas);

// Update kelas
router.put("/:id_kelas", verifyToken, onlyAdmin, updateKelas);

// Delete kelas
router.delete("/:id_kelas", verifyToken, onlyAdmin, deleteKelas);

// Tambah santri ke kelas
router.post("/:id_kelas/santri", verifyToken, onlyAdmin, tambahSantriKeKelas);

// Pindahkan santri antar kelas
router.put("/pindah/:id_santri", verifyToken, onlyAdmin, pindahSantriKelas);


// ==================== PENGAJAR ===============================

// Melihat kelas yang dia ampu
router.get("/pengajar/me", verifyToken, onlyPengajar, kelasPengajar);


// ===================== SANTRI ===============================

// Santri lihat kelas miliknya
router.get("/santri/me", verifyToken, onlySantri, kelasSantri);

module.exports = router;
