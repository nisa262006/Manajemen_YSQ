// ============================
// admin.js CLEAN VERSION
// ============================
import { apiGet, apiPost, apiPut } from "./apiService.js";

// Mini helper
const $ = (id) => document.getElementById(id);
const q = (s) => document.querySelector(s);

// ============================
// SAFE TOAST (no duplicate)
// ============================
function toast(msg, type = "success") {
    let t = $("notification-toast");
    if (!t) return;

    t.innerText = msg;
    t.className = `toast-notification show ${type}`;

    setTimeout(() => {
        t.classList.remove("show");
    }, 2500);
}

// ============================
// Escape HTML
// ============================
function esc(x) {
    if (!x) return "";
    return String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

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
// TERIMA / TOLAK
// ============================
document.addEventListener("click", async (e) => {
    let popup = $("popup-detail-pendaftar");
    let id = popup?.dataset?.id;

    if (e.target.classList.contains("detail-diterima")) {
        await apiPut(`/pendaftar/terima/${id}`);
        toast("Pendaftar diterima", "success");
        popup.style.display = "none";
        loadDashboard();
    }

    if (e.target.classList.contains("detail-ditolak")) {
        await apiPut(`/pendaftar/tolak/${id}`);
        toast("Pendaftar ditolak", "cancel");
        popup.style.display = "none";
        loadDashboard();
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
// PROFILE SAVE (LOCAL ONLY)
// ============================
document.addEventListener("click", (e) => {
    if (e.target.id === "btn-simpan-profil") {
        $("dashboard-admin-name").innerText = $("profile-name-input").value;
        $("mini-card-name").innerText = $("profile-name-input").value;
        $("mini-card-email").innerText = $("profile-email-input").value;

        $("popup-profile-setting").style.display = "none";
        toast("Profil diperbarui", "success");
    }

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
    }
});

// ===============================================================
//              🔥 TAMBAH KELAS — FITUR BARU 🔥
// ===============================================================


// HANYA AKTIF DI HALAMAN tambah_kelas.html
if (document.body.classList.contains("page-tambah-kelas")) {

    console.log("Tambah Kelas Mode Active");

    const filterSelect = $("kelas");
    const tableBody = document.querySelector(".data-table tbody");

    // Ambil semua santri dari backend
    async function loadSantriKelas() {
        try {
            let res = await apiGet("/santri?page=1&limit=9999");
            let list = res?.data ?? res ?? [];

            window._allSantri = list;

            renderSantri("semua");

        } catch (err) {
            console.error("Load Santri Error:", err);
        }
    }

    // Render tabel
    function renderSantri(filter) {
        if (!tableBody) return;

        tableBody.innerHTML = "";

        let data = window._allSantri || [];

        // FILTER
        if (filter === "santri") {
            data = data.filter(s => s.id_kelas != null);
        }
        if (filter === "menunggu") {
            data = data.filter(s => s.id_kelas == null);
        }

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center">Tidak ada data.</td></tr>`;
            return;
        }

        data.forEach((s) => {
            let umur = "-";
            if (s.tanggal_lahir) {
                let birth = new Date(s.tanggal_lahir);
                umur = new Date().getFullYear() - birth.getFullYear();
            }

            tableBody.innerHTML += `
                <tr>
                    <td><input type="checkbox"></td>
                    <td>${new Date().toLocaleDateString("id-ID")}</td>
                    <td>${esc(s.nis)}</td>
                    <td>${esc(s.nama)}</td>
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

    // Event Filter
    if (filterSelect) {
        filterSelect.addEventListener("change", () => {
            renderSantri(filterSelect.value);
        });
    }

    // LOAD SAAT MASUK HALAMAN
    loadSantriKelas();
}

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
            password: document.getElementById("password").value.trim()
        };

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
    // TERIMA / TOLAK
    // ============================
    document.addEventListener("click", async (e) => {
        let popup = $("popup-detail-pendaftar");
        let id = popup?.dataset?.id;

        if (e.target.classList.contains("detail-diterima")) {
            await apiPut(`/pendaftar/terima/${id}`);
            toast("Pendaftar diterima", "success");
            popup.style.display = "none";
            loadDashboard();
        }

        if (e.target.classList.contains("detail-ditolak")) {
            await apiPut(`/pendaftar/tolak/${id}`);
            toast("Pendaftar ditolak", "cancel");
            popup.style.display = "none";
            loadDashboard();
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
    
    // 🏷️ TAG: Variabel MODAL DETAIL PENDAFTAR
    this.detailPopup = document.getElementById('popup-detail-pendaftar');
    this.detailAcceptBtn = document.querySelector('.action-btn-popup.detail-diterima');
    this.detailRejectBtn = document.querySelector('.action-btn-popup.detail-ditolak');
    this.profileNameInput = document.getElementById('profile-name-input');


    // ----------------------------------------------------
    // II. DEFINISI FUNGSI PEMBANTU
    // ----------------------------------------------------

    function hideProfileModal() {
        if (modalSetting) { modalSetting.style.display = 'none'; }
    }
    
    // ❌ FUNGSI hideKelasModal DIHAPUS (Karena modal kelas dihapus)

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
    
    window.addEventListener('click', (event) => {
        if (event.target === modalSetting) { hideProfileModal(); }
        // ❌ Logika tutup modalTambahKelas DIHAPUS
        
        // TUTUP MINI POPUP JIKA KLIK DI LUAR
        if (miniPopup && event.target !== adminIcon && !adminIcon.contains(event.target) && !miniPopup.contains(event.target)) {
            miniPopup.style.display = 'none';
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