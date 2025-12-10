const express = require("express");
const router = express.Router();

const {
  getAllSantri,
  getSantriById,
  updateSantri,
  deleteSantri,
  exportSantriExcel
} = require("../controllers/santricontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");


// =========================
// URUTAN HARUS BENAR
// =========================

// Export Excel → TARUH DI ATAS
router.get("/export/excel", verifyToken, onlyAdmin, exportSantriExcel);

// Semua santri
router.get("/", verifyToken, onlyAdmin, getAllSantri);

// Detail santri
router.get("/:id_santri", verifyToken, onlyAdmin, getSantriById);

// Update
router.put("/:id_santri", verifyToken, onlyAdmin, updateSantri);

// Delete
router.delete("/:id_santri", verifyToken, onlyAdmin, deleteSantri);


module.exports = router;
