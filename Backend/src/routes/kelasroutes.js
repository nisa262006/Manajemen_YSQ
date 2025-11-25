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

// PERBAIKI BAGIAN INI ↓↓↓
const {
  verifyToken,
  onlyAdmin,
  onlyPengajar,
  onlySantri
} = require("../middleware/auth");
// PERBAIKAN ↑↑↑


// ================= PENGAJAR ====================
router.get("/pengajar/me", verifyToken, onlyPengajar, kelasPengajar);

// ================= SANTRI ======================
router.get("/santri/me", verifyToken, onlySantri, kelasSantri);

// ================= ADMIN ======================= 
router.post("/", verifyToken, onlyAdmin, tambahKelas);
router.get("/", verifyToken, onlyAdmin, getAllKelas);
router.post("/:id_kelas/santri", verifyToken, onlyAdmin, tambahSantriKeKelas);
router.put("/pindah/:id_santri", verifyToken, onlyAdmin, pindahSantriKelas);

// ROUTE DINAMIS PALING BAWAH (HARUS TERAKHIR)
router.get("/detail/:id_kelas", verifyToken, onlyAdmin, getDetailKelas);
router.put("/edit/:id_kelas", verifyToken, onlyAdmin, updateKelas);
router.delete("/hapus/:id_kelas", verifyToken, onlyAdmin, deleteKelas);

module.exports = router;
