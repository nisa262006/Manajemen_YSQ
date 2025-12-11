// ====================================================================
// ADMIN.JS – FINAL CLEAN VERSION
// ====================================================================

import { apiGet, apiPost, apiPut } from "./apiService.js";


// ====================================================================
// HELPER
// ====================================================================
const $ = (id) => document.getElementById(id);
const q = (s) => document.querySelector(s);

function esc(x) {
    if (!x) return "";
    return String(x).replace(/[&<>"]/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    }[c]));
}


// ====================================================================
// TOAST & NOTIFICATION
// ====================================================================
window.showNotification = function (message, type = "success") {
    const toast = $("notification-toast");
    if (!toast) return;

    toast.innerText = message;
    toast.style.background =
        type === "error"
            ? "#e74c3c"
            : type === "warning"
                ? "#f1c40f"
                : "#2ecc71";

    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
};

function toast(msg, type = "success") {
    let t = $("notification-toast");
    if (!t) return;

    t.innerText = msg;
    t.className = `toast-notification show ${type}`;
    setTimeout(() => t.classList.remove("show"), 2500);
}


// ====================================================================
// LOAD ADMIN PROFILE (GLOBAL) — FIXED
// ====================================================================
async function loadAdminProfile() {
    try {
        const res = await apiGet("/admin/profile/1");
        const p = res?.data ?? {};

        // Form
        $("profile-name-input").value = p.nama || "";
        $("profile-email-input").value = p.email || "";
        $("profile-phone-input").value = p.no_wa || "";

        // Header & card
        $("dashboard-admin-name").innerText = p.nama || "Admin";
        $("mini-card-name").innerText = p.nama || "-";
        $("mini-card-email").innerText = p.email || "-";

        // Avatar
        document
            .querySelectorAll(".profile-avatar-mini, .profile-avatar-large")
            .forEach((el) => {
                el.innerText = (p.nama || "A").charAt(0).toUpperCase();
            });

    } catch (err) {
        console.error("Gagal load profil:", err);
    }
}


// ====================================================================
// UPDATE ADMIN PROFILE — FIXED (TIDAK ADA DUPLIKASI LAGI)
// ====================================================================
document.addEventListener("click", async (e) => {

    if (e.target.id === "btn-simpan-profil") {

        const body = {
            nama: $("profile-name-input").value.trim(),
            email: $("profile-email-input").value.trim(),
            no_wa: $("profile-phone-input").value.trim(),
        };

        try {
            await apiPut("/admin/profile/1", body);
            toast("Profil berhasil diperbarui", "success");
            loadAdminProfile();

            $("popup-profile-setting").style.display = "none";

        } catch (err) {
            console.error("Gagal update profil:", err);
            toast("Gagal memperbarui profil", "error");
        }
    }

    if (e.target.id === "btn-cancel-profil" ||
        e.target.id === "btn-close-profil-x") {
        $("popup-profile-setting").style.display = "none";
    }
});


// ============================
// LOAD DASHBOARD DATA
// ============================
async function loadDashboard() {
    try {
        // -------- PROFILE ADMIN --------
        let me = await apiGet("/me");
        let profile = me?.profile ?? me ?? {};

        $("dashboard-admin-name").innerText = profile.nama || "Admin";
        $("mini-card-name").innerText = profile.nama || "-";
        $("mini-card-email").innerText = profile.email || "-";

        if ($("profile-name-input")) $("profile-name-input").value = profile.nama || "";
        if ($("profile-email-input")) $("profile-email-input").value = profile.email || "";
        if ($("profile-phone-input")) $("profile-phone-input").value = profile.no_wa || "";

        document.querySelectorAll(".profile-avatar-mini, .profile-avatar-large").forEach((el) => {
            el.innerText = (profile.nama || "A").charAt(0).toUpperCase();
        });

        // -------- PENDAFTAR --------
        let daftar = await apiGet("/pendaftar");
        let data = Array.isArray(daftar) ? daftar : daftar.data ?? [];
        window._pendaftarList = data;

        $("total_pendaftar").innerText = data.length;

        let tbody = $("table-pendaftar-body");
        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Belum ada pendaftar.</td></tr>`;
        } else {
            data.forEach((p, i) => {
                tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(p.nama)}</td>
                    <td>${esc(p.tempat_lahir)}</td>
                    <td>${p.tanggal_lahir ? new Date(p.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
                    <td>${esc(p.no_wa)}</td>
                    <td>
                ${
                    p.status === "ditolak"
                        ? `<span class="status-badge status-ditolak">Ditolak</span>`
                    : p.status === "diterima"
                        ? `<span class="status-badge status-diterima">Diterima</span>`
                    : `<button class="btn-detail" data-id="${p.id_pendaftar}">Lihat Detail</button>`
                }
            </td>

                </tr>`;
            });
        }

        // -------- KELAS / SANTRI --------
        // =============== TOTAL KELAS ===============
        let kelas = await apiGet("/kelas");
        let kelasList = Array.isArray(kelas) ? kelas : kelas.data ?? [];
        $("total_kelas").innerText = kelasList.length;

        // =============== TOTAL SANTRI ===============
        // Ambil SEMUA santri tanpa pagination
        let santriRes = await apiGet("/santri?page=1&limit=9999");
        let santriList = santriRes?.data ?? santriRes ?? [];

        let dewasa = santriList.filter(s => (s.kategori || "").toLowerCase() === "dewasa").length;
        let anak   = santriList.filter(s => (s.kategori || "").toLowerCase() === "anak").length;

        $("total_santri_dewasa").innerText = dewasa;
        $("total_santri_anak").innerText = anak;

        // -------- PENGAJAR --------
        let pengajar = await apiGet("/pengajar");
        let pengajarList = Array.isArray(pengajar) ? pengajar : pengajar.data ?? [];
        $("total_pengajar").innerText = pengajarList.length;

        console.log("Dashboard Loaded.");
    } catch (err) {
        console.error("Dashboard Error:", err);
    }
}

// ============================
// DETAIL POPUP (SAFE)
// ============================
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-detail")) {
        let id = e.target.dataset.id;
        let data = window._pendaftarList.find((x) => x.id_pendaftar == id);
        if (!data) return alert("Data tidak ditemukan");

        // Isi popup
        $("detail-name").innerText = data.nama;
        $("detail-tempat-lahir").innerText = data.tempat_lahir;
        $("detail-tanggal-lahir").innerText = data.tanggal_lahir ? new Date(data.tanggal_lahir).toLocaleDateString("id-ID") : "-";
        $("detail-whatsapp").innerText = data.no_wa;
        $("detail-email").innerText = data.email;

        let popup = $("popup-detail-pendaftar");
        popup.dataset.id = id;
        popup.style.display = "flex";
    }
});

