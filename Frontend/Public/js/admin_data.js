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
            console.error("Error load santri:", err);
        }
    }

    // ==========================================
    // LOAD DATA KELAS (dropdown kelas bisa bertambah otomatis)
    // ==========================================
    async function loadKelas() {
        try {
            let res = await apiGet("/kelas");
            allKelas = Array.isArray(res) ? res : res.data ?? [];

            kelasSelect.innerHTML = `<option value="">Semua Kelas</option>`;

            allKelas.forEach(k => {
                kelasSelect.innerHTML += `
                    <option value="${k.nama_kelas.toLowerCase()}">${k.nama_kelas}</option>
                `;
            });

        } catch (err) {
            console.error("Error load kelas:", err);
        }
    }

    // ==========================================
    // RENDER TABEL SANTRI
    // ==========================================
    function renderSantri() {

        const keyword = searchInput.value.toLowerCase();
        const kategori = kategoriSelect.value;
        const kelas = kelasSelect.value;

        let filtered = [...allSantri];

        // Filter kategori
        if (kategori) {
            filtered = filtered.filter(s => (s.kategori || "").toLowerCase() === kategori);
        }

        // Filter kelas
        if (kelas) {
            filtered = filtered.filter(s => (s.nama_kelas || "").toLowerCase().includes(kelas));
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
                    <td><span class="status-badge status-aktif">${s.status}</span></td>
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
    // DELETE SANTRI
    // ==========================================
    document.addEventListener("click", async (e) => {
        if (e.target.closest(".delete-btn")) {
            const id = e.target.closest(".delete-btn").dataset.id;

            if (!confirm("Yakin ingin menghapus santri ini?")) return;

            try {
                await apiDelete(`/santri/${id}`);
                toast("Santri berhasil dihapus", "success");
                loadSantri();
            } catch (err) {
                console.error(err);
                toast("Gagal menghapus santri", "cancel");
            }
        }
    });

    // ==========================================
// POPUP EDIT SANTRI
// ==========================================

// Buka popup edit
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".edit-btn");
    if (!btn) return;

    const id = btn.dataset.id;

    try {
        const res = await apiGet(`/santri/${id}`);
        const s = res.data;

        // isi form
        document.getElementById("edit-id-santri").value          = s.id_santri;
        document.getElementById("edit-nis").value                = s.nis;
        document.getElementById("edit-nama").value               = s.nama;
        document.getElementById("edit-email").value              = s.email ?? "";
        document.getElementById("edit-no-wa").value              = s.no_wa ?? "";
        document.getElementById("edit-tempat-lahir").value       = s.tempat_lahir ?? "";
        document.getElementById("edit-tanggal-lahir").value      = s.tanggal_lahir?.split("T")[0];
        document.getElementById("edit-kategori").value           = s.kategori;

        // tampilkan popup
        document.getElementById("popup-edit-santri").style.display = "flex";

    } catch (err) {
        console.error(err);
        toast("Gagal memuat data santri", "cancel");
    }
});

// Tombol tutup popup (X)
document.getElementById("close-edit-santri").addEventListener("click", () => {
    document.getElementById("popup-edit-santri").style.display = "none";
});

// Tombol batal
document.getElementById("btn-cancel-edit-santri").addEventListener("click", () => {
    document.getElementById("popup-edit-santri").style.display = "none";
});

