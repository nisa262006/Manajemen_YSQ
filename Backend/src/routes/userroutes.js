const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateRole,
  myProfile
} = require("../controllers/usercontrollers");

const { verifyToken, onlyAdmin } = require("../middleware/auth");

// Admin: Melihat semua user
router.get("/", verifyToken, onlyAdmin, getAllUsers);

// Admin: Melihat user tertentu
router.get("/:id_user", verifyToken, onlyAdmin, getUserById);

// Admin: Update user
router.put("/:id_user", verifyToken, onlyAdmin, updateUser);

// Admin: Hapus user
router.delete("/:id_user", verifyToken, onlyAdmin, deleteUser);

// Admin: Update role
router.put("/role/:id_user", verifyToken, onlyAdmin, updateRole);

// Pengajar/Santri: Profile dirinya sendiri
router.get("/me/profile", verifyToken, myProfile);

module.exports = router;
