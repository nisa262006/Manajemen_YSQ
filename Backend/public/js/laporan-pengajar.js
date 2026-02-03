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
window.exportToExcel = function () {
  alert("Export Excel belum diimplementasikan");
};
