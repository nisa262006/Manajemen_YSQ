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

// GET all santri
router.get("/", verifyToken, onlyAdmin, getAllSantri);

// GET santri by ID
router.get("/:id_santri", verifyToken, onlyAdmin, getSantriById);

// UPDATE santri
router.put("/:id_santri", verifyToken, onlyAdmin, updateSantri);

// DELETE santri
router.delete("/:id_santri", verifyToken, onlyAdmin, deleteSantri);

// Export Excel
router.get("/export/excel", verifyToken, onlyAdmin, exportSantriExcel);

module.exports = router;
