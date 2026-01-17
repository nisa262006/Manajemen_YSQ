import { apiGet, apiPost, apiPut, apiDelete } from "./apiService.js";

const $ = (id) => document.getElementById(id);


// Buka popup profile 
if ($("menu-profile")) {
    $("menu-profile").onclick = () => {
        const popup = $("popup-profile-setting");
        if (popup) {
            popup.style.display = "flex";
            loadAdminProfile();
        }
    };
}

// ==== SAFE MODE PATCH: NONAKTIFKAN FUNSI PENDAFTAR DI HALAMAN YANG TIDAK MEMILIKI ELEMEN TERKAIT ====
function safeGet(id) {
    return document.getElementById(id);
}

// Cegah error fillModalData()
function safeSetText(id, value) {
    const el = safeGet(id);
    if (el) el.textContent = value;
}

/* ============================================================
   TOAST
============================================================ */
function toast(msg, type = "success") {
    const t = $("notification-toast");
    if (!t) return;
    t.innerText = msg;
    t.className = `toast-notification show ${type}`;
    setTimeout(() => t.classList.remove("show"), 2200);
}

/* ============================================================
   FORMAT JAM
============================================================ */
const formatJam = (mulai, selesai) =>
    `${(mulai || "").slice(0, 5)} - ${(selesai || "").slice(0, 5)}`;

/* ============================================================
   ========== BAGIAN 1 — SISTEM JADWAL ==========
============================================================ */
async function loadKelasDropdowns() {
    if (!$("pilih_kelas") && !$("kelas-tingkatan")) return;

    try {
        const res = await apiGet("/kelas");
        const list = Array.isArray(res) ? res : res.data ?? [];

        window._kelasList = list;

        if ($("pilih_kelas")) {
            $("pilih_kelas").innerHTML = `<option value="">Semua Kelas</option>`;
        }
        if ($("kelas-tingkatan")) {
            $("kelas-tingkatan").innerHTML = `<option value="">-- Pilih Kelas --</option>`;
        }

        list.forEach(k => {
            if ($("pilih_kelas"))
                $("pilih_kelas").innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;

            if ($("kelas-tingkatan"))
                $("kelas-tingkatan").innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;
        });

    } catch (e) {
        console.error(e);
        toast("Gagal memuat kelas", "error");
    }
}

/* ============================================================
   FIXED: LOAD PENGAJAR DROPDOWNS (ANTI-DOBEL)
============================================================ */
/* ============================================================
   FIXED: LOAD PENGAJAR DROPDOWNS (ISI TAMBAH & EDIT)
============================================================ */
async function loadPengajarDropdowns() {
    // Pastikan salah satu elemen ada di halaman
    if (!$("pengajar-tambah") && !$("pengajar")) return;

    try {
        const res = await apiGet("/pengajar");
        const list = Array.isArray(res) ? res : res.data ?? [];

        // FILTER: Hanya pengajar yang statusnya 'aktif'
        const activePengajar = list.filter(p => p.status === 'aktif');

        const uniquePengajar = [];
        const seenIds = new Set();

        activePengajar.forEach(p => {
            if (p.id_pengajar && !seenIds.has(p.id_pengajar)) {
                seenIds.add(p.id_pengajar);
                uniquePengajar.push(p);
            }
        });

        window._pengajarList = uniquePengajar;

        // 1. ISI DROPDOWN TAMBAH
        const selectTambah = $("pengajar-tambah");
        if (selectTambah) {
            selectTambah.innerHTML = `<option value="">-- Pilih Pengajar --</option>`;
            uniquePengajar.forEach(p => {
                selectTambah.innerHTML += `<option value="${p.id_pengajar}">${p.nama}</option>`;
            });
        }

        // 2. ISI DROPDOWN EDIT (Penting agar data muncul saat edit)
        const selectEdit = $("pengajar"); // ID ini sesuai dengan yang dipanggil di modal edit
        if (selectEdit) {
            selectEdit.innerHTML = `<option value="">-- Pilih Pengajar --</option>`;
            uniquePengajar.forEach(p => {
                selectEdit.innerHTML += `<option value="${p.id_pengajar}">${p.nama}</option>`;
            });
        }

    } catch (err) {
        console.error("Error loading unique teachers:", err);
        toast("Gagal memuat daftar pengajar", "error");
    }
}

