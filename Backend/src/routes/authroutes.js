const express = require("express");
const router = express.Router();

// Import controller
const { login } = require("../controllers/authcontrollers");

// Route login
router.post("/login", login);

module.exports = router;