// ============================
// TERIMA / TOLAK (FIX VERSION)
// ============================
document.addEventListener("click", async (e) => {
    let popup = $("popup-detail-pendaftar");
    let id = popup?.dataset?.id;

    // === Tombol DITERIMA ===
    if (e.target.classList.contains("btn-diterima")) {
        try {
            await apiPut(`/pendaftar/terima/${id}`);
            showNotification("Pendaftar diterima!", "success");
            popup.style.display = "none";
            loadDashboard();
        } catch (err) {
            console.error(err);
            showNotification("Gagal menerima pendaftar", "error");
        }
    }

    // === Tombol DITOLAK ===
    if (e.target.classList.contains("btn-ditolak")) {
        try {
            await apiPut(`/pendaftar/tolak/${id}`);
            showNotification("Pendaftar ditolak!", "warning");
            popup.style.display = "none";
            loadDashboard();
        } catch (err) {
            console.error(err);
            showNotification("Gagal menolak pendaftar", "error");
        }
    }
});


// ============================
// CLOSE POPUP
// ============================
document.addEventListener("click", (e) => {
    if (e.target.id === "close-detail-popup") {
        $("popup-detail-pendaftar").style.display = "none";
    }
});

// ============================
// PROFILE SAVE (REAL BACKEND CONNECTED)
// ============================
document.addEventListener("click", async (e) => {
    // SIMPAN PROFIL KE BACKEND
    if (e.target.id === "btn-simpan-profil") {
        let body = {
            nama: $("profile-name-input").value.trim(),
            email: $("profile-email-input").value.trim(),
            no_wa: $("profile-phone-input").value.trim()
        };

        try {
            let res = await apiPut("/profile", body);

            toast("Profil berhasil diperbarui", "success");

            // Update tampilan langsung
            $("dashboard-admin-name").innerText = body.nama;
            $("mini-card-name").innerText = body.nama;
            $("mini-card-email").innerText = body.email;

            // Update avatar
            document.querySelectorAll(".profile-avatar-mini, .profile-avatar-large")
                .forEach(el => {
                    el.innerText = body.nama.charAt(0).toUpperCase();
                });

            $("popup-profile-setting").style.display = "none";

        } catch (err) {
            console.error("Update Profile Error:", err);
            toast("Gagal memperbarui profil", "error");
        }
    }

    // TUTUP POPUP
    if (e.target.id === "btn-cancel-profil" || e.target.id === "btn-close-profil-x") {
        $("popup-profile-setting").style.display = "none";
    }
});


// ============================
// INIT
// ============================
document.addEventListener("DOMContentLoaded", () => {
    if (document.body.classList.contains("page-dashboard")) {
        loadDashboard();
        loadAdminProfile();
    }
});


// ===============================================================
//               🔥 TAMBAH KELAS — VERSI FINAL YSQ 🔥
// ===============================================================
if (document.body.classList.contains("page-tambah-kelas")) {

    // ===============================================================
    //                       🔥 LOAD KELAS YSQ 🔥
    // ===============================================================
    const selectKelas = document.getElementById("id_kelas");
    
    async function loadKelasYSQ() {
        try {
            const res = await apiGet("/kelas");
            const list = Array.isArray(res) ? res : [];
    
            renderDropdownKelas(list);
            window._allKelasYSQ = list;
    
        } catch (err) {
            console.error("Gagal load kelas:", err);
            selectKelas.innerHTML = `<option value="">Gagal memuat kelas</option>`;
        }
    }
    
    function renderDropdownKelas(list) {
        selectKelas.innerHTML = `<option value="">-- Pilih Kelas --</option>`;
        list.forEach(k => {
            selectKelas.innerHTML += `
                <option value="${k.id_kelas}">
                    ${k.nama_kelas} (${k.kategori})
                </option>
            `;
        });
    }
    
    loadKelasYSQ();
    
    
    // ===============================================================
    //                       🔥 LOAD SANTRI YSQ 🔥
    // ===============================================================
    const filterSelect = document.getElementById("kelas");
    const tableBody = document.querySelector(".data-table tbody");
    const selectAll = document.querySelector(".select-all-checkbox");
    
    async function loadSantriKelas() {
        try {
            const res = await apiGet("/santri?page=1&limit=9999");
            const list = res?.data ?? [];
    
            window._allSantri = list;
            renderSantri("semua");
    
        } catch (err) {
            console.error("Load Santri Error:", err);
        }
    }
    
    
    // ===============================================================
    //                🔥 RENDER SANTRI + FILTER 🔥
    // ===============================================================
    function renderSantri(filter) {
        tableBody.innerHTML = "";
    
        let list = window._allSantri || [];
    
        if (filter === "santri") list = list.filter(s => s.id_kelas != null);
        if (filter === "menunggu") list = list.filter(s => s.id_kelas == null);
    
        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center">Tidak ada data.</td></tr>`;
            return;
        }
    
        list.forEach(s => {
            const umur = s.tanggal_lahir ?
                (new Date().getFullYear() - new Date(s.tanggal_lahir).getFullYear()) : "-";
    
            tableBody.innerHTML += `
                <tr data-id="${s.id_santri}">
                    <td><input type="checkbox" class="row-check"></td>
                    <td>${new Date().toLocaleDateString("id-ID")}</td>
                    <td>${s.nis}</td>
                    <td>${s.nama}</td>
                    <td>${umur}</td>
                    <td><span class="status-badge status-aktif">Aktif</span></td>
                    <td>
                        <span class="status-badge ${s.id_kelas ? "status-santri" : "status-menunggu"}">
                            ${s.id_kelas ? "Santri" : "Menunggu"}
                        </span>
                    </td>
                </tr>
            `;
        });
    }
    
    // Event filter
    filterSelect.addEventListener("change", () => {
        renderSantri(filterSelect.value);
    });
    
    // Pilih semua checkbox
    selectAll.addEventListener("change", function () {
        const all = document.querySelectorAll(".row-check");
        all.forEach(cb => cb.checked = selectAll.checked);
    });
    
    loadSantriKelas();
    
    
    // ===============================================================
    //               🔥 VALIDASI KAPASITAS KELAS 🔥
    // ===============================================================
    function isKelasPenuh(idKelas, jumlahTambahan) {
        const kelas = window._allKelasYSQ.find(k => k.id_kelas == idKelas);
        if (!kelas) return false;
    
        const santriDiKelas = window._allSantri.filter(s => s.id_kelas == idKelas).length;
    
        return (santriDiKelas + jumlahTambahan) > kelas.kapasitas;
    }
    
    
    // ===============================================================
    //           🔥 SIMPAN SANTRI KE DALAM KELAS PILIHAN 🔥
    // ===============================================================
    document.getElementById("btn-simpan-kelas-selection").addEventListener("click", async () => {
        try {
            const idKelas = selectKelas.value;
    
            if (!idKelas) {
                showNotification("Pilih kelas terlebih dahulu!", "error");
                return;
            }
    
            const checked = [...document.querySelectorAll(".row-check:checked")];
            if (checked.length === 0) {
                showNotification("Pilih minimal satu santri!", "error");
                return;
            }
    
            // VALIDASI KAPASITAS
            if (isKelasPenuh(idKelas, checked.length)) {
                showNotification("Kelas penuh! Tidak bisa menambahkan santri.", "error");
                return;
            }
    
            // Kirim satu per satu
            for (let cb of checked) {
                const idSantri = cb.closest("tr").getAttribute("data-id");
    
                await apiPost(`/kelas/${idKelas}/santri`, {
                    id_santri: Number(idSantri)
                });
            }
    
            showNotification("Santri berhasil ditambahkan ke kelas!", "success");
    
            loadSantriKelas();   // Refresh tabel
    
        } catch (err) {
            console.error(err);
            showNotification("Gagal menyimpan data.", "error");
        }
    });
    
    } // END IF PAGE
    

