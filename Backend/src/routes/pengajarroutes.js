const express = require("express");
const router = express.Router();

const {
  tambahPengajar,
  getAllPengajar,
  getPengajarById
} = require("../controllers/pengajarcontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// Tambah Pengajar
router.post("/tambah", verifyToken, onlyAdmin, tambahPengajar);

// List Pengajar
router.get("/", verifyToken, onlyAdmin, getAllPengajar);

// Detail Pengajar
router.get("/:id_pengajar", verifyToken, onlyAdmin, getPengajarById);

module.exports = router;
