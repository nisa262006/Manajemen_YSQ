import { apiGet, apiPut, apiDelete } from "./apiService.js";

// ============================
// DAFTAR SANTRI
// ============================
if (window.location.pathname.includes("daftar_santri.html")) {

    console.log("Daftar Santri Page Active");

    const kelasSelect = document.getElementById("pilih_kelas_santri");
    const kategoriSelect = document.getElementById("kategori_santri");
    const searchInput = document.querySelector(".santri-search input");
    const tableBody = document.querySelector(".santri-list-table tbody");
    const exportBtn = document.querySelector(".export-santri-btn");
    

    let allSantri = [];
    let allKelas = [];

    // ==========================================
    // LOAD DATA SANTRI
    // ==========================================
    async function loadSantri() {
        try {
            let res = await apiGet("/santri?page=1&limit=5000");
            allSantri = res?.data ?? [];

            renderSantri();

        } catch (err) {
            console.error("❌ Error load santri:", err);
        }
    }

    // ==========================================
    // LOAD DATA KELAS
    // ==========================================
    async function loadKelas() {
        try {
            let res = await apiGet("/kelas");
            allKelas = Array.isArray(res) ? res : res.data ?? [];

            kelasSelect.innerHTML = `<option value="">Semua Kelas</option>`;

            allKelas.forEach(k => {
                kelasSelect.innerHTML += `
                    <option value="${k.nama_kelas}">${k.nama_kelas}</option>
                `;
            });

        } catch (err) {
            console.error("❌ Error load kelas:", err);
        }
    }

    // ==========================================
    // RENDER TABEL SANTRI
    // ==========================================
    function renderSantri() {

        const keyword = searchInput.value.toLowerCase();
        const kategori = kategoriSelect.value;
        const kelasDipilih = kelasSelect.value;

        let filtered = [...allSantri];

        // Filter kategori
        if (kategori) {
            filtered = filtered.filter(s => (s.kategori || "").toLowerCase() === kategori);
        }

        // Filter kelas
        if (kelasDipilih) {
            filtered = filtered.filter(s => (s.nama_kelas || "").toLowerCase() === kelasDipilih.toLowerCase());
        }

        // Search nama
        if (keyword.length > 0) {
            filtered = filtered.filter(s => s.nama.toLowerCase().includes(keyword));
        }

        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="8" style="text-align:center">Tidak ada data santri.</td></tr>
            `;
            return;
        }

        filtered.forEach((s, i) => {
            tableBody.innerHTML += `
                <tr>
                    <td>${i + 1}.</td>
                    <td>${s.nis}</td>
                    <td>${s.nama}</td>
                    <td>${s.nama_kelas ?? "-"}</td>
                    <td>${s.email ?? "-"}</td>
                    <td>
                        <span class="status-badge status-${s.kategori === "anak" ? "anak" : "dewasa"}">
                            ${s.kategori}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge status-aktif">${s.status}</span>
                    </td>
                    <td class="action-icons">
                        <button class="icon-btn edit-btn" data-id="${s.id_santri}">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="icon-btn delete-btn" data-id="${s.id_santri}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // ==========================================
    // KLIK EDIT → BUKA DETAIL SANTRI
    // ==========================================
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".edit-btn");

        if (btn) {
            const id = btn.dataset.id;

            if (!id) {
                console.error("❌ ID santri tidak ditemukan!");
                return;
            }

            // Redirect ke halaman detail
            window.location.href = `detail_santri.html?id=${id}`;
        }
    });

    // ==========================================
    // DELETE SANTRI
    // ==========================================
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".delete-btn");
        if (!btn) return;
    
        const id = btn.dataset.id;
    
        if (!confirm("Yakin ingin menghapus pengajar ini?")) return;
    
        try {
            await apiDelete(`/santri/${id}`);
    
            // HAPUS ROW LANGSUNG DARI TABLE
            const row = btn.closest("tr");
            if (row) row.remove();
    
            toast("santri berhasil dihapus", "success");
    
        } catch (err) {
            console.error(err);
            toast("Gagal menghapus santri", "cancel");
        }
    });

    // ==========================================
    // EXPORT SANTRI KE EXCEL
    // ==========================================
    exportBtn.addEventListener("click", () => {
        exportSantriExcel();
    });

    function exportSantriExcel() {
        const exportData = allSantri.map((s, i) => ({
            No: i + 1,
            NIM: s.nis,
            Nama: s.nama,
            Kelas: s.nama_kelas ?? "-",
            Email: s.email ?? "-",
            Kategori: s.kategori,
            Status: s.status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);

        ws["!cols"] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 25 },
            { wch: 12 },
            { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Daftar Santri");

        const bulan = new Date().toLocaleString("id-ID", { month: "long" });
        const tahun = new Date().getFullYear();

        XLSX.writeFile(wb, `Daftar_Santri_${bulan}_${tahun}.xlsx`);
    }

    // ==========================================
    // EVENT LISTENER FILTER
    // ==========================================
    kategoriSelect.addEventListener("change", renderSantri);
    kelasSelect.addEventListener("change", renderSantri);
    searchInput.addEventListener("keyup", renderSantri);

    // ==========================================
    // INIT
    // ==========================================
    loadKelas();
    loadSantri();
}

/* ============================================================
   DETAIL SANTRI (detail_santri.html)
============================================================ */
if (window.location.pathname.toLowerCase().includes("detail_santri.html")) {

    const params = new URLSearchParams(window.location.search);
    const santriId = params.get("id");

    if (!santriId) {
        alert("ID Santri tidak ditemukan!");
        window.location.href = "daftar_santri.html";
    }

    const formEl = {
        nis: document.getElementById("nisn"),
        nama: document.getElementById("nama-lengkap"),
        alamat: document.getElementById("alamat"),
        tanggal_lahir: document.getElementById("tanggal-lahir"),
        tempat_lahir: document.getElementById("tempat-lahir"),
        telepon: document.getElementById("no-telepon"),
        kelas: document.getElementById("kelas-santri"),
        username: document.getElementById("username"),
        email: document.getElementById("email"),
        status: document.getElementById("status-akun"),
        tanggal_daftar: document.getElementById("tanggal-terdaftar")
    };

    const btnEdit = document.getElementById("btn-edit-santri");
    const btnSaveBottom = document.getElementById("btn-simpan-santri-footer");

    // =============================
    // DISABLE / ENABLE INPUT
    // =============================
    function setDisabled(state) {
        Object.values(formEl).forEach(el => el.disabled = state);
        btnSaveBottom.style.display = state ? "none" : "inline-block";
    }

    setDisabled(true);

    // =============================
    // LOAD DETAIL
    // =============================
    async function loadDetailSantri() {
        try {
            const res = await apiGet(`/santri/${santriId}`);
            const s = res.data;

            formEl.nis.value = s.nis ?? "";
            formEl.nama.value = s.nama ?? "";
            formEl.alamat.value = s.alamat ?? "";
            formEl.tempat_lahir.value = s.tempat_lahir ?? "";
            formEl.tanggal_lahir.value = s.tanggal_lahir ? s.tanggal_lahir.split("T")[0] : "";
            formEl.telepon.value = s.no_wa ?? "";
            formEl.kelas.value = s.kategori ?? "";
            formEl.username.value = s.username ?? "";
            formEl.email.value = s.user_email ?? s.email ?? "";
            formEl.status.value = s.status ?? "aktif";
            formEl.tanggal_daftar.value = s.tanggal_terdaftar ? s.tanggal_terdaftar.split("T")[0] : "";

        } catch (err) {
            console.error("Gagal load santri:", err);
            alert("Gagal memuat data santri");
        }
    }

    btnEdit.addEventListener("click", () => setDisabled(false));

    // =============================
    // SIMPAN / UPDATE SANTRI
    // =============================
    async function saveSantri() {

        const payload = {
            nis: formEl.nis.value,
            nama: formEl.nama.value,
            kategori: formEl.kelas.value,
            no_wa: formEl.telepon.value,
            email: formEl.email.value,
            user_email: formEl.email.value,
            tempat_lahir: formEl.tempat_lahir.value,
            tanggal_lahir: formEl.tanggal_lahir.value,
            username: formEl.username.value
        };

        try {
            await apiPut(`/santri/${santriId}`, payload);

            // Langsung pindah halaman tanpa notif
            window.location.href = "daftar_santri.html";

        } catch (err) {
            console.error("Gagal update santri:", err);
        }
    }

    btnSaveBottom.addEventListener("click", saveSantri);

    loadDetailSantri();
}


// ============================
// DAFTAR PENGAJAR
// ============================
if (window.location.pathname.includes("daftar_pengajar.html")) {

    console.log("Daftar Pengajar Page Active");

    const searchInput = document.querySelector(".teacher-search-input input");
    const tableBody = document.querySelector(".teacher-list-table tbody");
    const addTeacherBtn = document.querySelector(".add-teacher-btn");

    let allPengajar = [];

    // ======================================
    // LOAD DATA PENGAJAR
    // ======================================
    async function loadPengajar() {
        try {
            let res = await apiGet("/pengajar");
            allPengajar = res?.data ?? res ?? [];

            renderPengajar();
        } catch (err) {
            console.error("❌ Error load pengajar:", err);
            toast("Gagal memuat data pengajar", "cancel");
        }
    }

    // ======================================
    // RENDER TABEL PENGAJAR
    // ======================================
    function renderPengajar() {
        const keyword = searchInput.value.toLowerCase();

        let filtered = [...allPengajar];

        if (keyword.length > 0) {
            filtered = filtered.filter(p =>
                p.nama?.toLowerCase().includes(keyword)
            );
        }

        tableBody.innerHTML = "";

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center">Tidak ada data pengajar.</td>
                </tr>
            `;
            return;
        }

        filtered.forEach((p, i) => {
            tableBody.innerHTML += `
                <tr>
                    <td>${i + 1}.</td>
                    <td>${p.nip ?? "-"}</td>
                    <td>${p.nama ?? "-"}</td>
                    <td>${p.mapel ?? "-"}</td>
                    <td>${p.email ?? "-"}</td>
                    <td>
                        <span class="status-badge status-${p.status === "aktif" ? "aktif" : "nonaktif"}">
                            ${p.status ?? "Aktif"}
                        </span>
                    </td>
                    <td class="action-icons">
        
                        <!-- FIX UTAMA -->
                        <a href="detail_pengajar.html?id=${p.id_pengajar}" 
                           class="icon-btn edit-btn">
                            <i class="fas fa-pen"></i>
                        </a>
        
                        <button class="icon-btn delete-btn" data-id="${p.id_pengajar}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });        
    }

    // ======================================
    // DELETE PENGAJAR
    // ======================================
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".delete-btn");
        if (!btn) return;
    
        const id = btn.dataset.id;
    
        if (!confirm("Yakin ingin menghapus pengajar ini?")) return;
    
        try {
            await apiDelete(`/pengajar/${id}`);
    
            // HAPUS ROW LANGSUNG DARI TABLE
            const row = btn.closest("tr");
            if (row) row.remove();
    
            toast("Pengajar berhasil dihapus", "success");
    
        } catch (err) {
            console.error(err);
            toast("Gagal menghapus pengajar", "cancel");
        }
    });
    

    // ======================================
    // BUTTON → TAMBAH PENGAJAR
    // ======================================
    addTeacherBtn.addEventListener("click", () => {
        window.location.href = "tambah_pengajar.html";
    });

    // =====================================