// ====================================================================
//              🔥 TAMBAH SANTRI — ADMIN INPUT 🔥
// ====================================================================
function initTambahSiswa() {
    if (!document.body.classList.contains("page-tambah-siswa")) return;

    console.log("Tambah Siswa Page Active");

    const form = document.getElementById("form-tambah-siswa");
    if (!form) {
        console.error("FORM TAMBAH SISWA TIDAK DITEMUKAN");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let data = {
            nama: document.getElementById("nama_lengkap").value.trim(),
            email: document.getElementById("email").value.trim() || null,
            no_wa: document.getElementById("no_telpon").value.trim(),
            tempat_lahir: document.getElementById("tempat_lahir").value.trim(),
            tanggal_lahir: document.getElementById("tanggal_lahir").value,
            alamat: document.getElementById("alamat").value.trim() || null,
            nisn: document.getElementById("nisn").value.trim(),
            password: document.getElementById("password").value.trim(),
            kategori:
                document.querySelector("input[name='jenjang']:checked").value === "Dewasa"
                    ? "dewasa"
                    : "anak"
        };

        if (data.password !== document.getElementById("confirm_password").value) {
            toast("Password tidak sama", "cancel");
            return;
        }

        try {
            const res = await apiPost("/pendaftar/daftar", data);
            const newId = res?.data?.id_pendaftar;

            await apiPut(`/pendaftar/terima/${newId}`);

            toast("Santri berhasil ditambahkan", "success");

            setTimeout(() => {
                window.location.href = "Admin.html";
            }, 800);

        } catch (err) {
            console.error(err);
            toast("Gagal menambah siswa", "cancel");
        }
    });
}

// ====================================================================
//                  🔥 TAMBAH PENGAJAR — ADMIN 🔥
// ====================================================================
function initTambahPengajar() {
    if (!document.body.classList.contains("page-tambah-pengajar")) return;

    console.log("Tambah Pengajar Page Active");

    const form = document.getElementById("form-tambah-pengajar");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let data = {
            nama: document.getElementById("nama_lengkap").value.trim(),
            alamat: document.getElementById("alamat").value.trim(),
            tempat_lahir: document.getElementById("tempat_lahir").value.trim(),
            tanggal_lahir: document.getElementById("tanggal_lahir").value,
            umur: document.getElementById("umur").value,
            mapel: document.getElementById("kelas").value,
            email: document.getElementById("email").value.trim(),
            no_kontak: document.getElementById("no_telpon").value.trim(),
            password: document.getElementById("password").value.trim(),
            confirmPassword: document.getElementById("confirm_password").value.trim()
        };
        
        if (data.password !== data.confirmPassword) {
            toast("Password tidak sama", "cancel");
            return;
        }        

        try {
            await apiPost("/pengajar/tambah", data);

            toast("Pengajar berhasil ditambahkan", "success");

            setTimeout(() => {
                window.location.href = "Admin.html";
            }, 900);

        } catch (err) {
            console.error(err);
            toast("Gagal tambah pengajar", "cancel");
        }
    });
}

// ====================================================================
//        🔥 DAFTAR REGISTRASI — MENGAMBIL DATA & EXPORT LAPORAN
// ====================================================================
if (document.body.classList.contains("page-daftar-registrasi")) {
    
    console.log("Daftar Registrasi Page Active");

    const tbody = document.querySelector(".pendaftar-table-reg tbody");

    // =============================
    // LOAD DATA PENDAFTAR
    // =============================
    async function loadPendaftarRegistrasi() {
        try {
            let res = await apiGet("/pendaftar");
            let data = Array.isArray(res) ? res : res.data ?? [];

            window._pendaftarList = data;

            // Hitung summary
            const total = data.length;
            const pending = data.filter(p => p.status === "pending").length;
            const diterima = data.filter(p => p.status === "diterima").length;

            // Tentukan kuota → tentukan sendiri
            const totalKuota = 100;  
            const sisaKuota = totalKuota - diterima;

            // Isi ke dashboard kecil
            q(".reg-stats-cards .stat-card:nth-child(1) .stat-value").innerText = total;
            q(".reg-stats-cards .stat-card:nth-child(2) .stat-value").innerText = pending;
            q(".reg-stats-cards .stat-card:nth-child(3) .stat-value").innerText = diterima;
            q(".reg-stats-cards .stat-card:nth-child(4) .stat-value").innerText = sisaKuota;

            // Render ke tabel
            renderTableRegistrasi(data);

        } catch (err) {
            console.error("Load Registrasi Error:", err);
        }
    }


    // =============================
    // RENDER TABEL
    // =============================
    function renderTableRegistrasi(list) {
        tbody.innerHTML = "";

        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Tidak ada pendaftar.</td></tr>`;
            return;
        }

        list.forEach((p, i) => {
            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(p.nama)}</td>
                    <td>${esc(p.tempat_lahir)}</td>
                    <td>${p.tanggal_lahir ? new Date(p.tanggal_lahir).toLocaleDateString("id-ID") : "-"}</td>
                    <td>${esc(p.no_wa)}</td>
                    <td>${
                            p.status === "ditolak"
                                ? `<span class="status-badge status-ditolak">Ditolak</span>`
                            : p.status === "diterima"
                                ? `<span class="status-badge status-diterima">Diterima</span>`
                            : `<button class="btn-detail" data-id="${p.id_pendaftar}">Lihat Detail</button>`
                        }
                    </td>
                </tr>
            `;
        });
    }

   // ============================
    // DETAIL POPUP (SAFE)
    // ============================
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("btn-detail-reg")) {
            
            let id = e.target.dataset.id;
            let data = window._pendaftarList.find((x) => x.id_pendaftar == id);
            if (!data) return alert("Data tidak ditemukan");
    
            $("detail-name").innerText = data.nama;
            $("detail-tempat-lahir").innerText = data.tempat_lahir;
            $("detail-tanggal-lahir").innerText = data.tanggal_lahir ? new Date(data.tanggal_lahir).toLocaleDateString("id-ID") : "-";
            $("detail-whatsapp").innerText = data.no_wa;
            $("detail-email").innerText = data.email;
    
            let popup = $("popup-detail-pendaftar");
            popup.dataset.id = id;
    
            popup.style.display = "flex";
        }
    });
    
