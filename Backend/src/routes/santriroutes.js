const express = require("express");
const router = express.Router();

const {
  getAllSantri,
  getSantriById,
  updateSantri,
  graduateSantri
} = require("../controllers/santriController");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// List Santri
router.get("/", verifyToken, onlyAdmin, getAllSantri);

// Detail Santri
router.get("/:id_santri", verifyToken, onlyAdmin, getSantriById);

// Update Santri
router.put("/:id_santri", verifyToken, onlyAdmin, updateSantri);

// Luluskan santri
router.put("/:id_santri/lulus", verifyToken, onlyAdmin, graduateSantri);

// export exsel
router.get("/export/excel", verifyToken, onlyAdmin, exportSantriExcel);

module.exports = router;