async function loadJadwal() {
    if (!$("jadwalBody")) return;

    try {
        const res = await apiGet("/jadwal");
        let list = Array.isArray(res) ? res : res.data ?? [];

        list = list.map(j => ({
            ...j,
            pengajar_nama: j.nama_pengajar || "-",
        }));

        window._jadwalList = list;
        renderJadwal();

    } catch (e) {
        console.error(e);
        toast("Gagal memuat jadwal", "error");
    }
}

function renderJadwal() {
    const tb = $("jadwalBody");
    if (!tb) return;

    const fkelas = $("pilih_kelas")?.value;
    const fkat = $("kategori")?.value;

    let list = [...window._jadwalList];

    if (fkelas) list = list.filter(j => j.id_kelas == fkelas);
    // PERBAIKAN: Gunakan 'j' bukan 'k'
    if (fkat) list = list.filter(j => j.kategori == fkat); 

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
            <td>${j.kategori}</td> <td><span class="status-badge status-aktif">AKTIF</span></td>
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

/* ============================================================
   TAMBAH JADWAL
============================================================ */
if ($("btn-add-jadwal")) {
    $("btn-add-jadwal").onclick = () =>
        $("tambah-jadwal-modal").style.display = "flex";
}

if ($("btn-close-tambah-x"))
    $("btn-close-tambah-x").onclick = () => $("tambah-jadwal-modal").style.display = "none";

if ($("btn-tambah-cancel"))
    $("btn-tambah-cancel").onclick = () => $("tambah-jadwal-modal").style.display = "none";

if ($("form-tambah-jadwal")) {
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
            // Mengirim data ke backend
            const response = await apiPost("/jadwal", payload);
            
            // Jika berhasil
            toast("Jadwal berhasil ditambahkan!");
            $("tambah-jadwal-modal").style.display = "none";
            $("form-tambah-jadwal").reset(); // Bersihkan form
            loadJadwal(); // Refresh tabel

        } catch (err) {
            console.error("Error Tambah Jadwal:", err);
            
            // MENGAMBIL PESAN ERROR DARI BACKEND (Termasuk pesan "Jadwal Bentrok")
            const pesanError = err.response?.data?.message || "Gagal menambah jadwal";
            
            // Tampilkan pesan error di toast dengan tipe 'error' (merah)
            toast(pesanError, "error");
        }
    });
}

/* ============================================================
   PERBAIKAN: EDIT JADWAL 
============================================================ */
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".edit-btn");
    if (!btn) return;

    const id = btn.dataset.id;

    try {
        // 1. Ambil Detail Jadwal & Detail Kelas
        const jd = await apiGet(`/jadwal/${id}`);
        const resKelas = await apiGet(`/kelas/detail/${jd.id_kelas}`);

        // 2. Isi Data ke Form Modal
        $("edit-id-jadwal").value = id;
        $("edit-id-kelas").value = jd.id_kelas;
        $("kelas-nama-edit").innerText = jd.nama_kelas;
        
        // PASTI KAN ID DROPDOWN SESUAI (Gunakan ID yang ada di HTML Modal Edit Anda)
        if ($("pengajar")) $("pengajar").value = jd.id_pengajar;
        
        // --- INI PERBAIKAN UNTUK KATEGORI ---
        if ($("kategori-edit")) {
            $("kategori-edit").value = jd.kategori; // Masukkan kategori dari database
        }

        $("edit-hari").value = jd.hari;
        $("edit-mulai").value = jd.jam_mulai.slice(0, 5);
        $("edit-selesai").value = jd.jam_selesai.slice(0, 5);
        $("jumlah-siswa-maks").value = resKelas.kelas.kapasitas;

        // 3. Load Sesi Pengajar
        if (jd.id_pengajar) {
            $("edit-jadwal-modal").dataset.currentPengajarId = jd.id_pengajar;
            await loadDaftarSesiPengajar(jd.id_pengajar);
        }

        $("edit-jadwal-modal").style.display = "flex";

    } catch (err) {
        console.error(err);
        toast("Gagal memuat data kategori/jadwal", "error");
    }
});

