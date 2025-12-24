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
    const today = getTodayLocal();
    // Cari semua input tanggal yang mungkin ada di berbagai halaman
    const ids = ["filter-tanggal", "tanggalAbsensiPengajar", "tanggalAbsen"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
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
            document.querySelector(".nama_kelas").textContent = k.nama_kelas || "-";
            
            const detail = await fetchJSON(`${BASE_URL}/kelas/pengajar/detail/${k.id_kelas}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            document.querySelector(".jumlah_santri").textContent = `${detail?.santri?.length || 0} Santri`;
        }

        const jadwalRes = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const jadwalList = jadwalRes?.data || jadwalRes || [];

        const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long" });
        const filteredJadwal = jadwalList.filter(j => 
            j.hari?.toLowerCase() === hariIni.toLowerCase()
        );

        document.querySelector(".kelas-hari-ini").textContent = filteredJadwal.length;
        document.querySelector(".jadwal_kelas").textContent = filteredJadwal.length > 0 ? filteredJadwal[0].hari : "Tidak ada jadwal hari ini";
        
        tbody.innerHTML = "";
        if (filteredJadwal.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada jadwal hari ini.</td></tr>`;
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
    LOAD JADWAL PAGE & FILTER LOGIC
====================================================== */
async function loadFullJadwalPage() {
    const tbody = document.getElementById("table_jadwal");
    const classFilter = document.getElementById("filter-kelas");
    if (!tbody) return;

    try {
        const res = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        allJadwalData = res?.data || res || [];
        
        // Populate dropdown filter kelas secara dinamis
        if (classFilter) {
            const uniqueClasses = [...new Set(allJadwalData.map(j => j.nama_kelas))];
            classFilter.innerHTML = `<option value="">Semua Kelas</option>` + 
                uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join("");
            
            classFilter.onchange = () => applyJadwalFilters(); // Event filter kelas
        }

        const dateFilter = document.getElementById("filter-tanggal");
        if (dateFilter) {
            dateFilter.onchange = () => applyJadwalFilters(); // Event filter tanggal
        }

        renderJadwalTable(allJadwalData);
    } catch (err) {
        console.error("Jadwal page error:", err);
    }
}

function applyJadwalFilters() {
    const classVal = document.getElementById("filter-kelas")?.value;
    const dateVal = document.getElementById("filter-tanggal")?.value;
    
    let filtered = allJadwalData;

    if (classVal) {
        filtered = filtered.filter(j => j.nama_kelas === classVal);
    }

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
        ? `<tr><td colspan="6" style="text-align:center">Tidak ada jadwal yang sesuai.</td></tr>`
        : data.map((j, i) => `
            <tr class="main-row">
                <td>${j.hari ?? "-"}</td>
                <td>${j.jam_mulai ?? "-"} - ${j.jam_selesai ?? "-"}</td>
                <td><strong>${j.nama_kelas ?? "-"}</strong></td>
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
    KALENDER & CATATAN INTERAKTIF
====================================================== */
let selectedDateStr = "";

function initCalendar() {
    const calDays = document.getElementById("calendar-days");
    if (!calDays) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
        if (i === now.getDate()) dayDiv.classList.add("today");
        dayDiv.textContent = i;
        dayDiv.addEventListener("click", () => {
            openReminderModal(i, currentMonth, currentYear);
        });
        calDays.appendChild(dayDiv);
    }
}

function openReminderModal(day, month, year) {
    const modal = document.getElementById("reminderModal");
    if (!modal) return;
    selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateText = document.getElementById("selected-date-text");
    if (dateText) {
        dateText.textContent = `Catatan: ${day} ${new Date(year, month).toLocaleDateString('id-ID', {month:'long'})}`;
    }
    modal.style.display = "flex";
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
      const token = getToken();
      const rekap = await fetchJSON(`${BASE_URL}/absensi/pengajar/rekap`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const elPersen = document.querySelector(".persentase-kehadiran");
      if (elPersen) {
          elPersen.textContent = rekap?.persentase || "0%";
      }
  } catch (e) {
      if (document.querySelector(".persentase-kehadiran")) {
          document.querySelector(".persentase-kehadiran").textContent = "0%";
      }
  }
}

/* ======================================================
    EKSPOR LAPORAN EXCEL (FORMAT XLSX)
====================================================== */
function exportToExcel() {
  if (!allJadwalData || !allJadwalData.length) return alert("Data kosong");

  const dateFilter = document.getElementById("filter-tanggal");
  const selectedDate = dateFilter?.value || new Date().toISOString().split('T')[0];

  // Format Data sesuai permintaan Anda
  const wsData = [
      ["LAPORAN JADWAL KELAS PENGAJAR"],
      ["Tanggal Cetak:", selectedDate],
      [],
      ["No", "Hari", "Waktu", "Nama Kelas", "Kategori", "Pengajar"]
  ];

  allJadwalData.forEach((j, i) => {
      wsData.push([
          i + 1, 
          j.hari || "-", 
          `${j.jam_mulai} - ${j.jam_selesai}`, 
          j.nama_kelas || "-", 
          j.kategori || "-", 
          j.nama_pengajar || "Anda"
      ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Jadwal");

  // Unduh file dengan nama file menyertakan tanggal
  XLSX.writeFile(wb, `Laporan_Jadwal_Pengajar_${selectedDate}.xlsx`);
}


/* ======================================================
    INITIALIZATION
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadPengajarProfile();
  setTodayDateInput(); // Set 24 Desember 2025

  // Inisialisasi Halaman Absensi
  if (document.getElementById("absensiBody")) {
      populateAbsensiFilters();
      document.getElementById("kelasSelect")?.addEventListener("change", loadAbsensiData);
      document.getElementById("tanggalAbsensiPengajar")?.addEventListener("change", loadAbsensiData);
      document.getElementById("simpanAbsenPengajar")?.addEventListener("click", handleSimpanAbsenPengajar);
      document.getElementById("btnSimpanAbsensi")?.addEventListener("click", handleSimpanAbsensiSantri);
  }

  // Inisialisasi Dashboard
  if (document.body.classList.contains("page-dashboard-pengajar")) {
      loadDashboardData();
      initCalendar();
  }

  // Inisialisasi Jadwal Lengkap
  if (document.getElementById("table_jadwal")) {
      loadFullJadwalPage();
  }
});

    // Event Ekspor Excel
    const exportBtn = document.getElementById("export-excel");
    if (exportBtn) {
        exportBtn.onclick = exportToExcel; // Menghubungkan fungsi ekspor
    }

    // Event Simpan Reminder
    const saveBtn = document.getElementById("saveReminderBtn");
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const text = document.getElementById("reminderInput").value;
            if (!text) return alert("Catatan tidak boleh kosong");
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
            } catch (err) {
                alert("Gagal menyimpan catatan.");
            }
        };
    }

/* ======================================================
    LOGOUT FUNCTION
====================================================== */
window.handleLogout = function() {
    if (confirm("Apakah anda yakin ingin keluar?")) {
        localStorage.removeItem("token");
        window.location.replace("/login");
    }
};

////////////////////////////////////////////////////////////////////////
