const express = require("express");
const router = express.Router();

const {
  createRaporTahsin,
  createRaporTahfidz,
  inputSimakan,
  finalisasiTahfidz,
  getRaporPengajar,
  getPeriodePengajar,
  updateRaporTahsin,
  deleteRaporTahsin,
  deleteRaporTahfidz,
  getRekapLaporan,
  getRaporSantri
} = require("../controllers/raporcontrollers");


const {
  verifyToken,
  onlyPengajar,
  onlySantri
} = require("../middleware/auth");

/* ================= PENGAJAR ================= */
router.post("/tahsin", verifyToken, onlyPengajar, createRaporTahsin);
router.post("/tahfidz", verifyToken, onlyPengajar, createRaporTahfidz);
router.post("/tahfidz/simakan", verifyToken, onlyPengajar, inputSimakan);
router.post("/tahfidz/final", verifyToken, onlyPengajar, finalisasiTahfidz);
router.get("/pengajar/me", verifyToken, onlyPengajar, getRaporPengajar);
router.put("/tahsin/:id", verifyToken, onlyPengajar, updateRaporTahsin);
router.delete("/tahsin/:id", verifyToken, onlyPengajar, deleteRaporTahsin);
router.delete("/tahfidz/:id", verifyToken, onlyPengajar, deleteRaporTahfidz);
router.get("/laporan/rekap-pengajar", verifyToken, onlyPengajar, getRekapLaporan);
router.get(
  "/laporan/periode",
  verifyToken,
  onlyPengajar,
  getPeriodePengajar
);


/* ================= SANTRI ================= */
router.get("/santri/me", verifyToken, onlySantri, getRaporSantri);

module.exports = router;