// Fungsi Helper untuk merender tabel Daftar Sesi Pembelajaran dengan Tombol Hapus
async function loadDaftarSesiPengajar(idPengajar) {
    const sesiBody = $("sesi-table-body");
    if (!sesiBody) return;

    try {
        const listSesi = await apiGet(`/jadwal/pengajar-sesi/${idPengajar}`);
        
        sesiBody.innerHTML = listSesi.length 
            ? listSesi.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${s.nama_kelas}</td>
                    <td>${s.hari}</td>
                    <td>${s.jam_mulai.slice(0, 5)} - ${s.jam_selesai.slice(0, 5)}</td>
                    <td><span class="status-badge status-aktif">AKTIF</span></td>
                    <td>
                        <button class="icon-btn delete-sesi-modal-btn" data-id="${s.id_jadwal}" title="Hapus Sesi">
                            <i class="fas fa-trash-alt" style="color: #e74c3c;"></i>
                        </button>
                    </td>
                </tr>
            `).join("")
            : `<tr><td colspan="6" style="text-align:center;">Pengajar belum memiliki sesi lain.</td></tr>`;

    } catch (err) {
        sesiBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat sesi.</td></tr>`;
    }
}



/* ============================================================
   LOGIKA HAPUS SESI DARI DALAM MODAL
============================================================ */
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-sesi-modal-btn");
    if (!btn) return;

    const idJadwal = btn.dataset.id;
    const idPengajar = $("edit-jadwal-modal").dataset.currentPengajarId;

    if (!confirm("Apakah Anda yakin ingin menghapus sesi jadwal ini?")) return;

    try {
        // Gunakan endpoint delete yang sudah ada di jadwalroutes.js
        await apiDelete(`/jadwal/${idJadwal}`);
        
        toast("Sesi berhasil dihapus!");

        // 1. Refresh tabel kecil di dalam modal
        if (idPengajar) {
            await loadDaftarSesiPengajar(idPengajar);
        }

        // 2. Refresh tabel utama di halaman belakang modal
        if (typeof loadJadwal === "function") {
            loadJadwal();
        }

    } catch (err) {
        console.error(err);
        toast("Gagal menghapus sesi", "error");
    }
});

/* ============================================================
   SIMPAN PERUBAHAN JADWAL (UPDATE)
============================================================ */
if ($("btn-edit-simpan")) {
    $("btn-edit-simpan").onclick = async () => {
        const idJadwal = $("edit-id-jadwal").value;
        
        const payload = {
            id_kelas: $("edit-id-kelas").value, // Pastikan ID Kelas terkirim
            kapasitas: $("jumlah-siswa-maks").value, // Kapasitas/Jumlah Maks
            hari: $("edit-hari").value,
            jam_mulai: $("edit-mulai").value + ":00",
            jam_selesai: $("edit-selesai").value + ":00",
            kategori: $("kategori-edit").value,
            id_pengajar: $("pengajar").value
        };

        try {
            await apiPut(`/jadwal/${idJadwal}`, payload);
            toast("Perubahan jadwal berhasil disimpan!");
            
            $("edit-jadwal-modal").style.display = "none";
            
            // PAKSA REFRESH DATA
            await loadJadwal(); 
        } catch (err) {
            console.error(err);
            toast("Gagal memperbarui jadwal", "error");
        }
    };
}

// Logika tombol batal di modal edit
if ($("btn-edit-cancel") || $("btn-close-edit-x")) {
    const closeEdit = () => $("edit-jadwal-modal").style.display = "none";
    if ($("btn-edit-cancel")) $("btn-edit-cancel").onclick = closeEdit;
    if ($("btn-close-edit-x")) $("btn-close-edit-x").onclick = closeEdit;
}

/* ============================================================
   HAPUS JADWAL
============================================================ */
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;

    const id = btn.dataset.id;

    if (!confirm("Hapus jadwal ini?")) return;

    try {
        await apiDelete(`/jadwal/${id}`);
        toast("Jadwal berhasil dihapus!");
        loadJadwal();
    } catch (err) {
        console.error(err);
        toast("Gagal menghapus jadwal", "error");
    }
});

/* ============================================================
   ========== BAGIAN 2 — SISTEM KELAS ==========
============================================================ */
async function loadKelasTable() {
    if (!document.querySelector(".class-list-table tbody")) return;

    try {
        const res = await apiGet("/kelas");
        const list = Array.isArray(res) ? res : res.data ?? [];

        window._kelasRaw = list;
        renderKelas(list);

    } catch (e) {
        console.error(e);
        toast("Gagal memuat kelas", "error");
    }
}

