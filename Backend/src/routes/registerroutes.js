const express = require("express");
const router = express.Router();

const {
  daftarPendaftar,
  getAllPendaftar,
  updateStatus,
  deletePendaftar
} = require("../controllers/registercontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// Publik: daftar
router.post("/daftar", daftarPendaftar);

// Admin: lihat semua
router.get("/", verifyToken, onlyAdmin, getAllPendaftar);

// Admin: update status (Diterima / Ditolak)
router.put("/status/:id_santri", verifyToken, onlyAdmin, updateStatus);

// Admin: hapus
router.delete("/:id_santri", verifyToken, onlyAdmin, deletePendaftar);

module.exports = router;
