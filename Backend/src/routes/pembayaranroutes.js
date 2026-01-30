const express = require("express");
const router = express.Router();

const {
  createPembayaran,
  getPembayaranSantri,
  getAllPembayaran,
  verifikasiPembayaran
} = require("../controllers/pembayaranControllers");

const {
  verifyToken,
  onlySantri,
  onlyAdmin
} = require("../middleware/auth");

// ===================================================
// SANTRI
// ===================================================

// Santri melakukan pembayaran
router.post("/", verifyToken, onlySantri, createPembayaran);

// Santri melihat pembayaran miliknya
router.get("/me", verifyToken, onlySantri, getPembayaranSantri);

// ===================================================
// ADMIN
// ===================================================

// Admin melihat semua pembayaran
router.get("/all", verifyToken, onlyAdmin, getAllPembayaran);

// Admin verifikasi pembayaran
router.put("/:id/verifikasi", verifyToken, onlyAdmin, verifikasiPembayaran);

module.exports = router;
