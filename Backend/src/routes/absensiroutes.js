const express = require("express");
const router = express.Router();

const {
  catatAbsensiSantri,
  updateAbsensiSantri,
  getAbsensiKelasPengajar,
  getAbsensiSantri,
  getAllAbsensiSantri,

  catatAbsensiPengajar,
  getAbsensiPengajar,
  getAllAbsensiPengajar
} = require("../controllers/absensicontrollers");

const {
  verifyToken,
  onlyAdmin,
  onlyPengajar,
  onlySantri
} = require("../middleware/auth");

// ===================== ADMIN =============================
router.get("/santri/all", verifyToken, onlyAdmin, getAllAbsensiSantri);
router.get("/pengajar/all", verifyToken, onlyAdmin, getAllAbsensiPengajar);

// ===================== PENGAJAR =============================

// ABSENSI SANTRI
router.post("/santri", verifyToken, onlyPengajar, catatAbsensiSantri);
router.put("/santri/:id_presensi", verifyToken, onlyPengajar, updateAbsensiSantri);
router.get("/santri/kelas/me", verifyToken, onlyPengajar, getAbsensiKelasPengajar);

// ABSENSI PENGAJAR (DIRINYA SENDIRI)
router.post("/pengajar", verifyToken, onlyPengajar, catatAbsensiPengajar);
router.get("/pengajar/me", verifyToken, onlyPengajar, getAbsensiPengajar);

// ===================== SANTRI =============================
router.get("/santri/me", verifyToken, onlySantri, getAbsensiSantri);

module.exports = router;