// ============================
// TERIMA / TOLAK (FINAL FIX)
// ============================
document.addEventListener("click", async (e) => {
    let popup = $("popup-detail-pendaftar");
    let id = popup.dataset.id;

    if (!id) return; // Jika ID belum di-set → abaikan

    // === Terima ===
    if (e.target.classList.contains("detail-diterima")) {
        try {
            await apiPut(`/pendaftar/terima/${id}`);
            showNotification("Pendaftar diterima!", "success");

            popup.style.display = "none";
            loadDashboard();

            if (window.location.pathname.includes("daftar_registrasi")) {
                loadPendaftarRegistrasi();
            }

        } catch (err) {
            console.error(err);
            showNotification("Gagal menerima pendaftar!", "error");
        }
    }

    // === Tolak ===
    if (e.target.classList.contains("detail-ditolak")) {
        try {
            await apiPut(`/pendaftar/tolak/${id}`);
            showNotification("Pendaftar ditolak!", "warning");

            popup.style.display = "none";
            loadDashboard();

            if (window.location.pathname.includes("daftar_registrasi")) {
                loadPendaftarRegistrasi();
            }

        } catch (err) {
            console.error(err);
            showNotification("Gagal menolak pendaftar!", "error");
        }
    }
});

// ============================
// CLOSE POPUP
// ============================
document.addEventListener("click", (e) => {
    if (e.target.id === "close-detail-popup") {
        $("popup-detail-pendaftar").style.display = "none";
    }
});

    // =============================
    // SEARCH
    // =============================
    const searchInput = q(".search-box input");

    searchInput.addEventListener("keyup", () => {
        const term = searchInput.value.toLowerCase();
        const filtered = window._pendaftarList.filter(p =>
            p.nama.toLowerCase().includes(term) ||
            p.tempat_lahir.toLowerCase().includes(term) ||
            p.no_wa.toLowerCase().includes(term)
        );

        renderTableRegistrasi(filtered);
    });

    // =============================
    // RESET PENDAFTARAN (konfirmasi)
    // =============================
    document.querySelector(".reset-btn").addEventListener("click", async () => {
        if (!confirm("Yakin ingin reset pendaftaran tahunan? Semua data akan hilang!")) return;

        try {
            await apiPut("/pendaftar/reset"); // kamu harus buat endpoint ini
            toast("Pendaftaran berhasil direset", "success");
            loadPendaftarRegistrasi();
        } catch (err) {
            console.error(err);
            toast("Gagal reset pendaftaran", "cancel");
        }
    });

