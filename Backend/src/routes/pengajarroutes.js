const express = require("express");
const router = express.Router();

const {
  tambahPengajar,
  getAllPengajar,
  getPengajarById,
  updatePengajar,
  deletePengajar
} = require("../controllers/pengajarcontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// Tambah Pengajar
router.post("/tambah", verifyToken, onlyAdmin, tambahPengajar);

// List Semua Pengajar
router.get("/", verifyToken, onlyAdmin, getAllPengajar);

// Detail Pengajar by ID
router.get("/:id_pengajar", verifyToken, onlyAdmin, getPengajarById);

// Update Pengajar
router.put("/:id_pengajar", verifyToken, onlyAdmin, updatePengajar);

// Delete Pengajar
router.delete("/:id_pengajar", verifyToken, onlyAdmin, deletePengajar);

module.exports = router;
