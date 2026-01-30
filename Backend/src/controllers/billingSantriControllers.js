const db = require("../config/db");

/* ================= CREATE ================= */
exports.createBilling = async (req, res) => {
  try {
    const { id_santri, jenis, periode, nominal } = req.body;

    await db.query(`
      INSERT INTO billing_santri (id_santri, jenis, periode, nominal)
      VALUES ($1,$2,$3,$4)
    `, [id_santri, jenis, periode, nominal]);

    res.json({ message: "Billing santri berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= READ (ADMIN) ================= */
exports.getAllBilling = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        b.id_billing,
        s.nama AS nama_santri,
        b.jenis,
        b.periode,
        b.nominal,
        b.status,
        b.created_at
      FROM billing_santri b
      JOIN santri s ON b.id_santri = s.id_santri
      ORDER BY b.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= READ (SANTRI) ================= */
exports.getBillingSantri = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM billing_santri
      WHERE id_santri = (
        SELECT id_santri FROM santri WHERE id_users=$1
      )
      ORDER BY created_at DESC
    `, [req.user.id_users]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateBilling = async (req, res) => {
  try {
    const { jenis, periode, nominal, status } = req.body;

    await db.query(`
      UPDATE billing_santri
      SET jenis=$1, periode=$2, nominal=$3, status=$4
      WHERE id_billing=$5
    `, [jenis, periode, nominal, status, req.params.id]);

    res.json({ message: "Billing santri berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE ================= */
exports.deleteBilling = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM billing_santri WHERE id_billing=$1",
      [req.params.id]
    );

    res.json({ message: "Billing santri berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