// ============================================================
//              EXPORT EXCEL – PENDAFTAR REGISTRASI
// ============================================================
function exportPendaftarToCSV() {

    if (!window._pendaftarList || window._pendaftarList.length === 0) {
        return alert("Tidak ada data pendaftar untuk diekspor.");
    }

    const excelData = window._pendaftarList.map((p, i) => ({
        No: i + 1,
        "Nama Lengkap": p.nama,
        "Tempat Lahir": p.tempat_lahir,
        "Tanggal Lahir": p.tanggal_lahir
            ? new Date(p.tanggal_lahir).toLocaleDateString("id-ID")
            : "-",
        "Nomor WA": p.no_wa,
        Status: p.status
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws["!cols"] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendaftar");

    const bulan = new Date().toLocaleString("id-ID", { month: "long" });
    const tahun = new Date().getFullYear();
    const fileName = `Pendaftar_${bulan}_${tahun}.xlsx`;

    XLSX.writeFile(wb, fileName);
}

// ADD EVENT LISTENER ONLY IF BUTTON EXISTS
const exportBtn = document.querySelector(".export-btn");
if (exportBtn) {
    exportBtn.addEventListener("click", () => exportPendaftarToCSV());
}

    // LOAD SAAT MASUK
    loadPendaftarRegistrasi();
}

// ===================================================
// BAGIAN 1: DEFINISI FUNGSI GLOBAL (TOAST)
// ===================================================

function showToast(message, type) {
    // 🔣 TANDA: Fungsi Toast Notification
    const toast = document.getElementById('notification-toast');
    
    if (!toast) {
        console.error('Elemen Toast dengan ID "notification-toast" tidak ditemukan.');
        return;
    }

    toast.textContent = message;
    toast.classList.remove('success', 'cancel', 'show'); // Reset kelas lama
    toast.classList.add(type);
    
    // Tampilkan Toast
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); 
}


// ===================================================
// BAGIAN 2: LOGIKA UTAMA (POPUP SETTING PROFIL, FILTER, DLL)
// ===================================================

window.onload = function() {
    
    // ----------------------------------------------------
    // I. DEKLARASI VARIABEL DOM
    // ----------------------------------------------------
    
    // 🏷️ TAG: Variabel MODAL PROFILE SETTING
    const modalSetting = document.getElementById('popup-profile-setting');
    const btnOpenSetting = document.getElementById('btn-open-profil'); 
    const btnCloseXSetting = document.getElementById('btn-close-profil-x'); 
    const btnBatalProfil = document.getElementById('btn-cancel-profil');
    const btnSimpanProfil = document.getElementById('btn-simpan-profil');

    // 🏷️ TAG: Variabel SINKRONISASI INPUT/OUTPUT PROFIL
    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const phoneInput = document.getElementById('profile-phone-input');
    const avatarLarge = document.querySelector('.profile-setting-content .profile-avatar-large');
    const dashboardAdminName = document.getElementById('dashboard-admin-name');
    const miniAvatar = document.querySelector('#popup-profile-mini .profile-avatar-mini');
    const miniName = document.getElementById('mini-card-name');
    const miniEmail = document.getElementById('mini-card-email');
    const miniPhone = document.querySelector('#popup-profile-mini .profile-info-mini span:last-child');
    
    // 🏷️ TAG: Variabel FILTER
    const statusFilter = document.getElementById('kelas'); 
    
    // 🏷️ TAG: Variabel MINI PROFILE TOGGLE
    const adminIcon = document.getElementById('dashboard-admin-icon'); 
    const miniPopup = document.getElementById('popup-profile-mini');

    // 🏷️ TAG: Variabel MODAL DETAIL PENDAFTAR (DASHBOARD)
    const detailModal = document.getElementById("detail-pendaftar-modal"); 
    const detailCloseButton = detailModal ? detailModal.querySelector(".close-button") : null;
    const detailTerimaButton = detailModal ? detailModal.querySelector(".diterima") : null;
    const detailTolakButton = detailModal ? detailModal.querySelector(".ditolak") : null;

    // Selektor tabel yang benar: tabel dengan class 'dashboard-pendaftar-table'
    const pendaftarTableBody = document.querySelector('.dashboard-pendaftar-table tbody');
    
        // Selektor untuk tabel di halaman Daftar Registrasi
    const registrasiTableBody = document.querySelector('.class-list-table tbody');
    
    // Variabel untuk menyimpan data baris pendaftar yang sedang aktif
    let activeRowData = null;

    // 🏷️ TAG: Variabel RESET MODAL
    const btnOpenReset = document.querySelector('.reset-btn'); 
    const resetModal = document.getElementById('konfirmasi-reset-modal');
    const btnResetConfirm = document.getElementById('btn-reset-confirm');
    const btnResetCancel = document.getElementById('btn-reset-cancel');

    // 🏷️ TAG: Variabel MODAL EDIT JADWAL
    const editJadwalModal = document.getElementById('edit-jadwal-modal');
    const btnCloseEditX = document.getElementById('btn-close-edit-x');
    const btnEditCancel = document.getElementById('btn-edit-cancel');
    const btnEditSimpan = document.getElementById('btn-edit-simpan'); 
    const jadwalTableBody = document.querySelector('.schedule-list-table tbody');

    // 🏷️ TAG: Variabel MODAL TAMBAH JADWAL
const btnOpenTambahJadwal = document.querySelector('.add-schedule-btn');
const tambahJadwalModal = document.getElementById('tambah-jadwal-modal');
const btnCloseTambahX = document.getElementById('btn-close-tambah-x');
const btnTambahCancel = document.getElementById('btn-tambah-cancel');
const btnTambahSimpan = document.getElementById('btn-tambah-simpan');
const formTambahJadwal = document.getElementById('form-tambah-jadwal');

// 🏷️ TAG: Variabel MODAL TAMBAH KELAS
    const btnOpenTambahKelas = document.getElementById('btn-open-tambah-kelas'); // ID tombol pembuka di header Daftar Kelas
    const tambahKelasModal = document.getElementById('tambah-kelas-modal');
    const btnCloseTambahKelasX = document.getElementById('btn-close-tambah-kelas-x');
    const btnCancelKelas = document.getElementById('btn-cancel-kelas');
    const formTambahKelas = document.getElementById('form-tambah-kelas');

    // ----------------------------------------------------
    // II. DEFINISI FUNGSI PEMBANTU
    // ----------------------------------------------------

    function hideProfileModal() {
        if (modalSetting) { modalSetting.style.display = 'none'; }
    }

      /** 🏷️ TAG: FUNGSI BAGIAN TAMBAH JADWAL */

    function closeTambahJadwalModal() {
    // Ambil elemen DOM secara lokal (alternatif deklarasi global)
    const tambahJadwalModal = document.getElementById('tambah-jadwal-modal');
    const formTambahJadwal = document.getElementById('form-tambah-jadwal');
    
    if (tambahJadwalModal) tambahJadwalModal.style.display = 'none';
    if (formTambahJadwal) formTambahJadwal.reset();

      /** 🏷️ TAG: FUNGSI BAGIAN TAMBAH KELAS */
    function closeTambahKelasModal() {
        // Ambil elemen DOM secara lokal jika diperlukan, atau gunakan variabel global yang sudah dideklarasikan
        if (tambahKelasModal) tambahKelasModal.style.display = 'none';
        if (formTambahKelas) formTambahKelas.reset();
    }
    
}

    /** 🏷️ TAG: FUNGSI SINKRONISASI REAL-TIME */
    function syncProfileData() {
        if (!nameInput) return;
        
        const currentName = nameInput.value.trim();
        let firstLetter = '';
        if (currentName.length > 0) { firstLetter = currentName.charAt(0).toUpperCase(); }
        
        // Update Output Display
        if(avatarLarge) avatarLarge.textContent = firstLetter;
        if(miniAvatar) miniAvatar.textContent = firstLetter;
        if(dashboardAdminName) {
            const firstName = currentName.split(' ')[0];
            dashboardAdminName.textContent = firstName || 'Admin';
        }
        if(miniName) miniName.textContent = currentName;
        if(miniEmail && emailInput) miniEmail.textContent = emailInput.value.trim();
        if(miniPhone && phoneInput) miniPhone.textContent = phoneInput.value.trim();
    }
    
    /** 🏷️ TAG: FUNGSI FILTER STATUS */
    function initStatusFilter() {
        const tableBody = document.querySelector('.class-list-table tbody');
        
        if (!statusFilter || !tableBody) return;

        const applyFilter = () => {
            const selectedValue = statusFilter.value.toLowerCase();
            const rows = tableBody.getElementsByTagName('tr');

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const statusCell = row.cells[6]; // Kolom ke-7: Keterangan/Status
                
                if (statusCell) {
                    const badgeText = statusCell.textContent.trim().toLowerCase(); 
                    let shouldShow = false;
                    
                    if (selectedValue === 'semua') {
                        shouldShow = true;
                    } else if (selectedValue === 'menunggu') {
                        shouldShow = badgeText === 'menunggu'; 
                    } else if (selectedValue === 'santri') {
                        shouldShow = badgeText === 'santri';
                    }
                    
                    row.style.display = shouldShow ? '' : 'none';
                }
            }
        };

        statusFilter.addEventListener('change', applyFilter);
        applyFilter(); 
    }

    /** 🏷️ TAG: FUNGSI CHECKBOX ALL (Toggle semua checkbox) */
    function initSelectAllCheckbox() {
        const selectAllCheckbox = document.querySelector('.class-list-table thead .select-all-checkbox');
        const itemCheckboxes = document.querySelectorAll('.class-list-table tbody input[type="checkbox"]');

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                itemCheckboxes.forEach(checkbox => {
                    checkbox.checked = selectAllCheckbox.checked;
                });
            });
            
            // Opsional: Listener pada item checkbox untuk membatalkan 'select all'
            itemCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const allChecked = Array.from(itemCheckboxes).every(cb => cb.checked);
                    selectAllCheckbox.checked = allChecked;
                });
            });
        }
    }

    /* 🏷️ TAG: FUNGSI TANGGAL REAL-TIME */
    function updateRealTimeDate() {
    // 1. Dapatkan elemen display tanggal
    const dateDisplayElement = document.getElementById('current-date-display');
    
    if (!dateDisplayElement) {
        // Jika ID tidak ditemukan (misal di halaman yang berbeda), keluar dari fungsi
        return;
    }

    // 2. Logika untuk mendapatkan tanggal hari ini
    const now = new Date();
    
    // Opsi format untuk Hari, Tanggal, Bulan, Tahun
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    // Format tanggal ke bahasa Indonesia
    const formattedDate = now.toLocaleDateString('id-ID', options);

    // 3. Suntikkan tanggal yang sudah diformat ke HTML
    dateDisplayElement.textContent = formattedDate;

    // 4. Atur timer: Perbarui setiap 60 detik (untuk menghemat sumber daya)
    // Walaupun hari hanya berubah sekali sehari, timer memastikan tanggal selalu segar.
    setTimeout(updateRealTimeDate, 60000); 
}

