import { apiGet, apiPost, apiPut, apiDelete } from "./apiService.js";

const $ = (id) => document.getElementById(id);

// Toast
function toast(msg, type = "success") {
    let t = $("notification-toast");
    t.innerText = msg;
    t.className = `toast-notification show ${type}`;
    setTimeout(() => t.classList.remove("show"), 2200);
}

// Format jam
const formatJam = (mulai, selesai) =>
    `${(mulai || "").slice(0,5)} - ${(selesai || "").slice(0,5)}`;


// ================================
// LOAD KELAS
// ================================
async function loadKelasDropdowns() {
    try {
        const res = await apiGet("/kelas");
        const kelasList = Array.isArray(res) ? res : res.data ?? [];

        window._kelasList = kelasList;

        $("pilih_kelas").innerHTML = `<option value="">Semua Kelas</option>`;
        $("kelas-tingkatan").innerHTML = `<option value="">-- Pilih Kelas --</option>`;

        kelasList.forEach(k => {
            $("pilih_kelas").innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;
            $("kelas-tingkatan").innerHTML += `<option value="${k.id_kelas}" data-kategori="${k.kategori}">
                ${k.nama_kelas}
            </option>`;
        });

    } catch (err) {
        console.error(err);
        toast("Gagal load kelas", "error");
    }
}


// ================================
// LOAD PENGAJAR
// ================================
async function loadPengajarDropdowns() {
    try {
        const res = await apiGet("/pengajar");
        const pengajarList = Array.isArray(res) ? res : res.data ?? [];

        window._pengajarList = pengajarList;

        // TAMBAH JADWAL
        $("pengajar-tambah").innerHTML = `<option value="">-- Pilih Pengajar --</option>`;

        // EDIT JADWAL
        $("pengajar").innerHTML = ``;

        pengajarList.forEach(p => {
            $("pengajar-tambah").innerHTML += `<option value="${p.id_pengajar}">${p.nama}</option>`;
            $("pengajar").innerHTML += `<option value="${p.id_pengajar}">${p.nama}</option>`;
        });

    } catch (err) {
        console.error(err);
        toast("Gagal load pengajar", "error");
    }
}


// ================================
// LOAD JADWAL
// ================================
async function loadJadwal() {
    try {
        const res = await apiGet("/jadwal");
        let list = Array.isArray(res) ? res : res.data ?? [];

        // FIX: gunakan nama_pengajar dari backend
        list = list.map(j => ({
            ...j,
            nama_kelas: j.nama_kelas,
            pengajar_nama: j.nama_pengajar || "-",
            kategori: j.kategori
        }));

        window._jadwalList = list;
        renderJadwal();

    } catch (err) {
        console.error(err);
        toast("Gagal load jadwal", "error");
    }
}


// ================================
// RENDER TABLE
// ================================
function renderJadwal() {
    const tb = $("jadwalBody");
    const fk = $("pilih_kelas").value;
    const fk2 = $("kategori").value;

    let list = [...window._jadwalList];

    if (fk) list = list.filter(j => j.id_kelas == fk);
    if (fk2) list = list.filter(j => j.kategori == fk2);

    tb.innerHTML = "";

    if (!list.length) {
        tb.innerHTML = `<tr><td colspan="8" style="text-align:center;">Tidak ada jadwal.</td></tr>`;
        return;
    }

    list.forEach((j, i) => {
        tb.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${j.nama_kelas}</td>
                <td>${j.pengajar_nama}</td>
                <td>${j.hari}</td>
                <td>${formatJam(j.jam_mulai, j.jam_selesai)}</td>
                <td>${j.kategori}</td>
                <td><span class="status-badge status-aktif">AKTIF</span></td>
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
// TAMBAH JADWAL
// ================================
$("btn-add-jadwal").onclick = () => {
    $("tambah-jadwal-modal").style.display = "flex";
};

$("btn-close-tambah-x").onclick =
$("btn-tambah-cancel").onclick = () =>
    $("tambah-jadwal-modal").style.display = "none";


$("form-tambah-jadwal").addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
        id_kelas: $("kelas-tingkatan").value,
        id_pengajar: $("pengajar-tambah").value,
        hari: $("hari-tambah").value,
        jam_mulai: $("waktu-mulai").value + ":00",
        jam_selesai: $("waktu-selesai").value + ":00",
        kategori: $("kategori-jadwal").value
    };

    try {
        await apiPost("/jadwal", payload);
        toast("Jadwal berhasil ditambahkan!");
        $("tambah-jadwal-modal").style.display = "none";
        loadJadwal();

    } catch (err) {
        console.error(err);
        toast("Gagal menambah jadwal", "error");
    }
});


