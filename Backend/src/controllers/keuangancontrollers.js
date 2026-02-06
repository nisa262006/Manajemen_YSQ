const db = require("../config/db");

/* =====================================================
   ADMIN – GENERATE SPP MASSAL
===================================================== */
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


/* =====================================================
   ADMIN – BILLING MANUAL (DENGAN TANGGAL PERIODE)
===================================================== */
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


/* =====================================================
   ADMIN – SEMUA BILLING
===================================================== */
exports.getAllBilling = async (_, res) => {
  const q = await db.query(`
   SELECT b.*, s.nama
FROM billing_santri b
LEFT JOIN santri s ON b.id_santri=s.id_santri
ORDER BY b.created_at DESC
  `);

  res.json({ success: true, data: q.rows });
};


/* =====================================================
   SANTRI – LIHAT TAGIHAN
===================================================== */
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


/* =====================================================
   SANTRI – PEMBAYARAN (FIX ID_SANTRI & STATUS)
===================================================== */
exports.createPembayaran = async (req, res) => {
  const { id_billing, jumlah_bayar, metode } = req.body;

  try {
    const b = await db.query(`
      SELECT id_santri, sisa, jenis, tipe
      FROM billing_santri
      WHERE id_billing = $1
    `, [id_billing]);

    if (!b.rowCount) {
      return res.status(400).json({ message: "Billing tidak ditemukan" });
    }

    if (jumlah_bayar <= 0 || jumlah_bayar > b.rows[0].sisa) {
      return res.status(400).json({ message: "Jumlah bayar tidak valid" });
    }

    // 1️⃣ Simpan pembayaran (LOG)
    await db.query(`
      INSERT INTO pembayaran
      (id_billing, id_santri, tanggal_bayar, jumlah_bayar, metode, kategori, jenis_pembayaran, status)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, 'menunggu')
    `, [
      id_billing,
      b.rows[0].id_santri,
      jumlah_bayar,
      metode,
      b.rows[0].jenis,
      b.rows[0].tipe
    ]);

    // 2️⃣ Billing jadi MENUNGGU
    await db.query(`
      UPDATE billing_santri
      SET status = 'menunggu'
      WHERE id_billing = $1 AND status != 'lunas'
    `, [id_billing]);

    res.json({ success: true, message: "Pembayaran terkirim, menunggu verifikasi admin" });
  } catch (err) {
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
    const p = await db.query(`
      SELECT 
        p.id_billing,
        p.jumlah_bayar,
        b.sisa
      FROM pembayaran p
      JOIN billing_santri b ON b.id_billing = p.id_billing
      WHERE p.id_pembayaran = $1
        AND p.status = 'menunggu'
    `, [id_pembayaran]);

    if (!p.rowCount) {
      return res.status(400).json({ message: "Pembayaran tidak valid" });
    }

    const { id_billing, jumlah_bayar, sisa } = p.rows[0];

    const sisaBaru = sisa - jumlah_bayar;
    const statusBaru = sisaBaru <= 0 ? 'lunas' : 'nyicil';

    // 1️⃣ Update pembayaran (LOG)
    await db.query(`
      UPDATE pembayaran
      SET status = 'lunas'
      WHERE id_pembayaran = $1
    `, [id_pembayaran]);

    // 2️⃣ Update billing (STATUS RESMI)
    await db.query(`
      UPDATE billing_santri
      SET sisa = $1, status = $2
      WHERE id_billing = $3
    `, [sisaBaru, statusBaru, id_billing]);

    res.json({ success: true, message: "Pembayaran berhasil dikonfirmasi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* =====================================================
   ADMIN – LIHAT SEMUA STATUS SANTRI PER BILLING
===================================================== */
exports.getPembayaranPerBilling = async (req, res) => {
  const { id_billing } = req.params;

  // 1️⃣ Ambil info billing sebagai anchor
  const base = await db.query(`
    SELECT jenis, tipe, periode
    FROM billing_santri
    WHERE id_billing = $1
  `, [id_billing]);

  if (!base.rowCount) {
    return res.status(404).json({ message: "Billing tidak ditemukan" });
  }

  const { jenis, tipe, periode } = base.rows[0];

  // 2️⃣ Jika SPP → tetap 1 santri
  if (jenis === "SPP") {
    const q = await db.query(`
      SELECT 
        s.id_santri,
        s.nama,
        p.id_pembayaran,
        p.jumlah_bayar,
        bs.status
      FROM billing_santri bs
      JOIN santri s ON bs.id_santri = s.id_santri
      LEFT JOIN pembayaran p
        ON p.id_billing = bs.id_billing
      WHERE bs.id_billing = $1
    `, [id_billing]);

    return res.json(q.rows);
  }

  // 3️⃣ Jika LAINNYA → ambil SEMUA SANTRI
  const q = await db.query(`
    SELECT 
      bs.id_billing,
      s.nama,
      p.id_pembayaran,
      p.jumlah_bayar,
      bs.status
    FROM billing_santri bs
    JOIN santri s ON bs.id_santri = s.id_santri
    LEFT JOIN pembayaran p
      ON p.id_billing = bs.id_billing
    WHERE bs.jenis = 'LAINNYA'
      AND bs.tipe = $1
      AND bs.periode = $2
    ORDER BY s.nama ASC
  `, [tipe, periode]);

  res.json(q.rows);
};

// GET /api/keuangan/billing/lainnya/detail
exports.getDetailBillingLainnya = async (req, res) => {
  const { tipe, periode } = req.query;

  const q = await db.query(`
    SELECT 
      b.id_billing,
      s.nama,
      p.id_pembayaran,
      p.jumlah_bayar,
      b.status
    FROM billing_santri b
    JOIN santri s ON b.id_santri = s.id_santri
    LEFT JOIN pembayaran p
      ON p.id_billing = b.id_billing
      AND p.status = 'menunggu'
    WHERE b.jenis = 'LAINNYA'
      AND b.tipe = $1
      AND b.periode = $2
    ORDER BY s.nama ASC
  `, [tipe, periode]);

  res.json(q.rows);
};
