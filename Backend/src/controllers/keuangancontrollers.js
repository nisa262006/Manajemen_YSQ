const db = require("../config/db");

require("dotenv").config();
const nodemailer = require("nodemailer");

// ❗ matikan semua log saat test
if (process.env.NODE_ENV !== 'test') {
  console.log("EMAIL_SENDER:", process.env.EMAIL_SENDER);
  console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "ADA" : "TIDAK ADA");
}

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ❗ matikan verify saat test
if (process.env.NODE_ENV !== 'test') {
  mailTransporter.verify((error) => {
    if (error) {
      console.error("❌ GMAIL CONNECTION ERROR:", error);
    } else {
      console.log("✅ GMAIL READY - Siap kirim email");
    }
  });
}

exports.generateSPPMassal = async (req, res) => {
  try {
    // Ambil tanggal dari body (misal admin input tanggal mulai dan akhir untuk bulan tersebut)
    const { periode, nominal_dewasa, nominal_anak, tgl_mulai, tgl_selesai } = req.body;

    await db.query(`
      INSERT INTO billing_santri
      (id_santri, jenis, tipe, periode, nominal, sisa, status, tanggal_mulai, tanggal_selesai)
      SELECT
        s.id_santri,
        'INFAQ_BELAJAR',
        'infaq_belajar',
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
        AND b.jenis = 'INFAQ_BELAJAR'
        AND b.periode = $1
      )
    `, [periode, nominal_dewasa, nominal_anak, tgl_mulai, tgl_selesai]);


    res.json({ success: true, message: "Infaq Belajar massal berhasil dibuat" });
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
        COALESCE(
          (SELECT k.nama_kelas 
           FROM santri_jadwal sj 
           JOIN jadwal j ON sj.id_jadwal = j.id_jadwal 
           JOIN kelas k ON j.id_kelas = k.id_kelas 
           WHERE sj.id_santri = s.id_santri 
           LIMIT 1), 
          '-'
        ) AS nama_kelas
      FROM billing_santri b
      LEFT JOIN santri s ON b.id_santri = s.id_santri
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

    const billing = b.rows[0];

    const cekPending = await db.query(`
      SELECT COALESCE(SUM(jumlah_bayar), 0) AS total_pending
      FROM pembayaran
      WHERE id_billing = $1 AND status = 'menunggu'
    `, [id_billing]);

    const totalPending = Number(cekPending.rows[0].total_pending);
    const sisaEfektif = billing.sisa - totalPending;

    if (jumlah_bayar <= 0 || jumlah_bayar > sisaEfektif) {
      return res.status(400).json({
        message: "Jumlah bayar tidak valid"
      });
    }

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

    // 🔥 RESPONSE DIKIRIM DULU (BIAR CEPAT)
    res.json({
      success: true,
      message: "Pembayaran terkirim, menunggu verifikasi admin"
    });

    // ===========================
    // EMAIL JALAN DI BELAKANGAN
    // ===========================
    try {

      const detail = await db.query(`
        SELECT s.nama,
               COALESCE(k.nama_kelas,'Tanpa Kelas') AS nama_kelas
        FROM santri s
        LEFT JOIN LATERAL (
            SELECT k.nama_kelas
            FROM santri_jadwal sj
            JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
            JOIN kelas k ON k.id_kelas = j.id_kelas
            WHERE sj.id_santri = s.id_santri
            LIMIT 1
        ) k ON TRUE
        WHERE s.id_santri = $1
      `, [billing.id_santri]);

      const namaSantri = detail.rows[0]?.nama || "-";
      const kelas = detail.rows[0]?.nama_kelas || "-";

      const admin = await db.query(`
        SELECT email FROM users
        WHERE LOWER(role) = 'admin'
        LIMIT 1
      `);

      if (admin.rowCount > 0) {
        await mailTransporter.sendMail({
          from: `"Sahabat Quran Bogor" <${process.env.EMAIL_SENDER}>`,
          to: admin.rows[0].email,
          subject: "Notifikasi Pembayaran Santri",
          html: `
            <h3>Pembayaran Baru</h3>
            <p><b>Nama:</b> ${namaSantri}</p>
            <p><b>Kelas:</b> ${kelas}</p>
            <p><b>Jumlah:</b> Rp ${new Intl.NumberFormat("id-ID").format(jumlah_bayar)}</p>
          `
        });
      }

    } catch (emailErr) {
      console.error("EMAIL ERROR:", emailErr);
    }

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
        TO_CHAR(p.tanggal_bayar, 'YYYY-MM-DD') AS tanggal,
        s.nama,

        -- 🔥 Ambil kelas dari jadwal aktif santri
        COALESCE(k.nama_kelas, 'Tanpa Kelas') AS kelas,

        b.periode,

        CASE 
          WHEN b.jenis = 'INFAQ_BELAJAR' 
            THEN 'Infaq Belajar'
          WHEN b.jenis = 'INFAQ_LAINNYA' 
            THEN 'Infaq ' || INITCAP(b.tipe)
        END AS kategori,

        p.metode AS metode_pembayaran,
        p.jumlah_bayar AS nominal

      FROM pembayaran p
      JOIN billing_santri b ON p.id_billing = b.id_billing
      JOIN santri s ON b.id_santri = s.id_santri

      -- 🔥 AMBIL 1 KELAS SAJA (ANTI DUPLIKAT)
      LEFT JOIN LATERAL (
        SELECT k.nama_kelas
        FROM santri_jadwal sj
        JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
        JOIN kelas k ON k.id_kelas = j.id_kelas
        WHERE sj.id_santri = s.id_santri
        LIMIT 1
      ) k ON TRUE

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
  const { id_kelas, tipe, periode_awal, periode_akhir, nominal } = req.body;

  try {
    const santriDiKelas = await db.query(`
      SELECT DISTINCT sj.id_santri, sj.id_jadwal
      FROM santri_jadwal sj
      JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
      WHERE j.id_kelas = $1
    `, [id_kelas]);

    if (!santriDiKelas.rowCount) {
      return res.status(400).json({ message: "Tidak ada santri di kelas ini" });
    }

    let success = 0;
    let skipped = 0;

    for (const row of santriDiKelas.rows) {

      const cek = await db.query(`
        SELECT 1 FROM billing_santri
        WHERE id_santri=$1 
        AND jenis='INFAQ_BELAJAR' 
        AND periode=$2
      `, [row.id_santri, periode_awal]);

      if (cek.rowCount > 0) {
        skipped++;
        continue;
      }

      await db.query(`
        INSERT INTO billing_santri
        (id_santri, id_jadwal, jenis, tipe, periode, nominal, sisa, tanggal_mulai, tanggal_selesai, status)
        VALUES ($1, $2, 'INFAQ_BELAJAR', $3, $4, $5, $5, $6, $7, 'belum bayar')
      `, [
        row.id_santri,
        row.id_jadwal,   // 🔥 WAJIB
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
      message: `Berhasil: ${success}, Dilewati: ${skipped}`
    });

  } catch (err) {
    console.error(err);
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
          VALUES ($1, 'INFAQ_LAINNYA', $2, $3, $4, $4, $5, $6, 'belum bayar')
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
    // 1️⃣ Ambil pembayaran yang masih menunggu
    const p = await db.query(`
      SELECT id_billing, jumlah_bayar
      FROM pembayaran
      WHERE id_pembayaran = $1
        AND status = 'menunggu'
    `, [id_pembayaran]);

    if (!p.rowCount) {
      return res.status(400).json({
        message: "Pembayaran tidak valid atau sudah dikonfirmasi"
      });
    }

    const { id_billing } = p.rows[0];

    // 2️⃣ Ubah pembayaran ini menjadi LUNAS
    await db.query(`
      UPDATE pembayaran
      SET status = 'lunas'
      WHERE id_pembayaran = $1
    `, [id_pembayaran]);

    // 3️⃣ 🔥 HAPUS / BATALKAN semua pembayaran lain yang masih menunggu untuk billing ini
    await db.query(`
      UPDATE pembayaran
      SET status = 'dibatalkan'
      WHERE id_billing = $1
        AND status = 'menunggu'
    `, [id_billing]);

    // 4️⃣ Hitung total lunas
    const total = await db.query(`
      SELECT COALESCE(SUM(jumlah_bayar),0) AS total_lunas
      FROM pembayaran
      WHERE id_billing = $1
        AND status = 'lunas'
    `, [id_billing]);

    const totalBayarLunas = Number(total.rows[0].total_lunas);

    // 5️⃣ Ambil nominal asli billing
    const billing = await db.query(`
      SELECT nominal
      FROM billing_santri
      WHERE id_billing = $1
    `, [id_billing]);

    const nominalAsli = Number(billing.rows[0].nominal);

    // 6️⃣ Hitung sisa
    const sisaHitung = nominalAsli - totalBayarLunas;
    const sisaFinal = Math.max(0, sisaHitung);

    let statusBaru = "belum bayar";

    if (sisaFinal <= 0) {
      statusBaru = "lunas";
    } else if (totalBayarLunas > 0) {
      statusBaru = "nyicil";
    }

    // 7️⃣ Update billing
    await db.query(`
      UPDATE billing_santri
      SET sisa = $1,
          status = $2
      WHERE id_billing = $3
    `, [sisaFinal, statusBaru, id_billing]);

    res.json({
      success: true,
      message: "Pembayaran berhasil dikonfirmasi"
    });

  } catch (err) {
    console.error("KONFIRMASI ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getPembayaranPerBilling = async (req, res) => {
  const { id_billing } = req.params;

  try {

    const base = await db.query(`
      SELECT jenis, tipe, periode
      FROM billing_santri
      WHERE id_billing = $1
    `, [id_billing]);

    if (!base.rowCount) {
      return res.status(404).json({ message: "Billing tidak ditemukan" });
    }

    const { jenis, tipe, periode } = base.rows[0];

    // ======================================================
    // 🔵 INFAQ BELAJAR
    // ======================================================
    if (jenis === "INFAQ_BELAJAR") {

      const q = await db.query(`
        SELECT
          bs.id_billing,
          s.id_santri,
          s.nama,

          COALESCE(k.nama_kelas, 'Tanpa Kelas') AS nama_kelas,

          p.id_pembayaran,
          p.jumlah_bayar,
          p.status AS status_pembayaran,
          bs.status AS status_billing

        FROM billing_santri bs
        JOIN santri s ON bs.id_santri = s.id_santri

        LEFT JOIN LATERAL (
            SELECT k.nama_kelas
            FROM santri_jadwal sj
            JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
            JOIN kelas k ON k.id_kelas = j.id_kelas
            WHERE sj.id_santri = s.id_santri
            LIMIT 1
        ) k ON TRUE

        LEFT JOIN pembayaran p
          ON p.id_billing = bs.id_billing

        WHERE bs.id_billing = $1
        ORDER BY s.nama ASC, p.created_at ASC
      `, [id_billing]);

      return res.json({ success: true, data: q.rows });
    }

    // ======================================================
    // 🟣 INFAQ LAINNYA
    // ======================================================
    const q = await db.query(`
      SELECT
        bs.id_billing,
        s.id_santri,
        s.nama,

        COALESCE(k.nama_kelas, 'Tanpa Kelas') AS nama_kelas,

        p.id_pembayaran,
        p.jumlah_bayar,
        p.status AS status_pembayaran,
        bs.status AS status_billing

      FROM billing_santri bs
      JOIN santri s ON bs.id_santri = s.id_santri

      LEFT JOIN LATERAL (
          SELECT k.nama_kelas
          FROM santri_jadwal sj
          JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
          JOIN kelas k ON k.id_kelas = j.id_kelas
          WHERE sj.id_santri = s.id_santri
          LIMIT 1
      ) k ON TRUE

      LEFT JOIN pembayaran p
        ON p.id_billing = bs.id_billing

      WHERE bs.jenis = 'INFAQ_LAINNYA'
        AND bs.tipe = $1
        AND bs.periode = $2

      ORDER BY s.nama ASC, p.created_at ASC
    `, [tipe, periode]);

    res.json({ success: true, data: q.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/keuangan/billing/lainnya/detail
// GET /api/keuangan/billing/lainnya/detail
exports.getDetailBillingLainnya = async (req, res) => {
  const { tipe, periode } = req.query;

  try {

    const q = await db.query(`
      SELECT 
        b.id_billing,
        s.nama,

        COALESCE(k.nama_kelas, 'Tanpa Kelas') AS nama_kelas,

        p.id_pembayaran,
        p.jumlah_bayar,
        p.status AS status_pembayaran,
        b.status AS status_billing,
        b.nominal AS total_tagihan

      FROM billing_santri b
      JOIN santri s ON b.id_santri = s.id_santri

      LEFT JOIN LATERAL (
          SELECT k.nama_kelas
          FROM santri_jadwal sj
          JOIN jadwal j ON j.id_jadwal = sj.id_jadwal
          JOIN kelas k ON k.id_kelas = j.id_kelas
          WHERE sj.id_santri = s.id_santri
          LIMIT 1
      ) k ON TRUE

      LEFT JOIN pembayaran p 
        ON p.id_billing = b.id_billing

      WHERE b.jenis = 'INFAQ_LAINNYA'
        AND b.tipe = $1
        AND b.periode = $2

      ORDER BY s.nama ASC, p.created_at ASC
    `, [tipe, periode]);

    res.json({ success: true, data: q.rows });

  } catch (err) {
    console.error(err);
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
        b.tipe,
        COUNT(p.id_pembayaran) AS total
      FROM billing_santri b
      JOIN pembayaran p 
        ON p.id_billing = b.id_billing
      WHERE p.status = 'menunggu'
        AND b.status != 'lunas'
      GROUP BY b.jenis, b.tipe
    `);

    const result = [];
    let totalAll = 0;

    q.rows.forEach(row => {
      const total = parseInt(row.total);
      totalAll += total;

      if (row.jenis === "INFAQ_BELAJAR") {
        result.push({
          nama: "Infaq Belajar",
          total
        });
      } else {
        result.push({
          nama: `Infaq ${row.tipe}`,
          total
        });
      }
    });

    res.json({
      success: true,
      total: totalAll,
      detail: result
    });

  } catch (err) {
    console.error("NOTIF ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
