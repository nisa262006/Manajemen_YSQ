const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/keuangancontrollers");
const { verifyToken, onlyAdmin, onlySantri } = require("../middleware/auth");

/* =========================
   BILLING / TAGIHAN
========================= */
router.post("/billing/spp-massal", verifyToken, onlyAdmin, ctrl.generateSPPMassal);
router.post("/billing/manual", verifyToken, onlyAdmin, ctrl.tambahBillingManual);
router.get("/billing/me", verifyToken, onlySantri, ctrl.getBillingSantri);
router.get("/billing/all", verifyToken, onlyAdmin, ctrl.getAllBilling);
router.post("/billing/manual-kelas", verifyToken, onlyAdmin, ctrl.tambahBillingKelas);

router.post(
   "/billing/lainnya",
   verifyToken,
   onlyAdmin,
   ctrl.tambahBillingLainnya
 );
 
 router.get(
   "/billing/lainnya/detail",
   verifyToken,
   onlyAdmin,
   ctrl.getDetailBillingLainnya
 );

/* =========================
   PEMBAYARAN
========================= */
router.post("/pembayaran", verifyToken, onlySantri, ctrl.createPembayaran);
router.get("/pembayaran/me", verifyToken, onlySantri, ctrl.getPembayaranSantri);
router.get("/pembayaran/all", verifyToken, onlyAdmin, ctrl.getAllPembayaran);

router.put(
  "/pembayaran/:id_pembayaran/konfirmasi",
  verifyToken,
  onlyAdmin,
  ctrl.konfirmasiPembayaranAdmin
);

// DETAIL SANTRI
router.get(
   "/admin/santri/:id_santri",
   verifyToken,
   onlyAdmin,
   ctrl.getKeuanganSantriAdmin
 );

 router.get(
   "/billing/:id_billing/santri",
   verifyToken,
   onlyAdmin,
   ctrl.getPembayaranPerBilling
 ); 
 
 
/* =========================
   PENGELUARAN
========================= */
router.post("/pengeluaran", verifyToken, onlyAdmin, ctrl.createPengeluaran);
router.get("/pengeluaran", verifyToken, onlyAdmin, ctrl.getPengeluaran);

/* =========================
   LAPORAN
========================= */
router.get(
   "/laporan/pemasukan/detail",
   verifyToken,
   onlyAdmin,
   ctrl.getDetailPemasukan
 ); 
router.get("/laporan/pengeluaran", verifyToken, onlyAdmin, ctrl.laporanPengeluaran);
// (opsional)
router.get("/laporan/ringkasan", verifyToken, onlyAdmin, ctrl.laporanRingkasan);

module.exports = router;
