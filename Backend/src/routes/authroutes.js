const express = require("express");
const router = express.Router();

const { login, getMe } = require("../controllers/authcontrollers");
const { verifyToken } = require("../middleware/auth");

// LOGIN
router.post("/login", login);

// GET PROFILE (dashboard santri/admin/pengajar)
router.get("/me", verifyToken, getMe);

module.exports = router;
