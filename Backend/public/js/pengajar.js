const BASE_URL = "http://localhost:8000/api";

// 1. Proteksi Halaman: Cek Token saat awal load
if (!localStorage.getItem("token")) {
    window.location.replace("/login");
}

/* ---------- Helper: fetch wrapper ---------- */
async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.status === 204 ? null : res.json();
}

function getToken() {
    return localStorage.getItem("token");
}

// Letakkan di bagian atas pengajar.js
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // Gunakan BASE_URL jika url tidak diawali http
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    const res = await fetch(fullUrl, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...options.headers
        }
    });

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
    }

    return res;
}

/* ================== RESPONSIF =================*/
document.querySelector('.calendar-card')?.addEventListener('click', function () {
    this.classList.toggle('expanded');
});

const menuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");
const overlay = document.getElementById("sidebarOverlay");

if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.add("show");
        overlay.classList.add("show");
    });

    overlay.addEventListener("click", () => {
        sidebar.classList.remove("show");
        overlay.classList.remove("show");
    });
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove("show");
            overlay.classList.remove("show");
        }
    });
});


/* ======================================================
    PENGATURAN TANGGAL & FILTER GLOBAL
====================================================== */
let allJadwalData = []; 
let _jadwalUtama = null;

// Fungsi untuk mendapatkan tanggal lokal format YYYY-MM-DD (Anti Error Zona Waktu)
function getTodayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

function setTodayDateInput() {
    const today = getTodayLocal(); // Menghasilkan format YYYY-MM-DD
    const ids = ["filter-tanggal", "tanggalAbsensiPengajar", "tanggalAbsen", "riwayatTanggal"];
    
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = today; // Langsung mengisi nilai input dengan tanggal hari ini
        }
    });
}