/* 🏷️ TAG: FUNGSI DETAIL PENDAFTAR (FRONTEND MURNI) */

    /** Mengisi data ke dalam elemen-elemen di modal/popup. */
    function fillModalData(data) {
        document.getElementById('nama-lengkap-value').textContent = data.namaLengkap || 'N/A';
        // Email diisi data dummy karena tidak ada di tabel dashboard
        document.getElementById('email-value').textContent = data.email || 'email@sahabatquran.com'; 
        document.getElementById('tanggal-lahir-value').textContent = data.tanggalLahir || 'N/A';
        document.getElementById('tempat-lahir-value').textContent = data.tempatLahir || 'N/A';
        document.getElementById('nomor-whatsapp-value').textContent = data.nomorWhatsApp || 'N/A';
    }

    /** Fungsi untuk memuat detail pendaftar dari BARIS TABEL (DOM). */
    function loadPendaftarDetail(row) {
        // Ambil data dari sel (cell) di baris yang diklik
        // Struktur tabel: [0: No, 1: Nama Lengkap, 2: Tempat Lahir, 3: Tanggal Lahir, 4: Nomor WhatsApp, 5: Status Button]
        
        const dataForModal = {
        id: row.cells[5].querySelector('.btn-lihat-detail') ? row.cells[5].querySelector('.btn-lihat-detail').getAttribute('data-id') : 'N/A', 
        namaLengkap: row.cells[1] ? row.cells[1].textContent.trim() : 'Nama tidak ditemukan',
        tempatLahir: row.cells[2] ? row.cells[2].textContent.trim() : 'Tempat tidak ditemukan',
        tanggalLahir: row.cells[3] ? row.cells[3].textContent.trim() : 'Tanggal tidak ditemukan',
        nomorWhatsApp: row.cells[4] ? row.cells[4].textContent.trim() : 'No. HP tidak ditemukan',
        email: row.cells[1] ? `${row.cells[1].textContent.trim().split(' ')[0].toLowerCase()}@sahabatquran.com` : 'email@sahabatquran.com'
    };

    // ✅ PERBAIKAN: activeRowData menjadi objek yang menyimpan data dan elemen baris.
    activeRowData = {
        ...dataForModal, // Salin semua properti data
        rowElement: row // TAMBAHKAN REFERENSI ELEMEN BARIS DI SINI
    };
    
    fillModalData(dataForModal); // Tampilkan data ke modal
    if (detailModal) detailModal.style.display = "flex"; // Buka modal
    }

    /** Fungsi untuk menampilkan notifikasi saat tombol aksi diklik (tanpa backend). */
    function handleActionClick(status) {
        if (!activeRowData || !activeRowData.rowElement) {
            showToast("Gagal memproses. Data pendaftar tidak ditemukan.", "cancel");
            return;
        }
        
        // Ambil elemen baris yang sedang aktif dan sel status (Kolom ke-5 / indeks 4 di array cells)
        const row = activeRowData.rowElement;
        const statusCell = row.cells[5]; 
        
        // 1. Buat tombol status baru
        const newButton = document.createElement('button');
        newButton.classList.add('btn-lihat-detail');
        newButton.setAttribute('data-id', activeRowData.id);
        
        let statusClass = '';
        
        if (status === 'Diterima') {
            statusClass = 'status-diterima';
            newButton.textContent = 'Diterima';
        } else if (status === 'Ditolak') {
            statusClass = 'status-ditolak';
            newButton.textContent = 'Ditolak';
        } else {
            statusClass = 'status-detail'; 
            newButton.textContent = 'Lihat Detail';
        }
        
        newButton.classList.add(statusClass);
        
        // 2. Ganti konten di sel Status
        if (statusCell) {
            statusCell.innerHTML = '';
            statusCell.appendChild(newButton);
        }
        
        // 3. Tampilkan Notifikasi dan Tutup Modal
        showToast(`Pendaftar ${activeRowData.namaLengkap} di-status: ${status}.`, "success");
        if (detailModal) detailModal.style.display = "none";
    }
    
    // ===================================================
// 🏷️ TAG: C. LOGIKA MODAL TAMBAH KELAS (BARU)
// ===================================================

