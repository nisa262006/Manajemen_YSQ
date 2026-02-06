// ================= KONFIG DASAR =================
const API = "/api";
const token = localStorage.getItem("token");

// ================= STATE FILTER =================
let filterState = {
  kategori: "",
  id_kelas: "",
  periode: ""
};

// ================= ON LOAD =================
document.addEventListener("DOMContentLoaded", () => {
  setTanggal();
  generatePeriodeFilter();
  loadKelasUntukLaporan();
  loadPeriodeLaporan();
  loadRekapLaporan();

  document.getElementById("filter-periode")?.addEventListener("change", updateFilter);
  document.getElementById("filter-kelas")?.addEventListener("change", updateFilter);
  document.getElementById("filter-kategori")?.addEventListener("change", updateFilter);
});

// ================= UTIL =================
function setTanggal() {
  const el = document.getElementById("tanggal-otomatis");
  if (!el) return;
  el.textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// ================= PERIODE =================
function generatePeriodeFilter() {
  const select = document.getElementById("filter-periode");
  if (!select) return;

  const now = new Date();
  const y = now.getFullYear();

  const list = [
    `Ganjil ${y - 1}/${y}`,
    `Genap ${y - 1}/${y}`,
    `Ganjil ${y}/${y + 1}`,
    `Genap ${y}/${y + 1}`
  ];

  select.innerHTML = `<option value="">-- Semua Periode --</option>`;
  list.forEach(p => {
    select.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// ambil periode real dari server (rapor yg sudah ada)
async function loadPeriodeLaporan() {
  const select = document.getElementById("filter-periode");
  if (!select) return;

  try {
    const res = await fetch(`${API}/rapor/laporan/periode`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    data.forEach(p => {
      if (![...select.options].some(o => o.value === p)) {
        select.innerHTML += `<option value="${p}">${p}</option>`;
      }
    });
  } catch (err) {
    console.error("Gagal load periode:", err);
  }
}

// ================= KELAS =================
async function loadKelasUntukLaporan() {
  const select = document.getElementById("filter-kelas");
  if (!select) return;

  try {
    const res = await fetch(`${API}/kelas/pengajar/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    select.innerHTML = `<option value="">-- Semua Kelas --</option>`;
    data.forEach(k => {
      select.innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;
    });
  } catch (err) {
    console.error("Gagal load kelas:", err);
  }
}

// ================= UPDATE FILTER =================
function updateFilter() {
  filterState.periode = document.getElementById("filter-periode")?.value || "";
  filterState.id_kelas = document.getElementById("filter-kelas")?.value || "";
  filterState.kategori = document.getElementById("filter-kategori")?.value || "";

  loadRekapLaporan();
}

// ================= LOAD LAPORAN =================
async function loadRekapLaporan() {
  const tbody = document.getElementById("laporan-tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center;">Memuat data...</td>
    </tr>
  `;

  try {
    const params = new URLSearchParams();
    if (filterState.periode) params.append("periode", filterState.periode);
    if (filterState.id_kelas) params.append("id_kelas", filterState.id_kelas);
    if (filterState.kategori) params.append("kategori", filterState.kategori);

    const res = await fetch(
      `${API}/rapor/laporan/rekap-pengajar?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    // ====== STATISTIK ======
    document.getElementById("stat-total-santri").textContent =
      data.summary?.total_santri || 0;

    document.getElementById("stat-pending").textContent =
      data.summary?.belum_selesai || 0;

    document.getElementById("stat-done").textContent =
      data.summary?.selesai || 0;

    // ====== TABEL ======
    tbody.innerHTML = "";

    if (!data.list || data.list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;">Data tidak ditemukan</td>
        </tr>
      `;
      return;
    }

    data.list.forEach(row => {
      const statusClass =
        row.status_rapor === "Selesai" ? "status-done" : "status-pending";

      tbody.innerHTML += `
        <tr>
          <td style="text-align:left;">${row.nama_santri}</td>
          <td>${row.nilai_tahsin ?? 0}</td>
          <td>${row.juz_tahfidz ?? 0}</td>
          <td>${row.nilai_presensi ?? 0}%</td>
          <td>
            <span class="ysq-badge-status ${statusClass}">
              ${row.status_rapor}
            </span>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Gagal load laporan:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:red;">
          Terjadi kesalahan memuat data
        </td>
      </tr>
    `;
  }
}

// ================= EXPORT (OPSIONAL) =================
// ================= EXPORT EXCEL =================
window.exportToExcel = async function () {
    try {
      const params = new URLSearchParams();
      if (filterState.periode) params.append("periode", filterState.periode);
      if (filterState.id_kelas) params.append("id_kelas", filterState.id_kelas);
      if (filterState.kategori) params.append("kategori", filterState.kategori);
  
      const res = await fetch(
        `${API}/rapor/laporan/rekap-pengajar?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const data = await res.json();
      if (!data.list || data.list.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
      }
  
      // ================= BUAT WORKBOOK =================
      const wb = XLSX.utils.book_new();
      const wsData = [];
  
      // ===== JUDUL =====
      wsData.push(["LAPORAN MONITORING SANTRI"]);
      wsData.push([]);
  
      // ===== INFO FILTER =====
      wsData.push([
        "Periode",
        filterState.periode || "Semua",
        "",
        "Kategori",
        filterState.kategori || "Semua",
        "",
        "Kelas",
        document.querySelector("#filter-kelas option:checked")?.textContent || "Semua"
      ]);
  
      wsData.push([]);
  
      // ===== GROUP BY KELAS =====
      const grouped = {};
      data.list.forEach(row => {
        const kelas = row.nama_kelas || "-";
        if (!grouped[kelas]) grouped[kelas] = [];
        grouped[kelas].push(row);
      });
  
      Object.keys(grouped).forEach(kelas => {
        // Judul kelas
        wsData.push([`KELAS: ${kelas.toUpperCase()}`]);
        wsData.push([]);
  
        // Header tabel
        wsData.push([
          "No",
          "Nama Santri",
          "Tahsin",
          "Tahfidz (Juz)",
          "Kehadiran (%)",
          "Status Rapor"
        ]);
  
        grouped[kelas].forEach((row, i) => {
          wsData.push([
            i + 1,
            row.nama_santri,
            row.nilai_tahsin ?? 0,
            row.juz_tahfidz ?? 0,
            row.nilai_presensi ?? 0,
            row.status_rapor
          ]);
        });
  
        wsData.push([]);
      });
  
      // ================= CREATE SHEET =================
      const ws = XLSX.utils.aoa_to_sheet(wsData);
  
      // Lebar kolom biar rapi
      ws["!cols"] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
  
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  
      // ================= DOWNLOAD =================
      const filename =
        "Laporan_Monitoring_" +
        (filterState.periode || "Semua_Periode").replace(/\s+/g, "_") +
        ".xlsx";
  
      XLSX.writeFile(wb, filename);
  
    } catch (err) {
      console.error(err);
      alert("Gagal export laporan");
    }
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
  
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }
  
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.querySelector(".sidebar-footer li");
  
    if (logoutBtn) {
      logoutBtn.style.cursor = "pointer";
  
      logoutBtn.addEventListener("click", () => {
        // OPTIONAL: bersihkan session/localStorage kalau ada
        localStorage.clear();
        sessionStorage.clear();
  
        // redirect ke login
        window.location.href = "/login";
      });
    }
  });
  