const express = require("express");
const router = express.Router();

const {
  getAdminProfile,
  updateAdminProfile,
} = require("../controllers/admincontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// PAKAI verifyToken (fungsi auth kamu), bukan "auth"
router.get("/profile/:id_admin", verifyToken, onlyAdmin, getAdminProfile);
router.put("/profile/:id_admin", verifyToken, onlyAdmin, updateAdminProfile);

module.exports = router;
