const express = require("express");
const router = express.Router();

const {
  // ABSENSI SANTRI
  catatAbsensiSantri,
  updateAbsensiSantri,
  getAbsensiSantri,
  getAllAbsensiSantri,
  getAbsensiKelasPengajar,

  // ABSENSI PENGAJAR
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

// ============================================================
//                         ADMIN
// ============================================================

router.get("/santri/all", verifyToken, onlyAdmin, getAllAbsensiSantri);
router.get("/pengajar/all", verifyToken, onlyAdmin, getAllAbsensiPengajar);


// ============================================================
//                         PENGAJAR
// ============================================================

// --- Absensi Santri ---
router.post("/santri", verifyToken, onlyPengajar, catatAbsensiSantri);

// ❗ sinkron dengan controller:   req.params.id_absensi
router.put("/santri/:id_absensi", verifyToken, onlyPengajar, updateAbsensiSantri);

// Pengajar melihat absensi santri di kelasnya sendiri
router.get("/santri/kelas/me", verifyToken, onlyPengajar, getAbsensiKelasPengajar);


// --- Absensi Pengajar (diri sendiri) ---
router.post("/pengajar", verifyToken, onlyPengajar, catatAbsensiPengajar);
router.get("/pengajar/me", verifyToken, onlyPengajar, getAbsensiPengajar);


// ============================================================
//                         SANTRI
// ============================================================

// Santri melihat daftar kehadiran dirinya
router.get("/santri/me", verifyToken, onlySantri, getAbsensiSantri);


module.exports = router;
