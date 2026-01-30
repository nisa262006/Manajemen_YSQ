const db = require("../config/db");

/* =====================================================
   SANTRI → CREATE PEMBAYARAN
===================================================== */
exports.createPembayaran = async (req, res) => {
    try {
      // ✅ FIX: Gunakan id_users sesuai dengan yang di-set di middleware verifyToken
      const id_users = req.user.id_users; 
      const { id_billing, jumlah_bayar, metode, bukti_bayar } = req.body;
  
      const billing = await db.query(`
        SELECT b.id_billing
        FROM billing_santri b
        JOIN santri s ON b.id_santri = s.id_santri
        WHERE b.id_billing = $1
          AND s.id_users = $2
          AND (b.status = 'belum bayar' OR b.status = 'belum') 
      `, [id_billing, id_users]);      
  
      if (billing.rowCount === 0) {
        return res.status(403).json({
          message: "Billing tidak valid, bukan milik Anda, atau sudah lunas"
        });
      }
  
      // ... sisa kode simpan ...
      await db.query(`
        INSERT INTO pembayaran
        (id_billing, tanggal_bayar, jumlah_bayar, metode, bukti_bayar, status)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, 'menunggu')
      `, [id_billing, jumlah_bayar, metode, bukti_bayar ?? null]);
  
      res.json({ success: true, message: "Pembayaran berhasil dikirim" });
  
    } catch (err) {
      console.error("ERROR PEMBAYARAN:", err.message);
      res.status(500).json({ message: "Gagal memproses pembayaran: " + err.message });
    }
};

/* =====================================================
   SANTRI → LIHAT PEMBAYARAN SENDIRI
===================================================== */
exports.getPembayaranSantri = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id_pembayaran, p.tanggal_bayar, p.jumlah_bayar, p.metode, p.status,
        b.id_billing, b.nominal AS total_tagihan
      FROM pembayaran p
      JOIN billing_santri b ON p.id_billing = b.id_billing
      JOIN santri s ON b.id_santri = s.id_santri
      WHERE s.id_users = $1
      ORDER BY p.id_pembayaran DESC
    `, [req.user.id_users]); // ✅ FIX: id_users

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

/* =====================================================
   ADMIN → LIHAT SEMUA PEMBAYARAN
===================================================== */
exports.getAllPembayaran = async (_, res) => {
    try {
      const result = await db.query(`
        SELECT 
          p.id_pembayaran,
          p.tanggal_bayar,
          p.jumlah_bayar,
          p.metode,
          p.status,
          s.nama, -- ✅ Sesuaikan: s.nama -> s.nama_santri
          b.periode,
          b.nominal AS total_tagihan -- ✅ Sesuaikan: b.jumlah -> b.nominal
        FROM pembayaran p
        JOIN billing_santri b ON p.id_billing = b.id_billing
        JOIN santri s ON b.id_santri = s.id_santri
        ORDER BY p.created_at DESC
      `);
  
      res.json({ success: true, data: result.rows });
  
    } catch (err) {
      console.error("GET ALL PEMBAYARAN ERROR:", err.message); // Agar error terlihat di terminal
      res.status(500).json({ message: "Server error: " + err.message });
    }
  };

/* =====================================================
   ADMIN → VERIFIKASI PEMBAYARAN
===================================================== */
exports.verifikasiPembayaran = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil billing terkait
    const pembayaran = await db.query(`
      SELECT id_billing FROM pembayaran
      WHERE id_pembayaran = $1
        AND status = 'menunggu'
    `, [id]);

    if (pembayaran.rowCount === 0) {
      return res.status(400).json({
        message: "Pembayaran tidak valid atau sudah diverifikasi"
      });
    }

    const id_billing = pembayaran.rows[0].id_billing;

    // ✅ Update pembayaran
    await db.query(`
      UPDATE pembayaran
      SET status = 'lunas'
      WHERE id_pembayaran = $1
    `, [id]);

    // ✅ Update billing
    await db.query(`
      UPDATE billing_santri
      SET status = 'lunas'
      WHERE id_billing = $1
    `, [id_billing]);

    res.json({
      success: true,
      message: "Pembayaran berhasil diverifikasi"
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
