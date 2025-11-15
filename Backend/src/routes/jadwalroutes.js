const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const allow = require("../middleware/role");
const { tambahJadwal, getJadwalByKelas, updateJadwal, deleteJadwal } = require("../controllers/jadwalcontrollers");

router.post("/", auth, allow(['admin','staf']), tambahJadwal);
router.get("/kelas/:id_kelas", auth, allow(['admin','staf','pengajar','santri']), getJadwalByKelas);
router.put("/:id", auth, allow(['admin','staf']), updateJadwal);
router.delete("/:id", auth, allow(['admin','staf']), deleteJadwal);

module.exports = router;