const KelasModalHandler = {
    // Properti untuk menyimpan referensi elemen DOM
    btnOpen: null, // Menggantikan btnTambahKelas
    modal: null,
    btnBatal: null,
    form: null,

    init: function() {
        // Mendapatkan referensi elemen DOM
        // Asumsi: Tombol "Tambah Kelas" menggunakan kelas yang sama dengan Tambah Pengajar: .add-teacher-btn
        this.btnOpen = document.querySelector('.add-teacher-btn'); 
        this.modal = document.getElementById('modalTambahKelas');
        this.btnBatal = document.getElementById('btnBatal');
        this.form = document.getElementById('formTambahKelas');

        if (this.btnOpen && this.modal && this.btnBatal && this.form) {
            this.setupEventListeners();
        } else {
            // Ini akan dieksekusi hanya jika berada di halaman NON-Daftar Kelas
            // console.warn("Modal Tambah Kelas tidak diinisialisasi: Elemen DOM tidak ditemukan.");
        }
    },

    setupEventListeners: function() {
        this.btnOpen.addEventListener('click', this.openModal.bind(this));
        this.btnBatal.addEventListener('click', this.closeModal.bind(this));
        window.addEventListener('click', this.handleOutsideClick.bind(this));
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    },

    openModal: function(e) {
        e.preventDefault();
        this.modal.style.display = 'flex';
    },

    closeModal: function() {
        this.modal.style.display = 'none';
        this.form.reset();
        showToast("Penambahan kelas dibatalkan.", "cancel");
    },

    handleOutsideClick: function(event) {
        if (event.target === this.modal) {
            this.closeModal();
        }
    },

    handleSubmit: function(e) {
        e.preventDefault();
        
        // --- LOGIKA PENGUMPULAN DATA ---
        const kelas = document.getElementById('kelas-tingkatan').value;
        // ... (ambil semua data input lainnya di sini) ...
        
        console.log(`Mengirim data kelas ${kelas} ke server...`);
        showToast(`Mengirim data kelas ${kelas} ke server...`, "success");
        
        // **********************************************
        // * Lakukan FUNGSI BACKEND (Fetch API/AJAX) di sini *
        // **********************************************
        
        // Tutup modal setelah submit
        this.modal.style.display = 'none';
        this.form.reset();
        // showToast("Kelas berhasil disimpan!", "success"); // Panggil ini setelah sukses API
    }
};

    // ----------------------------------------------------
    // III. IMPLEMENTASI EVENT LISTENERS
    // ----------------------------------------------------
    
    // --- SINKRONISASI INPUT (REAL-TIME) ---
    if (nameInput) { nameInput.addEventListener('input', syncProfileData); }
    if (emailInput) { emailInput.addEventListener('input', syncProfileData); }
    if (phoneInput) { phoneInput.addEventListener('input', syncProfileData); }
    syncProfileData(); 
    
    
    // 🏷️ TAG: A. LOGIKA MODAL PROFILE SETTING
    
    // BUKA MODAL (GLOBAL)
    document.addEventListener('click', function(e) {
        const targetBtn = e.target.closest('.footer-btn.setting');
        if (targetBtn) {
            e.preventDefault();
            modalSetting.style.display = 'flex';
        }
    });

    if (btnCloseXSetting) {
        btnCloseXSetting.addEventListener('click', function() {
            showToast("Pengaturan profil dibatalkan.", "cancel"); 
            hideProfileModal(); 
        });
    }
    
    if (btnBatalProfil) {
        btnBatalProfil.addEventListener('click', function() {
            showToast("Pengaturan profil dibatalkan.", "cancel"); 
            hideProfileModal(); 
        });
    }

    if (btnSimpanProfil) {
        btnSimpanProfil.addEventListener('click', function(e) {
            e.preventDefault(); 
            let saveSuccess = true; 
            if (saveSuccess) {
                showToast("Profil berhasil diperbarui!", "success");
                hideProfileModal(); 
            }
        });
    }

    // 🏷️ TAG: B. LOGIKA MODAL DETAIL PENDAFTAR (INTI PERMINTAAN)

// 1. Event Delegation untuk Tombol "Lihat Detail" di Halaman Registrasi
if (registrasiTableBody) {
    registrasiTableBody.addEventListener('click', (e) => {
        // Cek apakah elemen yang diklik adalah tombol Lihat Detail
        // (Ini akan menangkap tombol 'Ditolak', 'Diterima', dan 'Lihat Detail')
        if (e.target.tagName === 'BUTTON') { 
            
            const row = e.target.closest('tr'); 
            
            if (row) {
                // Panggil fungsi yang memuat data dari baris dan membuka modal
                loadPendaftarDetail(row);
            } else {
                console.error("Baris tabel (tr) tidak ditemukan di halaman registrasi.");
            }
        }
    });
}
    // 2. Event Delegation untuk Tombol "Lihat Detail" di Halaman Dashboard
    if (pendaftarTableBody) {
        pendaftarTableBody.addEventListener('click', (e) => {
            // Cek apakah elemen yang diklik adalah tombol Lihat Detail dengan class 'btn-lihat-detail'
            if (e.target.classList.contains('btn-lihat-detail')) {
                
                // Ambil baris tabel (<tr>) terdekat dari tombol yang diklik
                const row = e.target.closest('tr'); 
                
                if (row) {
                    loadPendaftarDetail(row);
                } else {
                    console.error("Baris tabel (tr) tidak ditemukan.");
                }
            }
        });
    }

    // 2. Tombol Aksi Verifikasi (Hanya Frontend Toast)
    if (detailTerimaButton) {
        detailTerimaButton.addEventListener('click', () => handleActionClick('Diterima'));
    }
    if (detailTolakButton) {
        detailTolakButton.addEventListener('click', () => handleActionClick('Ditolak'));
    }


    // 3. Menutup Modal Detail Pendaftar (Tombol X)
    if (detailCloseButton) {
        detailCloseButton.addEventListener('click', () => {
            if (detailModal) detailModal.style.display = "none";
        });
    }

    // TUTUP MODAL DETAIL PENDAFTAR JIKA KLIK DI LUAR
    if (detailModal && event.target === detailModal) { 
        detailModal.style.display = "none"; // Pastikan ini tetap 'none'
    }
    
    // 🏷️ TAG: C. LOGIKA TOGGLE MINI PROFILE & OVERLAY UMUM
    
    if (adminIcon && miniPopup) {
        adminIcon.addEventListener('click', function() {
            if (miniPopup.style.display === 'flex') {
                miniPopup.style.display = 'none';
            } else {
                miniPopup.style.display = 'flex';
            }
        });
    }

    // 🏷️ TAG: D. LOGIKA MODAL RESET PENDAFTARAN
// Buka Modal
if (btnOpenReset) {
    btnOpenReset.addEventListener('click', function() {
        if (resetModal) resetModal.style.display = 'flex';
    });
}

// Tutup Modal (Batalkan)
if (btnResetCancel) {
    btnResetCancel.addEventListener('click', function() {
        if (resetModal) resetModal.style.display = 'none';
        showToast("Proses reset dibatalkan.", "cancel");
    });
}

// Konfirmasi Reset (Contoh Aksi)
if (btnResetConfirm) {
    btnResetConfirm.addEventListener('click', function() {
        // Logika Reset Data Tahunan (Backend akan dipanggil di sini)
        
        if (resetModal) resetModal.style.display = 'none';
        showToast("Seluruh data pendaftaran berhasil di-reset!", "success");
        
        // TODO: Tambahkan kode untuk me-reload/memperbarui tabel data di sini
    });
}

// 🏷️ TAG: E. LOGIKA MODAL EDIT JADWAL
if (jadwalTableBody) {
    jadwalTableBody.addEventListener('click', (e) => {
        e.preventDefault();
        // Cek apakah yang diklik adalah ikon pensil (edit)
        // Asumsi: Ikon pensil berada di dalam <a> atau <button> dengan class 'edit-btn'
        const editButton = e.target.closest('.edit-btn'); 
        
        if (editButton || e.target.classList.contains('fa-pen-to-square')) {
            e.preventDefault();
            const row = e.target.closest('tr');
            
            if (row) {
                // Ambil data dasar dari baris (NO, Kelas, Pengajar, dst.)
                const kelasNama = row.cells[1].textContent.trim();
                
                // Isi data ke modal (minimal nama kelas)
                document.getElementById('kelas-nama-edit').textContent = kelasNama;
                
                // Tampilkan modal
                if (editJadwalModal) editJadwalModal.style.display = 'flex';
            }
        }
    });
}
        // SIMPAN PERUBAHAN JADWAL
