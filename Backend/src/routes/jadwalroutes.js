const express = require("express");
const router = express.Router();

const {
  tambahJadwal,
  getAllJadwal,
  getJadwalById,
  updateJadwal,
  deleteJadwal,
  jadwalPengajar,
  jadwalSantri,
  getJadwalByPengajar,
  jadwalPengajarByHari,
  tambahSantriKeJadwal,
  getSantriByJadwal
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

router.get("/pengajar-sesi/:id_pengajar", verifyToken, onlyAdmin, getJadwalByPengajar);
router.post(
  "/:id_jadwal/santri",
  verifyToken,
  onlyAdmin,
  tambahSantriKeJadwal
);

// ===================== PENGAJAR =============================
router.get("/pengajar/me", verifyToken, onlyPengajar, jadwalPengajar);
router.get(
  "/pengajar/me/hari/:hari",
  verifyToken,
  onlyPengajar,
  jadwalPengajarByHari
);

// ===================== SANTRI =============================
router.get("/santri/me", verifyToken, onlySantri, jadwalSantri);

// ===================== DYNAMIC ROUTES (HARUS PALING BAWAH) ============================
router.get("/:id_jadwal", verifyToken, onlyAdmin, getJadwalById);
router.put("/:id_jadwal", verifyToken, onlyAdmin, updateJadwal);
router.delete("/:id_jadwal", verifyToken, onlyAdmin, deleteJadwal);

router.get(
  "/:id_jadwal/santri",
  verifyToken,
  onlyPengajar,
  getSantriByJadwal
);

module.exports = router;
