const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");        // auth adalah FUNCTION
const allow = require("../middleware/role");       // allow adalah FUNCTION RETURNER

const {
  registerSantri,
  verifikasiSantri,
  getSantriList
} = require("../controllers/santricontrollers");

router.post("/register", registerSantri);

router.get("/", auth, allow('admin','staf'), getSantriList);

router.put("/verifikasi/:id", auth, allow('admin','staf'), verifikasiSantri);

module.exports = router;
