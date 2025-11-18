const express = require("express");
const router = express.Router();

const {
  daftarPendaftar,
  getAllPendaftar,
  terimaPendaftar,
  tolakPendaftar,
  deletePendaftar
} = require("../controllers/registercontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// publik daftar
router.post("/daftar", daftarPendaftar);

// admin: lihat seluruh pendaftar
router.get("/", verifyToken, onlyAdmin, getAllPendaftar);

// admin: terima pendaftar
router.put("/terima/:id_pendaftar", verifyToken, onlyAdmin, terimaPendaftar);

// admin: tolak pendaftar
router.put("/tolak/:id_pendaftar", verifyToken, onlyAdmin, tolakPendaftar);

// admin: hapus data pendaftar
router.delete("/:id_pendaftar", verifyToken, onlyAdmin, deletePendaftar);

module.exports = router;
