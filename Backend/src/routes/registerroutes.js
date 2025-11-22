const express = require("express");
const router = express.Router();

const {
  daftarPendaftar,
  getAllPendaftar,
  terimaPendaftar,
  tolakPendaftar,
  deletePendaftar,
  resetAllPendaftar,
  exportExcelPendaftar
} = require("../controllers/registercontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// PUBLIC
router.post("/daftar", daftarPendaftar);

// ADMIN – STATIC ROUTES (WAJIB DI ATAS ROUTE DINAMIS)
router.delete("/reset/all", verifyToken, onlyAdmin, resetAllPendaftar);
router.get("/export/excel", verifyToken, onlyAdmin, exportExcelPendaftar);

// ADMIN – GET ALL
router.get("/", verifyToken, onlyAdmin, getAllPendaftar);

// ADMIN – ACTION
router.put("/terima/:id_pendaftar", verifyToken, onlyAdmin, terimaPendaftar);
router.put("/tolak/:id_pendaftar", verifyToken, onlyAdmin, tolakPendaftar);

// ADMIN – HAPUS SATU
router.delete("/:id_pendaftar", verifyToken, onlyAdmin, deletePendaftar);

module.exports = router;
