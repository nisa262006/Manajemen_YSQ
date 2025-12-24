const express = require("express");
const router = express.Router();

// Perubahan: Impor seluruh controller sebagai satu objek
const adminController = require("../controllers/admincontrollers");
const { verifyToken, onlyAdmin } = require("../middleware/auth");

// Route untuk statistik di Admin.html
router.get("/stats", verifyToken, onlyAdmin, adminController.getDashboardStats);

// Route profil admin
router.get("/profile/:id_admin", verifyToken, onlyAdmin, adminController.getAdminProfile);
router.put("/profile/:id_admin", verifyToken, onlyAdmin, adminController.updateAdminProfile);


// Tambahkan baris ini di adminroutes.js
router.post("/announcement", verifyToken, adminController.createAnnouncement);
router.get("/announcement", verifyToken, adminController.getAllAnnouncements);


module.exports = router;