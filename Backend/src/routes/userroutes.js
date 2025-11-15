const express = require("express");
const router = express.Router();

const { registerSantri } = require("../controllers/usercontrollers");

router.post("/register", registerSantri);

module.exports = router;
