const express = require("express");
const router = express.Router();

const { 
  login, 
  getMe,
  forgotPassword, 
  resetPassword 
} = require("../controllers/authcontrollers");

const { verifyToken } = require("../middleware/auth");

// LOGIN
router.post("/login", login);

// GET PROFILE (dashboard santri/admin/pengajar)
router.get("/me", verifyToken, getMe);

// LUPA PASSWORD → Kirim email reset
router.post("/forgot-password", forgotPassword);

// RESET PASSWORD → Ubah password baru
router.post("/reset-password", resetPassword);

module.exports = router;
