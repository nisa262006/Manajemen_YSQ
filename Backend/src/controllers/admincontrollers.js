const db = require("../config/db");

// =======================================
// GET DASHBOARD STATS (FIX: Tambahkan fungsi yang hilang)
// =======================================
exports.getDashboardStats = async (req, res) => {
    try {
        const pendaftar = await db.query("SELECT COUNT(*) FROM pendaftar");
        const santri = await db.query("SELECT COUNT(*) FROM santri");
        const pengajar = await db.query("SELECT COUNT(*) FROM pengajar");
        const kelas = await db.query("SELECT COUNT(*) FROM kelas");

        res.json({
            success: true,
            data: {
                total_pendaftar: parseInt(pendaftar.rows[0].count),
                total_santri: parseInt(santri.rows[0].count),
                total_pengajar: parseInt(pengajar.rows[0].count),
                total_kelas: parseInt(kelas.rows[0].count)
            }
        });
    } catch (err) {
        console.error("STATS ERROR:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil statistik" });
    }
};

// =======================================
// GET ADMIN PROFILE
// =======================================
exports.getAdminProfile = async (req, res) => {
    try {
        const id_admin = req.params.id_admin;
        const result = await db.query(
            `SELECT a.id_admin, a.nama, a.email, a.no_wa, u.id_users, u.role
             FROM admin a
             LEFT JOIN users u ON a.id_users = u.id_users
             WHERE a.id_admin = $1`,
            [id_admin]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Data admin tidak ditemukan" });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("GET PROFILE ERROR:", err);
        res.status(500).json({ success: false, message: "Kesalahan server" });
    }
};

// =======================================
// UPDATE ADMIN PROFILE (FIX: Hindari Error id_users)
// =======================================
exports.updateAdminProfile = async (req, res) => {
    const client = await db.connect();
    try {
        const id_admin = req.params.id_admin;
        const { nama, email, no_wa } = req.body;

        await client.query("BEGIN");

        const oldData = await client.query(
            "SELECT id_users, nama, email, no_wa FROM admin WHERE id_admin = $1",
            [id_admin]
        );

        if (oldData.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Admin tidak ditemukan" });
        }

        const old = oldData.rows[0];

        const adminUpdate = await client.query(
            `UPDATE admin SET nama = $1, email = $2, no_wa = $3 WHERE id_admin = $4 RETURNING *`,
            [nama || old.nama, email || old.email, no_wa || old.no_wa, id_admin]
        );

        await client.query(
            "UPDATE users SET email = $1 WHERE id_users = $2",
            [email || old.email, old.id_users]
        );

        await client.query("COMMIT");
        res.json({ success: true, message: "Profil diperbarui", data: adminUpdate.rows[0] });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("UPDATE ERROR:", err);
        res.status(500).json({ success: false, message: "Gagal update profil" });
    } finally {
        client.release();
    }
};

/////////////////////////////////////////////////////////////////////////////////
// src/controllers/admincontrollers.js

const getDashboardStats = async (req, res) => { /* kode kamu */ };
const getAdminProfile = async (req, res) => { /* kode kamu */ };
const updateAdminProfile = async (req, res) => { /* kode kamu */ };

// --- TAMBAHKAN DUA FUNGSI INI ---
const createAnnouncement = async (req, res) => {
    try {
        // Logika simpan pengumuman
        res.status(201).json({ message: "Pengumuman berhasil dibuat" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllAnnouncements = async (req, res) => {
    try {
        // Logika ambil pengumuman
        res.status(200).json({ data: [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- PASTIKAN SEMUA DI-EXPORT DI SINI ---
module.exports = {
    getDashboardStats,
    getAdminProfile,
    updateAdminProfile,
    createAnnouncement, // Pastikan nama ini ada
    getAllAnnouncements  // Pastikan nama ini ada
};