// Tombol simpan perubahan
document.getElementById("btn-save-edit-santri").addEventListener("click", async () => {

    const id = document.getElementById("edit-id-santri").value;

    const data = {
        nama: document.getElementById("edit-nama").value,
        email: document.getElementById("edit-email").value,
        no_wa: document.getElementById("edit-no-wa").value,
        tempat_lahir: document.getElementById("edit-tempat-lahir").value,
        tanggal_lahir: document.getElementById("edit-tanggal-lahir").value,
        kategori: document.getElementById("edit-kategori").value
    };

    try {
        await apiPut(`/santri/${id}`, data);

        toast("Data santri berhasil diupdate", "success");

        // tutup popup
        document.getElementById("popup-edit-santri").style.display = "none";

        // refresh data tabel
        loadSantri();

    } catch (err) {
        console.error(err);
        toast("Gagal mengubah data santri", "cancel");
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
            { wch: 15 },
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
    // EVENT LISTENER FILTER & SEARCH
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
            console.error("Error load pengajar:", err);
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
                    <td><span class="status-badge status-aktif">${p.status ?? "Aktif"}</span></td>
                    <td class="action-icons">
                        <button class="icon-btn edit-btn" data-id="${p.id_pengajar}">
                            <i class="fas fa-pen"></i>
                        </button>
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
        if (e.target.closest(".delete-btn")) {
            const id = e.target.closest(".delete-btn").dataset.id;

            if (!confirm("Yakin ingin menghapus pengajar ini?")) return;

            try {
                await apiDelete(`/pengajar/${id}`);
                toast("Pengajar berhasil dihapus", "success");
                loadPengajar();
            } catch (err) {
                console.error(err);
                toast("Gagal menghapus pengajar", "cancel");
            }
        }
    });

    // ==========================================
// POPUP EDIT PENGAJAR
// ==========================================
const popupEdit = document.getElementById("popup-edit-pengajar");
const closePopup = document.getElementById("close-edit-pengajar");
const btnSaveEdit = document.getElementById("btn-simpan-edit-pengajar");

let editPengajarID = null;

// buka popup + load data pengajar
document.addEventListener("click", async (e) => {
    if (e.target.closest(".edit-btn")) {
        editPengajarID = e.target.closest(".edit-btn").dataset.id;
        popupEdit.style.display = "flex";

        try {
            const res = await apiGet(`/pengajar/${editPengajarID}`);
            const p = res.data;

            document.getElementById("edit-nama-pengajar").value = p.nama ?? "";
            document.getElementById("edit-tempat-lahir").value = p.tempat_lahir ?? "";
            document.getElementById("edit-tanggal-lahir").value = p.tanggal_lahir?.split("T")[0] ?? "";
            document.getElementById("edit-alamat").value = p.alamat ?? "";
            document.getElementById("edit-mapel").value = p.mapel ?? "";
            document.getElementById("edit-email-pengajar").value = p.email ?? "";
            document.getElementById("edit-no-kontak").value = p.no_kontak ?? "";

        } catch (err) {
            console.error(err);
            toast("Gagal memuat detail pengajar", "cancel");
        }
    }
});

// close popup
closePopup.addEventListener("click", () => {
    popupEdit.style.display = "none";
});

// simpan perubahan
btnSaveEdit.addEventListener("click", async () => {

    const payload = {
        nama: document.getElementById("edit-nama-pengajar").value,
        tempat_lahir: document.getElementById("edit-tempat-lahir").value,
        tanggal_lahir: document.getElementById("edit-tanggal-lahir").value,
        alamat: document.getElementById("edit-alamat").value,
        mapel: document.getElementById("edit-mapel").value,
        email: document.getElementById("edit-email-pengajar").value,
        no_kontak: document.getElementById("edit-no-kontak").value,
    };

    // jika password baru diisi → update password
    const pass = document.getElementById("edit-password-baru").value;
    if (pass.trim() !== "") {
        payload.password = pass.trim();
    }

    try {
        await apiPut(`/pengajar/${editPengajarID}`, payload);
        toast("Pengajar berhasil diperbarui", "success");

        popupEdit.style.display = "none";
        loadPengajar();

    } catch (err) {
        console.error(err);
        toast("Gagal menyimpan perubahan", "cancel");
    }
});

// ============================
// BUTTON → BUKA FORM TAMBAH PENGAJAR
// ============================
document.addEventListener("click", (e) => {
    if (e.target.closest(".add-teacher-btn")) {
        window.location.href = "tambah_pengajar.html";
    }
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