if (btnEditSimpan) {
    btnEditSimpan.addEventListener('click', function(e) {
        e.preventDefault(); // Mencegah form submit default jika ada
        
        // Logika Simpan data (nanti diimplementasikan dengan backend)
        let saveSuccess = true;
        
        if (saveSuccess) {
            // Tutup Modal
            if (editJadwalModal) editJadwalModal.style.display = 'none';
            
            // Tampilkan Toast Sukses
            showToast("Perubahan jadwal berhasil disimpan!", "success");
            
            // TODO: Tambahkan kode untuk me-reload/memperbarui tabel data di sini
        }
    });
}
    // TUTUP MODAL EDIT JADWAL (Tombol X dan Batalkan)
// Tombol X
if (btnCloseEditX) {
    btnCloseEditX.addEventListener('click', () => {
        if (editJadwalModal) editJadwalModal.style.display = 'none';
    });
}

// Tombol Batalkan
if (btnEditCancel) {
    btnEditCancel.addEventListener('click', () => {
        if (editJadwalModal) editJadwalModal.style.display = 'none';
        showToast("Pengeditan jadwal dibatalkan.", "cancel");
    });
}


// 🏷️ TAG: F. LOGIKA MODAL TAMBAH JADWAL (Koreksi Total)

if (btnOpenTambahJadwal) {
    btnOpenTambahJadwal.addEventListener('click', function(e) {
        e.preventDefault();
        if (tambahJadwalModal) tambahJadwalModal.style.display = 'flex';
    });
}

// 1. TUTUP MODAL DENGAN TOMBOL X
if (btnCloseTambahX) {
    btnCloseTambahX.addEventListener('click', function() {
        closeTambahJadwalModal();
        showToast("Penambahan jadwal dibatalkan.", "cancel");
    });
}

// 2. TUTUP MODAL DENGAN TOMBOL BATALKAN
if (btnTambahCancel) {
    btnTambahCancel.addEventListener('click', function() {
        closeTambahJadwalModal();
        showToast("Penambahan jadwal dibatalkan.", "cancel");
    });
}

// 3. AKSI SIMPAN (TRIGGERED OLEH SUBMIT FORM)
if (formTambahJadwal) {
    formTambahJadwal.addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah form reload halaman

        // Tutup Modal
        closeTambahJadwalModal();
        
        // Notifikasi ke user bahwa data sedang diproses
        showToast("Mengirim data jadwal baru ke server...", "success");

        // TODO: Ambil data form dan panggil API backend untuk membuat jadwal baru di sini
    });
}

// 🏷️ TAG: G. LOGIKA MODAL TAMBAH KELAS

// 1. Buka Modal
if (btnOpenTambahKelas) {
    btnOpenTambahKelas.addEventListener('click', function(e) {
        e.preventDefault();
        if (tambahKelasModal) tambahKelasModal.style.display = 'flex';
    });
}

// 2. Tombol Tutup X
if (btnCloseTambahKelasX) {
    btnCloseTambahKelasX.addEventListener('click', function() {
        if (tambahKelasModal) tambahKelasModal.style.display = 'none'; // Langsung tutup
        if (formTambahKelas) formTambahKelas.reset();
        showToast("Penambahan kelas dibatalkan.", "cancel");
    });
}

// 3. Tombol Batalkan
if (btnCancelKelas) {
    btnCancelKelas.addEventListener('click', function() {
        if (tambahKelasModal) tambahKelasModal.style.display = 'none'; // Langsung tutup
        if (formTambahKelas) formTambahKelas.reset();
        showToast("Penambahan kelas dibatalkan.", "cancel");
    });
}

// 4. Aksi Simpan (Submit Form)
if (formTambahKelas) {
    formTambahKelas.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        // Logika Simpan ke Backend di sini
        
        if (tambahKelasModal) tambahKelasModal.style.display = 'none'; // Langsung tutup
        if (formTambahKelas) formTambahKelas.reset();

        showToast("Kelas baru berhasil ditambahkan!", "success");
    });
}

// 🏷️ TAG: H. LOGIKA LINK DETAIL PENGAJAR DARI TABEL
if (pengajarTableBody) {
    pengajarTableBody.addEventListener('click', (e) => {
        const editLink = e.target.closest('.edit-pengajar-link'); 
        
        if (editLink) {
            e.preventDefault(); 
            
            const pengajarId = editLink.getAttribute('data-pengajar-id');
            const targetPage = editLink.getAttribute('href'); 
            
            if (pengajarId && targetPage) {
                // Buat URL baru dengan Query Parameter
                const newUrl = `${targetPage}?id=${pengajarId}`;
                window.location.href = newUrl;
            }
        }
    });
}




    // Tutup modal jika klik di luar
    window.addEventListener('click', (event) => {
        if (event.target === modalSetting) { hideProfileModal(); }
        
        // TUTUP MINI POPUP JIKA KLIK DI LUAR
        if (miniPopup && event.target !== adminIcon && !adminIcon.contains(event.target) && !miniPopup.contains(event.target)) {
            miniPopup.style.display = 'none';
        }

        // Tutup Modal Reset
    if (resetModal && event.target === resetModal) {
        resetModal.style.display = "none";
        showToast("Proses reset dibatalkan.", "cancel");
    }

    if (editJadwalModal && event.target === editJadwalModal) {
        editJadwalModal.style.display = "none";
    }

    // Logika khusus untuk modal tambah jadwal
    if (tambahJadwalModal && event.target === tambahJadwalModal) {
        closeTambahJadwalModal();
        showToast("Penambahan jadwal dibatalkan.", "cancel");
    }

});
    

    // --- D. EKSEKUSI AKHIR ---
    
    // Panggil Filter Status Kelas
    initStatusFilter();
    
    // Panggil Checkbox All Toggle
    initSelectAllCheckbox(); 
    
    // JAMINAN MODAL TERTUTUP SAAT AWAL LOAD
    hideProfileModal();

    // PANGGILAN FUNGSI TANGGAL REAL-TIME
    updateRealTimeDate();

}; // Akhir dari window.onload
//   PANGGIL INIT FORM TAMBAH SISWA & PENGAJAR
// =============================================
document.addEventListener("DOMContentLoaded", () => {
    initTambahSiswa();
    initTambahPengajar();
});