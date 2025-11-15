const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const allow = require("../middleware/role");
const { tambahKelas, getKelas, updateKelas, hapusKelas, penempatanSantri } = require("../controllers/kelascontrollers");

router.post("/", auth, allow(['admin','staf']), tambahKelas);
router.get("/", auth, allow(['admin','staf','pengajar']), getKelas);
router.put("/:id", auth, allow(['admin','staf']), updateKelas);
router.delete("/:id", auth, allow(['admin','staf']), hapusKelas);

router.post("/penempatan", auth, allow(['admin','staf']), penempatanSantri);

module.exports = router;
