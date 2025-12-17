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
  getDetailKelasPengajar,
  kelasSantriMe
} = require("../controllers/kelascontrollers");

const {
  verifyToken,
  onlyAdmin,
  onlyPengajar,
  onlySantri
} = require("../middleware/auth");

// ================= PENGAJAR ====================
router.get("/pengajar/me", verifyToken, onlyPengajar, kelasPengajar);
router.get(
  "/pengajar/detail/:id_kelas",
  verifyToken,
  onlyPengajar,
  getDetailKelasPengajar
);

// ================= SANTRI ======================
router.get(
  "/santri/me",
  verifyToken,
  onlySantri,
  kelasSantriMe
);

// ================= ADMIN =======================
router.post("/", verifyToken, onlyAdmin, tambahKelas);
router.get("/", verifyToken, onlyAdmin, getAllKelas);
router.post("/:id_kelas/santri", verifyToken, onlyAdmin, tambahSantriKeKelas);
router.put("/pindah/:id_santri", verifyToken, onlyAdmin, pindahSantriKelas);

router.get("/detail/:id_kelas", verifyToken, onlyAdmin, getDetailKelas);
router.put("/edit/:id_kelas", verifyToken, onlyAdmin, updateKelas);
router.delete("/hapus/:id_kelas", verifyToken, onlyAdmin, deleteKelas);

module.exports = router;