/* ======================================================
    LOAD NAMA & PROFILE (Header & Sidebar)
====================================================== */
async function loadPengajarProfile() {
    try {
        const me = await fetchJSON(`${BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        const nama = me?.profile?.nama || "Pengajar";
        window._currentPengajarId = me?.profile?.id_pengajar; 
        
        document.querySelectorAll(".user-name").forEach(el => {
            el.textContent = nama;
        });
    } catch (err) {
        console.error("Gagal load profile:", err);
    }
}

/* ======================================================
    LOAD DASHBOARD DATA (Stats & Table)
====================================================== */
async function loadDashboardData() {
    const token = getToken();
    const tbody = document.getElementById("dashboard-body");
    if (!tbody) return;

    try {
        const kelasRes = await fetchJSON(`${BASE_URL}/kelas/pengajar/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const kelasList = kelasRes?.data || kelasRes || [];
        
        if (kelasList.length > 0) {
            const k = kelasList[0];
            document.querySelectorAll(".nama_kelas").forEach(el => el.textContent = k.nama_kelas || "-");
            
            const detail = await fetchJSON(`${BASE_URL}/kelas/pengajar/detail/${k.id_kelas}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            document.querySelectorAll(".jumlah_santri").forEach(el => el.textContent = `${detail?.santri?.length || 0} Santri`);
        }

        const jadwalRes = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const jadwalList = jadwalRes?.data || jadwalRes || [];

        const dateInput = document.getElementById("filter-tanggal")?.value;
        const targetDate = dateInput ? new Date(dateInput) : new Date();
        const hariIni = targetDate.toLocaleDateString("id-ID", { weekday: "long" });

        const filteredJadwal = jadwalList.filter(j => 
            j.hari?.toLowerCase() === hariIni.toLowerCase()
        );

        if (document.querySelector(".kelas-hari-ini")) document.querySelector(".kelas-hari-ini").textContent = filteredJadwal.length;
        if (document.querySelector(".jadwal_kelas")) document.querySelector(".jadwal_kelas").textContent = filteredJadwal.length > 0 ? filteredJadwal[0].hari : "Tidak ada jadwal";
        
        tbody.innerHTML = "";
        if (filteredJadwal.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada jadwal untuk hari ${hariIni}.</td></tr>`;
        } else {
            filteredJadwal.forEach(j => {
                tbody.innerHTML += `
                    <tr>
                        <td>${j.hari}</td>
                        <td>${j.jam_mulai} - ${j.jam_selesai}</td>
                        <td><strong>${j.nama_kelas}</strong></td>
                        <td>${j.kategori || "Umum"}</td>
                        <td>${j.materi || "-"}</td>
                    </tr>`;
            });
        }
        loadTeacherAttendanceStats();
    } catch (err) {
        console.error("Gagal load dashboard:", err);
    }
}

/* ======================================================
    LOAD JADWAL PAGE & FILTER LOGIC (FIXED)
====================================================== */
async function loadFullJadwalPage() {
    const tbody = document.getElementById("table_jadwal");
    const classFilter = document.getElementById("filter-kelas");
    const dateFilter = document.getElementById("filter-tanggal");
    
    if (!tbody) return;

    try {
        const res = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        allJadwalData = res?.data || res || [];
        
        if (classFilter) {
            const uniqueClasses = [...new Set(allJadwalData.map(j => j.nama_kelas))];
            classFilter.innerHTML = `<option value="">Semua Kelas</option>` + 
                uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join("");
            
            classFilter.onchange = () => applyJadwalFilters(); 
        }

        if (dateFilter) {
            // Pastikan input tanggal terisi hari ini sebelum filter dijalankan
            if (!dateFilter.value) dateFilter.value = getTodayLocal();
            
            dateFilter.onchange = () => {
                applyJadwalFilters();
                if (document.body.classList.contains("page-dashboard-pengajar")) loadDashboardData();
            };
        }

        // PANGGIL FILTER DI SINI agar tabel langsung terisi berdasarkan tanggal hari ini
        applyJadwalFilters();

    } catch (err) {
        console.error("Jadwal page error:", err);
    }
}

function applyJadwalFilters() {
    const classVal = document.getElementById("filter-kelas")?.value;
    const dateVal = document.getElementById("filter-tanggal")?.value;
    
    let filtered = allJadwalData;

    // Filter Kelas
    if (classVal) {
        filtered = filtered.filter(j => j.nama_kelas === classVal);
    }

    // Filter Tanggal (Hari)
    if (dateVal) {
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayName = days[new Date(dateVal).getDay()];
        filtered = filtered.filter(j => j.hari?.toLowerCase() === dayName.toLowerCase());
    }

    renderJadwalTable(filtered);
}

function renderJadwalTable(data) {
    const tbody = document.getElementById("table_jadwal");
    if (!tbody) return;

    tbody.innerHTML = data.length === 0 
        ? `<tr><td colspan="6" style="text-align:center">Tidak ada jadwal hari ini.</td></tr>`
        : data.map((j, i) => `
            <tr class="main-row">
                <td><strong>${j.nama_kelas ?? "-"}</strong></td>
                <td>${j.hari ?? "-"}</td>
                <td>${j.jam_mulai ?? "-"} - ${j.jam_selesai ?? "-"}</td>
                <td>${j.kategori ?? "-"}</td>
                <td>${j.nama_pengajar ?? "Anda"}</td>
                <td>
                    <button class="btn-detail" data-idx="${i}" style="border:none; background:none; cursor:pointer; color: #275238; font-weight:600;">
                        <i class="fas fa-search"></i> Detail
                    </button>
                </td>
            </tr>
            <tr id="detail-${i}" class="detail-row" style="display:none; background-color: #f9f9f9;">
                <td colspan="6">
                    <div class="detail-container" style="padding: 15px; display: flex; gap: 10px; justify-content: center;">
                        <button onclick="window.location.href='/dashboard/pengajar/absensi'" class="btn-simpan" style="padding: 8px 15px;">Absen Santri</button>
                        <button class="btn-absen-pengajar" style="background: #275238; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                            Simpan Absen Pengajar
                        </button>
                    </div>
                </td>
            </tr>`).join("");

    document.querySelectorAll(".btn-detail").forEach(btn => {
        btn.onclick = () => {
            const idx = btn.dataset.idx;
            const row = document.getElementById(`detail-${idx}`);
            if (row) row.style.display = row.style.display === "none" ? "table-row" : "none";
        };
    });
}

/* ======================================================
    KALENDER & CATATAN INTERAKTIF (FIXED: TANGGAL MUNCUL)
====================================================== */
let selectedDateStr = "";

async function initCalendar() {
    const calDays = document.getElementById("calendar-days");
    if (!calDays) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let noteDates = [];
    try {
        const res = await fetchJSON(`${BASE_URL}/admin/announcement`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        noteDates = (res?.data || []).map(n => {
            const d = new Date(n.tanggal);
            return d.toISOString().split('T')[0];
        });
    } catch (err) {
        console.error("Gagal load riwayat kalender:", err);
    }

    const monthYear = document.getElementById("calendar-month-year");
    if (monthYear) monthYear.textContent = now.toLocaleDateString("id-ID", { month: 'long', year: 'numeric' });

    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    
    calDays.innerHTML = "";
    const emptySlots = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    for (let x = 0; x < emptySlots; x++) {
        calDays.innerHTML += `<div></div>`;
    }

    for (let i = 1; i <= lastDay; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        
        const fullDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        if (i === now.getDate()) dayDiv.classList.add("today");
        
        if (noteDates.includes(fullDateStr)) {
            dayDiv.innerHTML = `${i}<span class="dot-indicator" style="width:5px; height:5px; background:#275238; border-radius:50%; position:absolute; bottom:5px; left:50%; transform:translateX(-50%);"></span>`;
            dayDiv.style.position = "relative";
        } else {
            dayDiv.textContent = i;
        }

        dayDiv.addEventListener("click", () => {
            openReminderModal(i, currentMonth, currentYear);
        });
        calDays.appendChild(dayDiv);
    }

    const todayStr = getTodayLocal();
    loadAnnouncementToArea(todayStr);
}

async function loadAnnouncementToArea(dateStr) {
    const area = document.querySelector(".announcement-card");
    if (!area) return;

    try {
        const res = await fetchJSON(`${BASE_URL}/admin/announcement/date/${dateStr}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        const content = res?.data?.isi;
        if (content) {
            let infoEl = area.querySelector(".info-text-riwayat");
            if (!infoEl) {
                infoEl = document.createElement("p");
                infoEl.className = "info-text-riwayat";
                infoEl.style.fontSize = "12px";
                infoEl.style.marginTop = "10px";
                infoEl.style.textAlign = "center";
                area.appendChild(infoEl);
            }
            infoEl.textContent = content;
        }
    } catch (err) {
        console.error("Gagal load info riwayat area");
    }
}

async function openReminderModal(day, month, year) {
    const modal = document.getElementById("reminderModal");
    const input = document.getElementById("reminderInput");
    const dateText = document.getElementById("selected-date-text");
    if (!modal) return;

    selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateText) {
        dateText.textContent = `Catatan: ${day} ${new Date(year, month).toLocaleDateString('id-ID', {month:'long'})}`;
    }
    
    input.value = "Memuat...";
    modal.style.display = "flex";

    try {
        const res = await fetchJSON(`${BASE_URL}/admin/announcement/date/${selectedDateStr}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        input.value = res?.data?.isi || "";
    } catch (err) {
        input.value = "";
    }
}

window.closeReminderModal = function() {
    const modal = document.getElementById("reminderModal");
    if (modal) modal.style.display = "none";
    const input = document.getElementById("reminderInput");
    if (input) input.value = "";
};

/* ======================================================
    STATISTIK KEHADIRAN PENGAJAR
====================================================== */
async function loadTeacherAttendanceStats() {
    try {
        // Panggil API rekap yang sudah kita buat di backend
        const response = await fetchWithAuth("/absensi/pengajar/rekap");
        const data = await response.json();

        if (data) {
            const hadir = parseInt(data.total_hadir) || 0;
            const izin = parseInt(data.total_izin) || 0;
            const alfa = parseInt(data.total_alfa) || 0;
            const totalSesi = hadir + izin + alfa;

            // Hitung persentase kehadiran
            let persentase = 0;
            if (totalSesi > 0) {
                persentase = Math.round((hadir / totalSesi) * 100);
            }

            // Update ke DOM (HTML)
            const elementPersentase = document.querySelector(".persentase-kehadiran");
            if (elementPersentase) {
                elementPersentase.innerText = `${persentase}%`;
            }
        }
    } catch (err) {
        console.error("Gagal memuat statistik kehadiran:", err);
    }
}

async function loadKelasHariIni() {
    try {
        const hariIni = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
        // Misal API jadwal pengajar berdasarkan hari
        const response = await fetchWithAuth(`/jadwal/pengajar/me/hari/${hariIni}`);
        const result = await response.json();

        if (result.success) {
            const count = result.data.length;
            const elementKelas = document.querySelector(".kelas-hari-ini");
            if (elementKelas) {
                elementKelas.innerText = count;
            }
        }
    } catch (err) {
        console.error("Gagal memuat jumlah kelas hari ini:", err);
    }
}

/* ======================================================
    EKSPOR LAPORAN EXCEL
====================================================== */
function exportToExcel() {
    if (!allJadwalData || !allJadwalData.length) return alert("Data kosong");
    const dateFilter = document.getElementById("filter-tanggal");
    const selectedDate = dateFilter?.value || getTodayLocal();

    const wsData = [
        ["LAPORAN JADWAL KELAS PENGAJAR"],
        ["Tanggal Cetak:", selectedDate],
        [],
        ["No", "Hari", "Waktu", "Nama Kelas", "Kategori", "Pengajar"]
    ];

    allJadwalData.forEach((j, i) => {
        wsData.push([i + 1, j.hari || "-", `${j.jam_mulai} - ${j.jam_selesai}`, j.nama_kelas || "-", j.kategori || "-", j.nama_pengajar || "Anda"]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Jadwal");
    XLSX.writeFile(wb, `Laporan_Jadwal_Pengajar_${selectedDate}.xlsx`);
}

/* ======================================================
    INITIALIZATION
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadPengajarProfile();
    setTodayDateInput(); 

    if (document.body.classList.contains("page-dashboard-pengajar")) {
        loadDashboardData();
        initCalendar(); 
    }

    if (document.getElementById("table_jadwal") || document.getElementById("filter-tanggal")) {
        loadFullJadwalPage();
    }

    const exportBtn = document.getElementById("export-excel");
    if (exportBtn) exportBtn.onclick = exportToExcel;

    const saveReminderBtn = document.getElementById("saveReminderBtn");
    if (saveReminderBtn) {
        saveReminderBtn.onclick = async () => {
            const text = document.getElementById("reminderInput").value;
            if (!text.trim()) return alert("Catatan tidak boleh kosong");
            try {
                await fetchJSON(`${BASE_URL}/admin/announcement`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json", 
                        Authorization: `Bearer ${getToken()}` 
                    },
                    body: JSON.stringify({ tanggal: selectedDateStr, isi: text })
                });
                alert("Catatan berhasil disimpan!");
                closeReminderModal();
                initCalendar(); 
            } catch (err) {
                alert("Gagal menyimpan catatan.");
            }
        };
    }
    document.addEventListener("DOMContentLoaded", async () => {
        // Fungsi lainnya...
        await loadTeacherAttendanceStats(); // Tarik data kehadiran
        await loadKelasHariIni();          // Tarik data jadwal hari ini
    });
});


/* ======================================================
    LOGOUT FUNCTION
====================================================== */
window.handleLogout = function() {
    // 1. Hapus token dari localStorage
    localStorage.removeItem("token");
    
    // 2. (Opsional) Hapus data lain jika ada, misal:
    // localStorage.removeItem("user_role");
    
    // 3. Arahkan ke halaman login
    // Menggunakan replace agar user tidak bisa klik "Back" kembali ke dashboard
    window.location.replace("/login");
};

const mobileMenuBtn = document.getElementById("mobileMenuBtn");

mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
});
