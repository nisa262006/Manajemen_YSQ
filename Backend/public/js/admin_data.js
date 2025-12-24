import { apiGet, apiPut, apiDelete } from "./apiService.js";

/* ======================================================
   AUTH GUARD
====================================================== */
const token = localStorage.getItem("token");
if (!token) {
    alert("Silakan login terlebih dahulu");
    location.href = "/login";
    throw new Error("NO TOKEN");
}

console.log("🔥 admin_data.js loaded:", location.pathname);

/* ======================================================
   HELPERS
====================================================== */
const $ = (id) => document.getElementById(id);
const q = (sel) => document.querySelector(sel);

function esc(v) {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* ======================================================
   ROUTER
====================================================== */
const path = location.pathname;
if (path === "/dashboard/daftar-santri") initDaftarSantri();
if (path === "/dashboard/detail-santri") initDetailSantri();
if (path === "/dashboard/daftar-pengajar") initDaftarPengajar();
if (path === "/dashboard/detail-pengajar") initDetailPengajar();

/* ======================================================
   ================= DAFTAR SANTRI =================
====================================================== */
function initDaftarSantri() {

    const tbody = $("santriTableBody");
    const searchInput = q(".santri-search input");
    const kategoriSelect = $("kategori_santri");
    const kelasSelect = $("pilih_kelas_santri");
    const exportBtn = q(".export-santri-btn");

    let SANTRI = [];
    let KELAS = [];

    async function loadAll() {
        const santriRes = await apiGet("/santri?page=1&limit=1000");
        SANTRI = santriRes.data ?? santriRes ?? [];

        const kelasRes = await apiGet("/kelas");
        KELAS = kelasRes.data ?? kelasRes ?? [];

        renderKelas();
        renderTable(SANTRI);
    }

    function renderKelas() {
        kelasSelect.innerHTML = `<option value="">Semua Kelas</option>`;
        KELAS.forEach(k => {
            kelasSelect.innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;
        });
    }

    function renderTable(list) {
        tbody.innerHTML = "";

        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Tidak ada data</td></tr>`;
            return;
        }

        list.forEach((s, i) => {
            tbody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(s.nis)}</td>
                    <td>${esc(s.nama)}</td>
                    <td>${esc(s.nama_kelas ?? "-")}</td>
                    <td>${esc(s.user_email ?? s.email ?? "-")}</td>
                    <td>${esc(s.kategori)}</td>
                    <td>
                        <span class="status-badge ${s.status === "aktif" ? "status-aktif" : "status-nonaktif"}">
                            ${esc(s.status)}
                        </span>
                    </td>
                    <td class="action-icons">
                        <a href="/dashboard/detail-santri?id=${s.id_santri}" class="icon-btn edit-btn">
                            <i class="fas fa-pen"></i>
                        </a>
                        <button class="icon-btn delete-btn" data-id="${s.id_santri}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>`;
        });
    }

    function applyFilter() {
        let data = [...SANTRI];
        const key = searchInput.value.toLowerCase();
        const kat = kategoriSelect.value;
        const kel = kelasSelect.value;

        if (key) data = data.filter(s => s.nama?.toLowerCase().includes(key));
        if (kat) data = data.filter(s => s.kategori === kat);
        if (kel) data = data.filter(s => String(s.id_kelas) === kel);

        renderTable(data);
    }

    searchInput.onkeyup = applyFilter;
    kategoriSelect.onchange = applyFilter;
    kelasSelect.onchange = applyFilter;

    document.addEventListener("click", async (e) => {
        const del = e.target.closest(".delete-btn");
        if (!del) return;

        if (!confirm("Yakin hapus santri ini?")) return;
        await apiDelete(`/santri/${del.dataset.id}`);
        del.closest("tr").remove();
    });

    exportBtn.onclick = () => {
        const rows = SANTRI.map((s, i) => ({
            No: i + 1,
            NIS: s.nis,
            Nama: s.nama,
            Kelas: s.nama_kelas,
            Email: s.user_email ?? s.email,
            Kategori: s.kategori,
            Status: s.status
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Santri");
        XLSX.writeFile(wb, "data_santri.xlsx");
    };

    loadAll();
}


/* ======================================================
   DAFTAR PENGAJAR (FIXED: Tidak Dobel Kelas)
====================================================== */
function initDaftarPengajar() {
    const tbody = document.getElementById("pengajarTableBody");
    const searchInput = document.querySelector(".teacher-search-input input");
    const addBtn = document.querySelector(".add-teacher-btn");

    let DATA = [];

    async function load() {
        const res = await apiGet("/pengajar");
        DATA = res.data ?? res ?? [];
        render();
    }

    function render() {
        const key = searchInput.value.toLowerCase();
        
        // --- LOGIKA ANTI-DOBEL ---
        // Kita gunakan Map untuk memastikan 1 ID Pengajar hanya muncul 1 kali
        const uniqueData = [];
        const map = new Map();
        
        for (const item of DATA) {
            if (!map.has(item.id_pengajar)) {
                map.set(item.id_pengajar, true);
                uniqueData.push(item);
            }
        }

        const list = uniqueData.filter(p => p.nama?.toLowerCase().includes(key));

        tbody.innerHTML = list.length
            ? list.map((p, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.nip ?? "-"}</td>
                    <td>${p.nama}</td>
                    <td>${p.mapel ?? p.nama_kelas ?? "-"}</td> <td>${p.user_email ?? p.email ?? "-"}</td>
                    <td>
                        <span class="status-badge ${p.status === "aktif" ? "status-aktif" : "status-nonaktif"}">
                            ${p.status}
                        </span>
                    </td>
                    <td class="action-icons">
                        <a href="/dashboard/detail-pengajar?id=${p.id_pengajar}" class="icon-btn edit-btn">
                            <i class="fas fa-pen"></i>
                        </a>
                        <button class="icon-btn delete-btn" data-id="${p.id_pengajar}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join("")
            : `<tr><td colspan="7">Tidak ada data</td></tr>`;
    }

    // ... sisanya tetap sama ...

    document.addEventListener("click", async (e) => {
        const del = e.target.closest(".delete-btn");
        if (!del) return;

        if (!confirm("Hapus pengajar ini?")) return;
        await apiDelete(`/pengajar/${del.dataset.id}`);
        load();
    });

    searchInput.addEventListener("keyup", render);

    load();
}

/* ================= DETAIL SANTRI ================= */
function initDetailSantri() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return location.href = "/dashboard/daftar-santri";

    const f = {
        nis: $("nisn"),
        nama: $("nama-lengkap"),
        alamat: $("alamat"),
        tempat: $("tempat-lahir"),
        tanggal: $("tanggal-lahir"),
        wa: $("no-telepon"),
        kategori: $("kategori-santri"),
        username: $("username"),
        email: $("email"),
        status: $("status-akun"),
        daftar: $("tanggal-terdaftar")
    };

    const btnEdit = $("btn-edit-santri");
    const btnSave = $("btn-simpan-santri-footer");

    function setDisabled(state) {
        Object.values(f).forEach(i => i && (i.disabled = state));
        btnSave.style.display = state ? "none" : "inline-block";
    }

    async function load() {
        try {
            const res = await apiGet(`/santri/${id}`);
            const s = res.data ?? res;
    
            f.nis.value = s.nis ?? "";
            f.nama.value = s.nama ?? "";
            f.alamat.value = s.alamat ?? "";
            f.tempat.value = s.tempat_lahir ?? "";
            f.tanggal.value = s.tanggal_lahir?.split("T")[0] ?? "";
            f.wa.value = s.no_wa ?? "";
            f.kategori.value = s.kategori ?? "";
            f.username.value = s.username ?? "-";
            f.email.value = s.user_email ?? s.email ?? "";
            f.status.value = s.status ?? "nonaktif";
    
            // ✅ Aman: jika tanggal_terdaftar null
            function formatDateForInput(dateString) {
                if (!dateString) return "";
                const d = new Date(dateString);
                // Tambahan cek valid date
                if (isNaN(d.getTime())) return "";
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
            
            f.daftar.value = formatDateForInput(s.tanggal_terdaftar);            
    
        } catch (err) {
            console.error("Gagal memuat data santri", err);
            alert("Gagal memuat data santri");
        }
    }
    

    btnEdit.onclick = () => setDisabled(false);

    btnSave.onclick = async () => {
        try {
            await apiPut(`/santri/${id}`, {
                nama: f.nama.value,
                alamat: f.alamat.value,
                tempat_lahir: f.tempat.value,
                tanggal_lahir: f.tanggal.value || null,
                no_wa: f.wa.value,
                kategori: f.kategori.value,
                email: f.email.value,
                status: f.status.value
            });
            alert("Data santri diperbarui");
            location.href = "/dashboard/daftar-santri";
        } catch (err) {
            console.error("Update santri error:", err);
            alert("Gagal memperbarui data santri");
        }
    };

    setDisabled(true);
    load();
}

/* ================= DETAIL PENGAJAR ================= */
function initDetailPengajar() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return location.href = "/dashboard/daftar-pengajar";

    const f = {
        nip: $("pengajar-nip"),
        nama: $("pengajar-nama"),
        alamat: $("pengajar-alamat"),
        tanggal: $("pengajar-tanggal-lahir"),
        telp: $("pengajar-no-telepon"),
        kelas: $("pengajar-kelas"),
        username: $("pengajar-username"),
        email: $("pengajar-email"),
        status: $("pengajar-status"),
        daftar: $("pengajar-tanggal-terdaftar")
    };

    const btnEdit = $("btn-edit-pengajar");
    const btnSave = $("btn-simpan-pengajar-footer");

    function setDisabled(state) {
        Object.values(f).forEach(i => i && (i.disabled = state));
        btnSave.style.display = state ? "none" : "inline-block";
    }

    async function load() {
        try {
            const res = await apiGet(`/pengajar/${id}`);
            const p = res.data ?? res;

            f.nip.value = p.nip ?? "-";
            f.nama.value = p.nama ?? "-";
            f.alamat.value = p.alamat ?? "-";
            f.tanggal.value = p.tanggal_lahir ? p.tanggal_lahir.split("T")[0] : "";
            f.telp.value = p.no_kontak ?? "";
            f.username.value = p.username ?? "-";
            f.email.value = p.user_email ?? p.email ?? "";
            f.status.value = p.status ?? "aktif";
            f.daftar.value = p.tanggal_terdaftar ? new Date(p.tanggal_terdaftar).toISOString().split("T")[0] : "-";
        } catch (err) {
            console.error("Load pengajar error:", err);
            alert("Gagal memuat data pengajar");
        }
    }

    btnEdit.onclick = () => setDisabled(false);

    btnSave.onclick = async () => {
        try {
            await apiPut(`/pengajar/${id}`, {
                nama: f.nama.value,
                alamat: f.alamat.value,
                tanggal_lahir: f.tanggal.value || null,
                no_kontak: f.telp.value,
                email: f.email.value,
                status: f.status.value
            });
            alert("Data pengajar diperbarui");
            location.href = "/dashboard/daftar-pengajar";
        } catch (err) {
            console.error("Update pengajar error:", err);
            alert("Gagal memperbarui data pengajar");
        }
    };

    setDisabled(true);
    load();
}



// ====================================================================
// admin.js — global
// ====================================================================
window._adminProfile = null; // simpan profile global

export async function loadAdminProfile() {
    try {
        // Ambil data admin
        const me = await apiGet("/me");
        if (!me?.profile) return;

        const idAdmin = me.profile.id_admin;

        // Ambil detail profile
        const res = await apiGet(`/admin/profile/${idAdmin}`);
        const p = res.data;

        window._adminProfile = p; // simpan global

        // Header & mini card (jika ada)
        if ($("dashboard-admin-name")) $("dashboard-admin-name").innerText = p.nama || "Admin";
        if ($("mini-card-name")) $("mini-card-name").innerText = p.nama || "-";
        if ($("mini-card-email")) $("mini-card-email").innerText = p.email || "-";

        // Avatar
        document.querySelectorAll(".profile-avatar-mini, .profile-avatar-large")
            .forEach(el => { el.innerText = (p.nama || "A").charAt(0).toUpperCase(); });

        // Popup inputs (cek apakah ada)
        if ($("profile-name-input")) $("profile-name-input").value = p.nama || "";
        if ($("profile-email-input")) $("profile-email-input").value = p.email || "";
        if ($("profile-phone-input")) $("profile-phone-input").value = p.no_wa || "";

        // simpan idAdmin untuk update
        if ($("btn-simpan-profil")) $("btn-simpan-profil").dataset.idAdmin = idAdmin;

    } catch (err) {
        console.error("Gagal load profil:", err);
        toast("Gagal memuat profil admin", "error");
    }
}

// Tombol simpan popup (jika ada)
if ($("btn-simpan-profil")) {
    $("btn-simpan-profil").onclick = async () => {
        const idAdmin = $("btn-simpan-profil").dataset.idAdmin;
        const payload = {
            nama: $("profile-name-input")?.value || "",
            email: $("profile-email-input")?.value || "",
            no_wa: $("profile-phone-input")?.value || ""
        };
        try {
            const res = await apiPut(`/admin/profile/${idAdmin}`, payload);
            toast(res.message || "Profil berhasil diperbarui", "success");
            $("popup-profile-setting").style.display = "none";
            loadAdminProfile(); // refresh data global
        } catch (err) {
            console.error(err);
            toast("Gagal memperbarui profil", "error");
        }
    };
}

// Tombol close / cancel popup
if ($("btn-close-profil-x"))
    $("btn-close-profil-x").onclick = () =>
        $("popup-profile-setting").classList.remove("active");
if ($("btn-cancel-profil")) $("btn-cancel-profil").onclick = () => $("popup-profile-setting").style.display = "none";

// Load awal
document.addEventListener("DOMContentLoaded", () => loadAdminProfile());

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