const db = require("../config/db");

require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("EMAIL_SENDER:", process.env.EMAIL_SENDER);
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "ADA" : "TIDAK ADA");

// ✅ BUAT TRANSPORTER KHUSUS UNTUK VERIFY SAAT START
const testTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 🔎 Cek koneksi Gmail saat server start
testTransporter.verify((error, success) => {
  if (error) {
    console.error("❌ GMAIL CONNECTION ERROR:", error);
  } else {
    console.log("✅ GMAIL READY - Siap kirim email");
  }
});


exports.generateSPPMassal = async (req, res) => {
  try {
    // Ambil tanggal dari body (misal admin input tanggal mulai dan akhir untuk bulan tersebut)
    const { periode, nominal_dewasa, nominal_anak, tgl_mulai, tgl_selesai } = req.body;

    await db.query(`
      INSERT INTO billing_santri
      (id_santri, jenis, tipe, periode, nominal, sisa, status, tanggal_mulai, tanggal_selesai)
      SELECT
        s.id_santri,
        'SPP',
        'spp',
        $1,
        CASE WHEN s.kategori='dewasa' THEN $2 ELSE $3 END,
        CASE WHEN s.kategori='dewasa' THEN $2 ELSE $3 END,
        'belum bayar',
        $4,
        $5
      FROM santri s
      WHERE s.status='aktif'
      AND NOT EXISTS (
        SELECT 1 FROM billing_santri b
        WHERE b.id_santri = s.id_santri
        AND b.jenis = 'SPP'
        AND b.periode = $1
      )
    `, [periode, nominal_dewasa, nominal_anak, tgl_mulai, tgl_selesai]);


    res.json({ success: true, message: "SPP massal berhasil dibuat" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.tambahBillingManual = async (req, res) => {
  // Tambahkan tanggal_mulai dan tanggal_selesai di destructuring
  const { id_santri, jenis, tipe, periode, nominal, tanggal_mulai, tanggal_selesai } = req.body;

  try {
    await db.query(`
      INSERT INTO billing_santri
      (id_santri, jenis, tipe, periode, nominal, sisa, status, tanggal_mulai, tanggal_selesai)
      VALUES ($1, $2, $3, $4, $5, $5, 'belum bayar', $6, $7)
    `, [id_santri, jenis, tipe, periode, nominal, tanggal_mulai, tanggal_selesai]);

    res.json({ success: true, message: "Billing berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getAllBilling = async (_, res) => {
  try {
    const q = await db.query(`
      SELECT
        b.*,
        s.nama,
        k.nama_kelas
      FROM billing_santri b
      LEFT JOIN santri s ON b.id_santri = s.id_santri
      -- Tambahkan JOIN ke kelas melalui santri_kelas
      LEFT JOIN santri_kelas sk ON s.id_santri = sk.id_santri
      LEFT JOIN kelas k ON sk.id_kelas = k.id_kelas
      ORDER BY b.created_at DESC
    `);

    res.json({ success: true, data: q.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getBillingSantri = async (req, res) => {
  const q = await db.query(`
    SELECT
      b.*,
      EXISTS (
        SELECT 1 FROM pembayaran p
        WHERE p.id_billing = b.id_billing
          AND p.status = 'menunggu'
      ) AS ada_menunggu
    FROM billing_santri b
    WHERE b.id_santri = (
      SELECT id_santri FROM santri WHERE id_users = $1
    )
    ORDER BY b.created_at DESC
  `, [req.user.id_users]);

  res.json({ success: true, data: q.rows });
};


exports.createPembayaran = async (req, res) => {
  const { id_billing, jumlah_bayar, metode } = req.body;

  try {
    const b = await db.query(`
      SELECT id_santri, sisa, jenis, tipe, nominal, periode
      FROM billing_santri
      WHERE id_billing = $1
    `, [id_billing]);

    if (!b.rowCount) {
      return res.status(400).json({ message: "Billing tidak ditemukan" });
    }

    if (jumlah_bayar <= 0 || jumlah_bayar > b.rows[0].sisa) {
      return res.status(400).json({ message: "Jumlah bayar tidak valid" });
    }

    const billing = b.rows[0];

    // INSERT pembayaran
    await db.query(`
      INSERT INTO pembayaran
      (id_billing, id_santri, tanggal_bayar, jumlah_bayar, metode, kategori, jenis_pembayaran, status)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, 'menunggu')
    `, [
      id_billing,
      billing.id_santri,
      jumlah_bayar,
      metode,
      billing.jenis,
      billing.tipe
    ]);

    await db.query(`
      UPDATE billing_santri
      SET status = 'menunggu'
      WHERE id_billing = $1 AND status != 'lunas'
    `, [id_billing]);

    // ===============================
    // 🔔 KIRIM EMAIL (SAMA POLA DENGAN RESET)
    // ===============================

    const detail = await db.query(`
      SELECT s.nama, k.nama_kelas
      FROM santri s
      LEFT JOIN santri_kelas sk ON s.id_santri = sk.id_santri
      LEFT JOIN kelas k ON sk.id_kelas = k.id_kelas
      WHERE s.id_santri = $1
    `, [billing.id_santri]);

    const namaSantri = detail.rows[0]?.nama || "-";
    const kelas = detail.rows[0]?.nama_kelas || "-";
    const sisaBaru = billing.sisa - jumlah_bayar;

    const admin = await db.query(`
      SELECT email FROM users WHERE LOWER(role) = 'admin' LIMIT 1
    `);

    if (admin.rowCount > 0) {

      // 🔥 BUAT TRANSPORTER DI DALAM FUNCTION (SAMA SEPERTI RESET)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_SENDER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"Sahabat Quran Bogor" <${process.env.EMAIL_SENDER}>`,
        to: admin.rows[0].email,
        subject: "Notifikasi Pembayaran Santri",
        html: `
          <h2>📥 Notifikasi Pembayaran Santri</h2>
          <p><strong>Nama Santri:</strong> ${namaSantri}</p>
          <p><strong>Kelas:</strong> ${kelas}</p>
          <p><strong>Jenis Pembayaran:</strong> ${billing.jenis}</p>
          <p><strong>Periode:</strong> ${billing.periode || billing.tipe}</p>
          <p><strong>Nominal Bill:</strong> Rp ${new Intl.NumberFormat("id-ID").format(billing.nominal)}</p>
          <p><strong>Jumlah Dibayar:</strong> Rp ${new Intl.NumberFormat("id-ID").format(jumlah_bayar)}</p>
          <p><strong>Sisa Pembayaran:</strong> Rp ${new Intl.NumberFormat("id-ID").format(sisaBaru)}</p>
          <br/>
          <p style="color:red; font-weight:bold;">
            Santri telah melakukan pembayaran, segera mengkonfirmasi pembayaran santri.
          </p>
        `
      });

      console.log("EMAIL NOTIF PEMBAYARAN TERKIRIM");
    }

    res.json({
      success: true,
      message: "Pembayaran terkirim, menunggu verifikasi admin"
    });

  } catch (err) {
    console.error("CREATE PEMBAYARAN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



/* =====================================================
   SANTRI – RIWAYAT PEMBAYARAN
===================================================== */
exports.getPembayaranSantri = async (req, res) => {
  const q = await db.query(`
    SELECT p.*
    FROM pembayaran p
    JOIN billing_santri b ON p.id_billing=b.id_billing
    JOIN santri s ON b.id_santri=s.id_santri
    WHERE s.id_users=$1
    ORDER BY p.created_at DESC
  `, [req.user.id_users]);

  res.json({ success: true, data: q.rows });
};


/* =====================================================
   ADMIN – SEMUA PEMBAYARAN
===================================================== */
exports.getAllPembayaran = async (_, res) => {
  const q = await db.query(`
    SELECT p.*, s.nama
    FROM pembayaran p
    LEFT JOIN billing_santri b ON p.id_billing=b.id_billing
    LEFT JOIN santri s ON b.id_santri=s.id_santri
    ORDER BY p.created_at DESC
  `);

  res.json({ success: true, data: q.rows });
};


/* =====================================================
   LAPORAN KEUANGAN
===================================================== */
exports.getDetailPemasukan = async (req, res) => {
  try {
    const q = await db.query(`
      SELECT
        p.tanggal_bayar AS tanggal,
        s.nama,
        k.nama_kelas AS kelas,
        b.periode,
        b.jenis AS kategori,
        p.jumlah_bayar AS nominal
      FROM pembayaran p
      JOIN billing_santri b ON p.id_billing = b.id_billing
      JOIN santri s ON b.id_santri = s.id_santri
      LEFT JOIN santri_kelas sk ON sk.id_santri = s.id_santri
      LEFT JOIN kelas k ON k.id_kelas = sk.id_kelas
      WHERE p.status = 'lunas'
      ORDER BY p.tanggal_bayar DESC
    `);

    res.json({ success: true, data: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ADMIN – INPUT PENGELUARAN
===================================================== */
exports.createPengeluaran = async (req, res) => {
  try {
    const { tanggal, kategori, nominal, keterangan } = req.body;

    await db.query(`
      INSERT INTO pengeluaran
      (tanggal, kategori, nominal, keterangan)
      VALUES ($1,$2,$3,$4)
    `, [tanggal, kategori, nominal, keterangan]);

    res.json({
      success: true,
      message: "Pengeluaran berhasil dicatat"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   ADMIN – LIST PENGELUARAN
===================================================== */
exports.getPengeluaran = async (_, res) => {
  const q = await db.query(`
    SELECT *
    FROM pengeluaran
    ORDER BY tanggal DESC
  `);

  res.json({ success: true, data: q.rows });
};

/* =====================================================
   ADMIN – LAPORAN PENGELUARAN
===================================================== */
exports.laporanPengeluaran = async (req, res) => {
  try {
    const q = await db.query(`
      SELECT *
      FROM pengeluaran
      ORDER BY tanggal DESC
    `);

    res.json({ success: true, data: q.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ADMIN – RINGKASAN KEUANGAN (OPSIONAL)
===================================================== */
exports.laporanRingkasan = async (req, res) => {
  try {
    // TOTAL PEMASUKAN (SEMUA BILL YANG LUNAS)
    const pemasukan = await db.query(`
      SELECT COALESCE(SUM(p.jumlah_bayar),0) AS total
      FROM pembayaran p
      WHERE p.status = 'lunas'
    `);

    // TOTAL PENGELUARAN
    const pengeluaran = await db.query(`
      SELECT COALESCE(SUM(nominal),0) AS total
      FROM pengeluaran
    `);

    const totalPemasukan = Number(pemasukan.rows[0].total);
    const totalPengeluaran = Number(pengeluaran.rows[0].total);

    res.json({
      success: true,
      pemasukan: totalPemasukan,
      pengeluaran: totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


// GET /api/keuangan/admin/santri/:id_santri
exports.getKeuanganSantriAdmin = async (req, res) => {
  const { id_santri } = req.params;

  const billing = await db.query(`
    SELECT *
    FROM billing_santri
    WHERE id_santri = $1
    ORDER BY created_at DESC
  `, [id_santri]);

  const pembayaran = await db.query(`
    SELECT p.*
    FROM pembayaran p
    JOIN billing_santri b ON p.id_billing=b.id_billing
    WHERE b.id_santri=$1
    ORDER BY p.created_at DESC
  `, [id_santri]);

  res.json({
    success: true,
    billing: billing.rows,
    pembayaran: pembayaran.rows
  });
};


/* =====================================================
   ADMIN – BILLING MASAL PER KELAS
===================================================== */
// Di keuangancontrollers.js
exports.tambahBillingKelas = async (req, res) => {
  const { id_kelas, jenis, tipe, periode_awal, periode_akhir, nominal } = req.body;

  try {
    const santriDiKelas = await db.query(
      `SELECT id_santri FROM santri_kelas WHERE id_kelas = $1`,
      [id_kelas]
    );

    if (!santriDiKelas.rowCount) {
      return res.status(400).json({ message: "Tidak ada santri di kelas ini" });
    }

    let success = 0;
    let skipped = 0;

    for (const row of santriDiKelas.rows) {
      const cek = await db.query(`
        SELECT 1 FROM billing_santri
        WHERE id_santri=$1 AND jenis='SPP' AND periode=$2
      `, [row.id_santri, periode_awal]);

      if (cek.rowCount > 0) {
        skipped++;
        continue; // ⛔ STOP INSERT
      }

      await db.query(`
        INSERT INTO billing_santri
        (id_santri, jenis, tipe, periode, nominal, sisa, tanggal_mulai, tanggal_selesai, status)
        VALUES ($1,'SPP',$2,$3,$4,$4,$5,$6,'belum bayar')
      `, [
        row.id_santri,
        tipe,
        periode_awal,
        nominal,
        periode_awal,
        periode_akhir
      ]);

      success++;
    }

    res.json({
      success: true,
      message: `Berhasil: ${success}, Dilewati (sudah ada): ${skipped}`
    });

  } catch (err) {
    // Tangkap error UNIQUE constraint
    if (err.code === "23505") {
      return res.status(400).json({
        message: "SPP periode ini sudah pernah dibuat"
      });
    }

    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   ADMIN – BILLING LAINNYA (PERBAIKAN PERIODE NULL)
===================================================== */
  exports.tambahBillingLainnya = async (req, res) => {
    const { nama_pembayaran, nominal, tanggal_mulai, keterangan } = req.body;

    try {
      const santriAktif = await db.query(
        `SELECT id_santri FROM santri WHERE status = 'aktif'`
      );

      for (const s of santriAktif.rows) {
        await db.query(`
          INSERT INTO billing_santri
          (id_santri, jenis, tipe, periode, nominal, sisa, tanggal_mulai, keterangan, status)
          VALUES ($1, 'LAINNYA', $2, $3, $4, $4, $5, $6, 'belum bayar')
        `, [
          s.id_santri,
          nama_pembayaran,          // $2 → tipe
          tanggal_mulai,            // $3 → periode (TEXT OK)
          nominal,                  // $4
          tanggal_mulai,            // $5 → tanggal_mulai (DATE)
          keterangan                // $6
        ]);
      }

      res.json({ success: true, message: "Billing lainnya berhasil dibuat" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };


// ADMIN – KONFIRMASI PEMBAYARAN SANTRI
exports.konfirmasiPembayaranAdmin = async (req, res) => {
  const { id_pembayaran } = req.params;

  try {
    // 1️⃣ Ambil id_billing dulu
    const p = await db.query(`
      SELECT id_billing, jumlah_bayar
      FROM pembayaran
      WHERE id_pembayaran = $1
        AND status = 'menunggu'
    `, [id_pembayaran]);

    if (!p.rowCount) {
      return res.status(400).json({ message: "Pembayaran tidak valid" });
    }

    const { id_billing } = p.rows[0];

    // 2️⃣ Konfirmasi pembayaran ini saja
    await db.query(`
      UPDATE pembayaran
      SET status = 'lunas'
      WHERE id_pembayaran = $1
    `, [id_pembayaran]);

    // 3️⃣ Hitung ulang TOTAL yang sudah lunas
    const total = await db.query(`
      SELECT COALESCE(SUM(jumlah_bayar),0) AS total
      FROM pembayaran
      WHERE id_billing = $1
        AND status = 'lunas'
    `, [id_billing]);

    const totalBayar = Number(total.rows[0].total);

    // 4️⃣ Ambil nominal asli billing
    const billing = await db.query(`
      SELECT nominal
      FROM billing_santri
      WHERE id_billing = $1
    `, [id_billing]);

    const nominal = Number(billing.rows[0].nominal);
    const sisaBaru = nominal - totalBayar;

    let statusBaru = "belum bayar";
    if (sisaBaru <= 0) statusBaru = "lunas";
    else if (totalBayar > 0) statusBaru = "nyicil";

    // 5️⃣ Update billing berdasarkan hitungan ulang
    await db.query(`
      UPDATE billing_santri
      SET sisa = $1,
          status = $2
      WHERE id_billing = $3
    `, [sisaBaru, statusBaru, id_billing]);

    res.json({ success: true, message: "Pembayaran berhasil dikonfirmasi" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getPembayaranPerBilling = async (req, res) => {
  const { id_billing } = req.params;

  // 1️⃣ Ambil info billing
  const base = await db.query(`
    SELECT jenis, tipe, periode
    FROM billing_santri
    WHERE id_billing = $1
  `, [id_billing]);

  if (!base.rowCount) {
    return res.status(404).json({ message: "Billing tidak ditemukan" });
  }

  const { jenis, tipe, periode } = base.rows[0];

  if (jenis === "SPP") {
    const q = await db.query(`
      SELECT
        s.id_santri,
        s.nama,
        p.id_pembayaran,
        p.jumlah_bayar,
        p.status AS status_pembayaran,
        bs.status AS status_billing
      FROM billing_santri bs
      JOIN santri s ON bs.id_santri = s.id_santri
      LEFT JOIN pembayaran p
        ON p.id_billing = bs.id_billing
      WHERE bs.id_billing = $1
      ORDER BY p.created_at ASC
    `, [id_billing]);

    return res.json({ success: true, data: q.rows });
  }

  const q = await db.query(`
    SELECT
      bs.id_billing,
      s.nama,
      k.nama_kelas,
      p.id_pembayaran,
      p.jumlah_bayar,
      p.status AS status_pembayaran,
      bs.status AS status_billing
    FROM billing_santri bs
    JOIN santri s ON bs.id_santri = s.id_santri
    LEFT JOIN santri_kelas sk ON s.id_santri = sk.id_santri
    LEFT JOIN kelas k ON sk.id_kelas = k.id_kelas
    LEFT JOIN pembayaran p
      ON p.id_billing = bs.id_billing
    WHERE bs.jenis = 'LAINNYA'
      AND bs.tipe = $1
      AND bs.periode = $2
    ORDER BY s.nama ASC, p.created_at ASC
  `, [tipe, periode]);

  res.json({ success: true, data: q.rows });
};


// GET /api/keuangan/billing/lainnya/detail
exports.getDetailBillingLainnya = async (req, res) => {
  const { tipe, periode } = req.query;

  try {
    const q = await db.query(`
      SELECT
        b.id_billing,
        s.nama,
        p.id_pembayaran,
        p.jumlah_bayar,
        p.status AS status_pembayaran,
        b.status AS status_billing
      FROM billing_santri b
      JOIN santri s ON b.id_santri = s.id_santri
      LEFT JOIN pembayaran p
        ON p.id_billing = b.id_billing
      WHERE b.jenis = 'LAINNYA'
        AND b.tipe = $1
        AND b.periode = $2
      ORDER BY s.nama ASC, p.created_at ASC
    `, [tipe, periode]);

    res.json({ success: true, data: q.rows });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ADMIN – NOTIF DETAIL PEMBAYARAN MENUNGGU
===================================================== */
exports.getNotifikasiPembayaran = async (req, res) => {
  try {

    const q = await db.query(`
      SELECT
        b.jenis,
        COUNT(*) AS total
      FROM pembayaran p
      JOIN billing_santri b ON p.id_billing = b.id_billing
      WHERE p.status = 'menunggu'
      GROUP BY b.jenis
    `);

    let spp = 0;
    let lainnya = 0;

    q.rows.forEach(row => {
      if (row.jenis === "SPP") {
        spp = Number(row.total);
      }
      if (row.jenis === "LAINNYA") {
        lainnya = Number(row.total);
      }
    });

    res.json({
      success: true,
      spp,
      lainnya,
      total: spp + lainnya
    });

  } catch (err) {
    console.error("NOTIF ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};