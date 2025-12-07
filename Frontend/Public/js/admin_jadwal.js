// ================================
// admin_jadwal.js FINAL CLEAN
// ================================
import { apiGet, apiPost, apiPut, apiDelete } from "./apiService.js";

const $ = (id) => document.getElementById(id);
const q = (s) => document.querySelector(s);

// Toast
function toast(msg, type = "success") {
    let t = $("notification-toast");
    if (!t) return;
    t.innerText = msg;
    t.className = `toast-notification show ${type}`;
    setTimeout(() => t.classList.remove("show"), 2500);
}

// Format Jam
function formatJam(start, end) {
    if (!start || !end) return "-";
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

// ================================
// LOAD KELAS UNTUK FILTER
// ================================
async function loadFilterKelas() {
    try {
        let res = await apiGet("/kelas");
        let list = Array.isArray(res) ? res : res.data ?? [];

        window._allKelas = list;

        const select = $("pilih_kelas");
        select.innerHTML = `<option value="">Semua Kelas</option>`;

        list.forEach(k => {
            select.innerHTML += `
                <option value="${k.id_kelas}" data-kategori="${k.kategori}">
                    ${k.nama_kelas}
                </option>
            `;
        });

    } catch (err) {
        console.error("Error load kelas:", err);
    }
}

// ================================
// LOAD JADWAL
// ================================
async function loadJadwal() {
    try {
        let res = await apiGet("/jadwal");
        let list = Array.isArray(res) ? res : res.data ?? [];

        window._allJadwal = list;

        renderJadwal();

    } catch (err) {
        console.error("Load Jadwal Error:", err);
    }
}

// ================================
// RENDER JADWAL
// ================================
function renderJadwal() {
    const body = $("jadwalBody");
    const list = window._allJadwal || [];

    const fKat = $("kategori").value;
    const fKelas = $("pilih_kelas").value;

    let filtered = list;

    if (fKat) {
        filtered = filtered.filter(j =>
            window._allKelas.find(k => k.id_kelas === j.id_kelas)?.kategori === fKat
        );
    }

    if (fKelas) {
        filtered = filtered.filter(j => j.id_kelas == fKelas);
    }

    body.innerHTML = "";

    if (filtered.length === 0) {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center">Tidak ada jadwal.</td></tr>`;
        return;
    }

    filtered.forEach((j, i) => {
        body.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${j.nama_kelas || "-"}</td>
                <td>${j.pengajar || "-"}</td>
                <td>${j.hari || "-"}</td>
                <td>${formatJam(j.jam_mulai, j.jam_selesai)}</td>
                <td>${j.created_at ? new Date(j.created_at).toLocaleDateString("id-ID") : "-"}</td>
                <td><span class="status-badge status-aktif">Aktif</span></td>

                <td class="action-icons">
                    <button class="icon-btn edit-btn" data-id="${j.id_jadwal}">
                        <i class="fas fa-pen"></i>
                    </button>

                    <button class="icon-btn delete-btn" data-id="${j.id_jadwal}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

// ================================
// POPUP TAMBAH JADWAL
// ================================
function openTambahPopup() {
    if ($("popup-add-jadwal")) $("popup-add-jadwal").remove();

    let html = `
        <div class="modal-overlay" id="popup-add-jadwal">
            <div class="modal-content small-popup">

                <h3>Tambah Jadwal</h3>

                <label>Kelas</label>
                <select id="add-id_kelas" class="styled-select-filter">
                    ${window._allKelas.map(k => `<option value="${k.id_kelas}">${k.nama_kelas}</option>`).join("")}
                </select>

                <label>Hari</label>
                <select id="add-hari" class="styled-select-filter">
                    <option>Senin</option>
                    <option>Selasa</option>
                    <option>Rabu</option>
                    <option>Kamis</option>
                    <option>Jumat</option>
                    <option>Sabtu</option>
                    <option>Minggu</option>
                </select>

                <label>Jam Mulai</label>
                <input type="time" id="add-jam_mulai">

                <label>Jam Selesai</label>
                <input type="time" id="add-jam_selesai">

                <label>Lokasi</label>
                <input type="text" id="add-lokasi" placeholder="contoh: Aula Utama">

                <div class="modal-actions">
                    <button class="modal-btn cancel" id="btn-cancel-add">Batal</button>
                    <button class="modal-btn save" id="btn-save-add">Simpan</button>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    $("btn-cancel-add").onclick = () => $("popup-add-jadwal").remove();

    $("btn-save-add").onclick = async () => {

        let payload = {
            id_kelas: $("add-id_kelas").value,
            hari: $("add-hari").value,
            jam_mulai: $("add-jam_mulai").value,
            jam_selesai: $("add-jam_selesai").value,
            lokasi: $("add-lokasi").value
        };

        try {
            await apiPost("/jadwal", payload);
            toast("Jadwal berhasil ditambahkan");
            $("popup-add-jadwal").remove();
            loadJadwal();

        } catch (err) {
            console.error(err);
            toast("Gagal menambah jadwal", "cancel");
        }
    };
}

// ================================
// POPUP EDIT JADWAL
// ================================
function openEditPopup(j) {

    if ($("popup-edit-jadwal")) $("popup-edit-jadwal").remove();

    let html = `
        <div class="modal-overlay" id="popup-edit-jadwal">
            <div class="modal-content small-popup">

                <h3>Edit Jadwal</h3>

                <label>Kelas</label>
                <select id="edit-id_kelas" class="styled-select-filter">
                    ${window._allKelas.map(k => `
                        <option value="${k.id_kelas}" ${k.id_kelas == j.id_kelas ? "selected" : ""}>
                            ${k.nama_kelas}
                        </option>`).join("")}
                </select>

                <label>Hari</label>
                <select id="edit-hari" class="styled-select-filter">
                    <option ${j.hari == "Senin" ? "selected" : ""}>Senin</option>
                    <option ${j.hari == "Selasa" ? "selected" : ""}>Selasa</option>
                    <option ${j.hari == "Rabu" ? "selected" : ""}>Rabu</option>
                    <option ${j.hari == "Kamis" ? "selected" : ""}>Kamis</option>
                    <option ${j.hari == "Jumat" ? "selected" : ""}>Jumat</option>
                    <option ${j.hari == "Sabtu" ? "selected" : ""}>Sabtu</option>
                    <option ${j.hari == "Minggu" ? "selected" : ""}>Minggu</option>
                </select>

                <label>Jam Mulai</label>
                <input type="time" id="edit-jam_mulai" value="${j.jam_mulai.slice(0,5)}">

                <label>Jam Selesai</label>
                <input type="time" id="edit-jam_selesai" value="${j.jam_selesai.slice(0,5)}">

                <label>Lokasi</label>
                <input type="text" id="edit-lokasi" value="${j.lokasi || ""}">

                <div class="modal-actions">
                    <button class="modal-btn cancel" id="edit-cancel">Batal</button>
                    <button class="modal-btn save" id="edit-save">Simpan</button>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    $("edit-cancel").onclick = () => $("popup-edit-jadwal").remove();

    $("edit-save").onclick = async () => {

        let payload = {
            id_kelas: $("edit-id_kelas").value,
            hari: $("edit-hari").value,
            jam_mulai: $("edit-jam_mulai").value,
            jam_selesai: $("edit-jam_selesai").value,
            lokasi: $("edit-lokasi").value
        };

        try {
            await apiPut(`/jadwal/${j.id_jadwal}`, payload);
            toast("Jadwal berhasil diperbarui");
            $("popup-edit-jadwal").remove();
            loadJadwal();

        } catch (err) {
            console.error(err);
            toast("Gagal update jadwal", "cancel");
        }
    };
}

// ================================
// EVENT LISTENER UTAMA
// ================================
document.addEventListener("DOMContentLoaded", () => {

    loadFilterKelas().then(loadJadwal);

    $("kategori").addEventListener("change", renderJadwal);
    $("pilih_kelas").addEventListener("change", renderJadwal);

    $("btn-add-jadwal").onclick = openTambahPopup;

    document.addEventListener("click", (e) => {

        if (e.target.closest(".delete-btn")) {
            let id = e.target.closest(".delete-btn").dataset.id;
            openHapusPopup(id);
        }

        if (e.target.closest(".edit-btn")) {
            let id = e.target.closest(".edit-btn").dataset.id;
            let j = window._allJadwal.find(x => x.id_jadwal == id);
            if (j) openEditPopup(j);
        }

    });

});

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