// ================================
// OPEN EDIT POPUP (GET DATA)
// ================================
document.addEventListener("click", async (e) => {
    if (!e.target.closest(".edit-btn")) return;

    const idJadwal = e.target.closest(".edit-btn").dataset.id;

    try {
        // --- Ambil data jadwal ---
        const jd = await apiGet(`/jadwal/${idJadwal}`);

        // Simpan ID jadwal
        $("edit-id-jadwal").value = idJadwal;

        // Set tampilan nama kelas
        $("kelas-nama-edit").innerText = jd.nama_kelas;

        // Set form jadwal
        $("pengajar").value = jd.id_pengajar;
        $("kategori-edit").value = jd.kategori;
        $("edit-hari").value = jd.hari;
        $("edit-mulai").value = jd.jam_mulai.slice(0,5);
        $("edit-selesai").value = jd.jam_selesai.slice(0,5);

        // --- Ambil data kelas ---
        const kelas = await apiGet(`/kelas/detail/${jd.id_kelas}`);

        $("jumlah-siswa-maks").value = kelas.kelas.kapasitas || 0;
        $("edit-id-kelas").value = kelas.kelas.id_kelas;

        $("edit-jadwal-modal").style.display = "flex";

    } catch (err) {
        console.error(err);
        toast("Gagal memuat data edit", "error");
    }
});


// ================================
// SUBMIT EDIT JADWAL
// ================================
$("btn-edit-simpan").onclick = async () => {
    const idJadwal = $("edit-id-jadwal").value;
    const idKelas = $("edit-id-kelas").value;

    // --- Payload untuk kelas ---
    const kelasPayload = {
        kapasitas: $("jumlah-siswa-maks").value,
        kategori: $("kategori-edit").value,
        id_pengajar: $("pengajar").value
    };

    // --- Payload untuk jadwal ---
    const jadwalPayload = {
        id_pengajar: $("pengajar").value,
        kategori: $("kategori-edit").value,
        hari: $("edit-hari").value,
        jam_mulai: $("edit-mulai").value + ":00",
        jam_selesai: $("edit-selesai").value + ":00"
    };

    try {
        // UPDATE KELAS
        await apiPut(`/kelas/edit/${idKelas}`, kelasPayload);

        // UPDATE JADWAL
        await apiPut(`/jadwal/${idJadwal}`, jadwalPayload);

        toast("Kelas & Jadwal berhasil diperbarui!");

        $("edit-jadwal-modal").style.display = "none";
        loadJadwal();

    } catch (err) {
        console.error(err);
        toast("Gagal memperbarui kelas atau jadwal", "error");
    }
};

// ================================
// HAPUS JADWAL
// ================================
document.addEventListener("click", (e) => {
    if (!e.target.closest(".delete-btn")) return;
    const id = e.target.closest(".delete-btn").dataset.id;
    deleteJadwal(id);
});

async function deleteJadwal(id) {
    if (!confirm("Hapus jadwal ini?")) return;

    try {
        await apiDelete(`/jadwal/${id}`);
        toast("Jadwal berhasil dihapus!");
        loadJadwal();
    } catch (err) {
        console.error(err);
        toast("Gagal menghapus jadwal", "error");
    }
}


// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", async () => {
    await loadKelasDropdowns();
    await loadPengajarDropdowns();
    await loadJadwal();

    $("pilih_kelas").onchange = renderJadwal;
    $("kategori").onchange = renderJadwal;
});


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

// 1. Buka Modal
if (btnOpenTambahKelas) {
    btnOpenTambahKelas.addEventListener('click', function(e) {
        e.preventDefault();
        tambahKelasModal.style.display = 'flex';
    });
}

// 2. Tutup dengan tombol X
btnCloseTambahKelasX?.addEventListener('click', function () {
    tambahKelasModal.style.display = 'none';
    formTambahKelas.reset();
    showToast("Penambahan kelas dibatalkan.", "cancel");
});

// 3. Tutup dengan tombol Batalkan
btnCancelKelas?.addEventListener('click', function () {
    tambahKelasModal.style.display = 'none';
    formTambahKelas.reset();
    showToast("Penambahan kelas dibatalkan.", "cancel");
});

// 4. Tutup jika klik di luar modal
window.addEventListener('click', function (e) {
    if (e.target === tambahKelasModal) {
        tambahKelasModal.style.display = 'none';
        formTambahKelas.reset();
    }
});

// 5. Submit Form Tambah Kelas
formTambahKelas?.addEventListener('submit', function (e) {
    e.preventDefault();
    tambahKelasModal.style.display = 'none';
    formTambahKelas.reset();
    showToast("Kelas berhasil ditambahkan!", "success");
});

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