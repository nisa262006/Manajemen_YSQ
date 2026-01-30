const express = require("express");
const router = express.Router();

const {
  createBilling,
  getAllBilling,
  getBillingSantri,
  updateBilling,
  deleteBilling
} = require("../controllers/billingSantriControllers");

const {
  verifyToken,
  onlyAdmin,
  onlySantri
} = require("../middleware/auth");

// ADMIN
router.post("/", verifyToken, onlyAdmin, createBilling);
router.get("/all", verifyToken, onlyAdmin, getAllBilling);
router.put("/:id", verifyToken, onlyAdmin, updateBilling);
router.delete("/:id", verifyToken, onlyAdmin, deleteBilling);

// SANTRI
router.get("/me", verifyToken, onlySantri, getBillingSantri);

module.exports = router;