// FORM TAMBAH PENGAJAR → BACKEND
// =====================================
if (window.location.pathname.includes("tambah_pengajar.html")) {

    const form = document.getElementById("form-tambah-pengajar");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let payload = {
            nama: document.getElementById("nama_lengkap").value,
            alamat: document.getElementById("alamat").value,
            tempat_lahir: document.getElementById("tempat_lahir").value,
            tanggal_lahir: document.getElementById("tanggal_lahir").value,
            mapel: document.getElementById("kelas").value,
            email: document.getElementById("email").value,
            no_kontak: document.getElementById("no_telpon").value,
            password: document.getElementById("password").value
        };

        if (payload.password !== document.getElementById("confirm_password").value) {
            alert("Password dan konfirmasi tidak sama.");
            return;
        }

        try {
            await apiPost("/pengajar/tambah", payload);
            toast("Pengajar berhasil ditambahkan!", "success");
            window.location.href = "daftar_pengajar.html";
        } catch (err) {
            console.error(err);
            toast("Gagal menambah pengajar", "cancel");
        }
    });
}

    // ======================================
    // LIVE SEARCH
    // ======================================
    searchInput.addEventListener("keyup", renderPengajar);

    // INIT
    loadPengajar();
}

/* ============================================================
   DETAIL PENGAJAR (detail_pengajar.html)
============================================================ */
if (window.location.pathname.toLowerCase().includes("detail_pengajar.html")) {

    const params = new URLSearchParams(window.location.search);
    const pengajarId = params.get("id");

    if (!pengajarId) {
        alert("ID Pengajar tidak ditemukan!");
        window.location.href = "daftar_pengajar.html";
    }

    const formEl = {
        nip: document.getElementById("pengajar-nip"),
        nama: document.getElementById("pengajar-nama"),
        alamat: document.getElementById("pengajar-alamat"),
        tanggal_lahir: document.getElementById("pengajar-tanggal-lahir"),
        no_telepon: document.getElementById("pengajar-no-telepon"),
        kelas: document.getElementById("pengajar-kelas"),
        username: document.getElementById("pengajar-username"),
        email: document.getElementById("pengajar-email"),
        status: document.getElementById("pengajar-status"),
        tanggal_terdaftar: document.getElementById("pengajar-tanggal-terdaftar")
    };

    const btnEdit = document.getElementById("btn-edit-pengajar");
    const btnSave = document.getElementById("btn-simpan-pengajar-footer");

    function setDisabled(state) {
        document
            .querySelectorAll("#pengajar-detail-form input, #pengajar-detail-form select")
            .forEach((el) => (el.disabled = state));

        btnSave.style.display = state ? "none" : "inline-block";
    }

    // Awal form disabled
    setDisabled(true);

    // ======================= LOAD DETAIL ========================
    async function loadDetailPengajar() {
        try {
            const res = await apiGet(`/pengajar/${pengajarId}`);
            const p = res.data;

            formEl.nip.value = p.nip ?? "";
            formEl.nama.value = p.nama ?? "";
            formEl.alamat.value = p.alamat ?? "";
            formEl.no_telepon.value = p.no_kontak ?? "";

            formEl.tanggal_lahir.value = p.tanggal_lahir
                ? p.tanggal_lahir.split("T")[0]
                : "";

            formEl.kelas.innerHTML = `<option value="${p.mapel}">${p.mapel}</option>`;

            formEl.username.value = p.username ?? "";
            formEl.email.value = p.email ?? p.user_email ?? "";
            formEl.status.value = p.status ?? "aktif";

            formEl.tanggal_terdaftar.value = p.tanggal_terdaftar
                ? p.tanggal_terdaftar.split("T")[0]
                : "";

        } catch (err) {
            console.error("❌ Error load detail pengajar:", err);
        }
    }

    btnEdit.addEventListener("click", () => setDisabled(false));

    // ======================= SAVE UPDATE ========================
async function savePengajar(e) {
    e.preventDefault(); // HENTIKAN SUBMIT DEFAULT

    const payload = {
        nama: formEl.nama.value,
        alamat: formEl.alamat.value,
        tanggal_lahir: formEl.tanggal_lahir.value,
        no_kontak: formEl.no_telepon.value,
        mapel: formEl.kelas.value,
        email: formEl.email.value,
        status: formEl.status.value
    };

    console.log("Payload update:", payload); // DEBUG

    try {
        const res = await apiPut(`/pengajar/${pengajarId}`, payload);

        console.log("Update response:", res); // DEBUG

        // Tampilkan notifikasi bila ada
        if (typeof toast === "function") {
            toast("Data pengajar berhasil diperbarui", "success");
        }

        // Pastikan redirect berjalan
        setTimeout(() => {
            console.log("Redirecting...");
            window.location.assign("daftar_pengajar.html");
        }, 300);

    } catch (err) {
        console.error("❌ Error update pengajar:", err);

        if (typeof toast === "function") {
            toast("Gagal menyimpan perubahan", "cancel");
        }
    }
}

// pastikan event listener terdaftar
btnSave.addEventListener("click", savePengajar);


    loadDetailPengajar();
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