function renderKelas(data) {
    const body = document.querySelector(".class-list-table tbody");
    if (!body) return;

    body.innerHTML = "";

    if (!data.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;">Tidak ada data kelas</td></tr>`;
        return;
    }

    data.forEach((k, i) => {
        body.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${k.nama_kelas}</td>
                <td>${k.kapasitas}</td>
                <td>${k.kategori}</td>
                <td>${k.nama_pengajar || "-"}</td>
                <td class="action-icons">
                    <button class="icon-btn view-details-btn" data-id="${k.id_kelas}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="icon-btn delete-kelas-btn" data-id="${k.id_kelas}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

/* HITUNG UMUR*/
function hitungUsia(tanggalLahir) {
    if (!tanggalLahir) return "-";

    const lahir = new Date(tanggalLahir);
    const today = new Date();

    let usia = today.getFullYear() - lahir.getFullYear();
    const bulan = today.getMonth() - lahir.getMonth();

    if (bulan < 0 || (bulan === 0 && today.getDate() < lahir.getDate())) {
        usia--;
    }

    return usia + " Tahun";
}


/* ============================================================
   VIEW KELAS — LIHAT DETAIL (DAFTAR SANTRI)
============================================================ */
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".view-details-btn");
    if (!btn) return;

    const idKelas = btn.dataset.id;

    try {
        // ===== GET DETAIL KELAS =====
        const res = await apiGet(`/kelas/detail/${idKelas}`);

        const kelas = res.kelas;
        const santriList = res.santri ?? [];

        // ===== SET TITLE MODAL =====
        const title = document.getElementById("modal-title");
        if (title) title.innerText = `Daftar Santri Kelas: ${kelas.nama_kelas}`;

        // ===== ISI TABEL SANTRI =====
        const tbody = document.querySelector("#santri-table tbody");
        tbody.innerHTML = "";

        if (!santriList.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Tidak ada santri</td></tr>`;
        } else {

            for (let i = 0; i < santriList.length; i++) {
                const s = santriList[i];

                // 🔥 Ambil detail santri dari backend
                let detail = await apiGet(`/santri/${s.id_santri}`);

                const tanggalLahir = detail.data?.tanggal_lahir;
                const status = detail.data?.status ?? "Aktif";
                const usia = hitungUsia(tanggalLahir);

                tbody.innerHTML += `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${s.nama}</td>
                        <td>${usia}</td>
                        <td>${status}</td>
                    </tr>
                `;
            }
        }

        // ===== BUKA MODAL =====
        document.getElementById("santri-modal").style.display = "flex";

    } catch (err) {
        console.error(err);
        toast("Gagal memuat detail kelas", "error");
    }
});

/* ===== TUTUP MODAL ===== */
document.querySelector("#santri-modal .close-btn")?.addEventListener("click", () => {
    const modal = document.getElementById("santri-modal");
    if (modal) modal.style.display = "none";
});

/* ===== TUTUP MODAL KETIKA KLIK LUAR ===== */
window.addEventListener("click", (e) => {
    const modal = document.getElementById("santri-modal");
    if (modal && e.target === modal) {
        modal.style.display = "none";
    }
});

document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-kelas-btn");
    if (!btn) return;

    const id = btn.dataset.id;

    if (!confirm("Yakin ingin menghapus kelas ini?")) return;

    try {
        await apiDelete(`/kelas/hapus/${id}`);
        toast("Kelas berhasil dihapus!");
        loadKelasTable();
    } catch (err) {
        console.error(err);
        toast("Gagal menghapus kelas", "error");
    }
});

/* ============================================================
   TAMBAH KELAS (SESUAI BACKEND)
============================================================ */

if ($("form-tambah-kelas")) {

    $("btn-open-tambah-kelas").onclick = () => {
        $("tambah-kelas-modal").style.display = "flex";
        loadPengajarUntukTambahKelas(); // load list pengajar dari backend
    };

    $("btn-close-tambah-kelas-x").onclick =
    $("btn-cancel-kelas").onclick = () => {
        $("tambah-kelas-modal").style.display = "none";
        $("form-tambah-kelas").reset();
    };

    // ============================
    // LOAD PENGAJAR UNTUK DROPDOWN
    // ============================
    async function loadPengajarUntukTambahKelas() {
        try {
            const res = await apiGet("/pengajar");
            const list = Array.isArray(res) ? res : res.data ?? [];
    
            const dropdown = $("select-pengajar-kelas");
            if (!dropdown) return;
    
            dropdown.innerHTML = `<option value="">Pilih Pengajar</option>`;
    
            // FILTER: Hanya ambil yang aktif
            const activeOnly = list.filter(p => p.status === 'aktif');
    
            const uniquePengajar = [];
            const seenIds = new Set();
    
            activeOnly.forEach(p => {
                if (!seenIds.has(p.id_pengajar)) {
                    seenIds.add(p.id_pengajar);
                    uniquePengajar.push(p);
                }
            });
    
            uniquePengajar.forEach(p => {
                dropdown.innerHTML += `<option value="${p.id_pengajar}">${p.nama}</option>`;
            });
    
        } catch (err) {
            console.error(err);
            toast("Gagal memuat daftar pengajar", "error");
        }
    }

    // ============================
    // SUBMIT FORM TAMBAH KELAS
    // ============================
    $("form-tambah-kelas").addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            nama_kelas: $("input-kelas-tingkatan").value,
            kapasitas: Number($("input-kapasitas").value),
            kategori: $("input-kategori").value,
            id_pengajar: Number($("select-pengajar-kelas").value),
            waktu_mulai: $("input-waktu-mulai").value,
            waktu_selesai: $("input-waktu-selesai").value
        };

        console.log("PAYLOAD KIRIM KELAS:", payload);

        try {
            await apiPost("/kelas", payload);

            toast("Kelas berhasil ditambahkan!");

            $("tambah-kelas-modal").style.display = "none";
            $("form-tambah-kelas").reset();

            loadKelasTable(); // refresh tabel kelas

        } catch (err) {
            console.error(err);
            toast("Gagal menambah kelas", "error");
        }
    });

}


/* ============================================================
   FILTER KELAS OTOMATIS DARI BACKEND
============================================================ */
async function populateFilterKelas() {
    const select = $("kelas_tingkatan");
    if (!select) return; // halaman jadwal tidak punya ini

    try {
        const res = await apiGet("/kelas");
        const list = Array.isArray(res) ? res : res.data ?? [];

        // Reset + tambahkan "Semua"
        select.innerHTML = `<option value="semua">Semua</option>`;

        // Tambahkan kelas berdasarkan nama_kelas
        const uniqueNames = [...new Set(list.map(k => k.nama_kelas))];

        uniqueNames.forEach(nama => {
            select.innerHTML += `<option value="${nama.toLowerCase()}">${nama}</option>`;
        });

    } catch (err) {
        console.error(err);
        toast("Gagal memuat filter kelas", "error");
    }
}

// Event filter
if ($("kelas_tingkatan")) {
    $("kelas_tingkatan").addEventListener("change", () => {
        const val = $("kelas_tingkatan").value;

        if (val === "semua") {
            renderKelas(window._kelasRaw);
            return;
        }

        const filtered = window._kelasRaw.filter(k =>
            k.nama_kelas.toLowerCase() === val
        );

        renderKelas(filtered);
    });
}

// Panggil saat load halaman
document.addEventListener("DOMContentLoaded", async () => {
    await populateFilterKelas();
});


/* ============================================================
   INIT — BERFUNGSI UNTUK KEDUA HALAMAN
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    await loadKelasDropdowns();
    await loadPengajarDropdowns();
    await loadJadwal();
    await loadKelasTable();

    if ($("pilih_kelas")) $("pilih_kelas").onchange = renderJadwal;
    if ($("kategori")) $("kategori").onchange = renderJadwal;
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

// =======================================================
// !!! FUNGSI YANG HARUS DIISI OLEH BACKEND DEVELOPER !!!
// (Hanya perlu mengisi logic di dalam fungsi ini)
// =======================================================

/**
 * FUNGSI UTAMA: Mengambil data santri dari server berdasarkan ID Kelas.
 * TEMAN ANDA CUKUP MENGISI BAGIAN INI DENGAN LOGIC FETCH/AXIOS YANG SESUNGGUHNYA.
 * * @param {string} kelasId - ID Kelas yang datanya ingin diambil.
 * @returns {Promise<Array<Object>>} - Mengembalikan Promise yang berisi array data santri (Contoh format: [{nama: 'Budi', usia: 17, status: 'Aktif'}])
 */
async function fetchSantriData(kelasId) {
    console.log(`[AJAX LOG] Meminta data santri untuk Kelas ID: ${kelasId} ke server...`);
    

    // Sementara API belum diisi: Beri jeda 500ms dan kembalikan array kosong (tanpa data dummy)
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([]);
        }, 500); 
    });
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

    // 🏷️ TAG: Variabel MODAL DAFTAR SANTRI BARU (Permintaan Anda)
    const santriModal = document.getElementById('santri-modal');
    const santriCloseBtn = santriModal ? santriModal.querySelector('.close-btn') : null;
    // Semua tombol ikon mata di tabel Daftar Kelas
    const viewSantriBtns = document.querySelectorAll('.view-santri-btn'); 
    const santriTableBody = document.querySelector('#santri-table tbody');
    const santriModalTitle = document.getElementById('modal-title');
    const daftarKelasTableBody = document.querySelector('.class-list-table tbody'); // Selektor tbody di tabel Daftar Kelas
    const pengajarTableBody = document.querySelector('.teacher-list-table tbody');

    // ----------------------------------------------------
    // II. DEFINISI FUNGSI PEMBANTU
    // ----------------------------------------------------

    function hideProfileModal() {
        if (modalSetting) { modalSetting.style.display = 'none'; }
    }

      /** 🏷️ TAG: 1. FUNGSI BAGIAN TAMBAH JADWAL */

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

    /** 🏷️ TAG: 2. FUNGSI SINKRONISASI REAL-TIME */
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
    
    /** 🏷️ TAG: 3. FUNGSI FILTER STATUS */
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


    /* 🏷️ TAG: 4. FUNGSI TANGGAL REAL-TIME */
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

/* 🏷️ TAG: 5. FUNGSI DETAIL PENDAFTAR (FRONTEND MURNI) */

    /** Mengisi data ke dalam elemen-elemen di modal/popup. */
    function fillModalData(data) {
        // gunakan safeSetText agar TIDAK ERROR jika elemen tidak ditemukan
        safeSetText("pendaftar-nama", data.nama);
        safeSetText("pendaftar-email", data.email);
        safeSetText("pendaftar-no-wa", data.no_wa);
        safeSetText("pendaftar-tempat", data.tempat_lahir);
        safeSetText("pendaftar-tanggal", data.tanggal_lahir);
        safeSetText("pendaftar-status", data.status);
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
    

// 🏷️ TAG: 6. LOGIKA MODAL TAMBAH KELAS (BARU)

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

    
    // 🏷️ TAG: 7. LOGIKA MODAL DAFTAR SANTRI (BARU)

    /**
     * Mengisi konten modal dengan data santri yang diterima.
     * @param {Array<Object>} santriList - Daftar santri [{nama: 'A', usia: 17, status: 'Aktif'}, ...]
     * @param {string} namaKelas - Nama kelas saat ini
     */
    function populateSantriModalContent(santriList, namaKelas) {
        if (santriModalTitle) santriModalTitle.textContent = `Daftar Santri Kelas: ${namaKelas}`;
        if (santriTableBody) santriTableBody.innerHTML = ''; 

        if (!santriList || santriList.length === 0) {
            if (santriTableBody) santriTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Tidak ada santri di kelas ini.</td></tr>';
            return;
        }

        santriList.forEach((s, index) => {
            const row = santriTableBody.insertRow();
            row.insertCell().textContent = `${index + 1}.`;
            row.insertCell().textContent = s.nama;
            row.insertCell().textContent = s.usia;
            row.insertCell().textContent = s.status;
        });
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

// 🏷️ TAG: I. LOGIKA MODAL DAFTAR SANTRI (IMPLEMENTASI)

    if (daftarKelasTableBody && santriModal) {
        daftarKelasTableBody.addEventListener('click', async (e) => {
            const viewButton = e.target.closest('.view-santri-btn'); 
            
            if (viewButton) {
                const kelasId = viewButton.getAttribute('data-kelas-id');
                const row = viewButton.closest('tr');
                
                if (!kelasId || !row) return;

                const namaKelas = row.cells[1] ? row.cells[1].textContent.trim() : 'Tidak Diketahui';

                try {
                    // Tampilkan status 'Loading'
                    populateSantriModalContent(null, namaKelas); 
                    santriModal.style.display = 'block';
                    
                    // Panggil fungsi Backend (ini yang perlu diisi teman Anda)
                    const santriData = await fetchSantriData(kelasId);
                    
                    // Isi modal dengan data yang diterima
                    populateSantriModalContent(santriData, namaKelas);

                } catch (error) {
                    console.error('Gagal mengambil data santri:', error);
                    // Tampilkan pesan error di modal
                    if (santriTableBody) {
                        santriTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Gagal memuat data santri. Silakan coba lagi.</td></tr>`;
                    }
                }
            }
        });
    }

    // Tutup Modal Santri (Tombol X)
    if (santriCloseBtn) {
        santriCloseBtn.addEventListener('click', () => {
            if (santriModal) santriModal.style.display = 'none';
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

    // Tutup Modal Santri jika klik di luar (BARU)
    if (santriModal && event.target === santriModal) { santriModal.style.display = "none"; }

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