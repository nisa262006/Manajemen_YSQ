const express = require("express");
const router = express.Router();

const {
  tambahJadwal,
  getAllJadwal,
  getJadwalById,
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
router.post("/", verifyToken, onlyAdmin, tambahJadwal);
router.get("/", verifyToken, onlyAdmin, getAllJadwal);

// ===================== PENGAJAR =============================
router.get("/pengajar/me", verifyToken, onlyPengajar, jadwalPengajar);

// ===================== SANTRI =============================
router.get("/santri/me", verifyToken, onlySantri, jadwalSantri);

// ===================== DYNAMIC ROUTES (HARUS PALING BAWAH) ============================
router.get("/:id_jadwal", verifyToken, onlyAdmin, getJadwalById);
router.put("/:id_jadwal", verifyToken, onlyAdmin, updateJadwal);
router.delete("/:id_jadwal", verifyToken, onlyAdmin, deleteJadwal);

module.exports = router;
