/* =========================================================
   CONFIG
========================================================= */
const API_BASE = "http://localhost:8000/api";
const token = localStorage.getItem("token");

if (!token) {
  alert("Session habis, silakan login ulang");
  location.href = "/login";
}

/* =========================================================
   GLOBAL STATE
========================================================= */
let RAW_DATA = [];

/* =========================================================
   ELEMENTS
========================================================= */
const tbody = document.getElementById("absensi-body");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const exportBtn = document.getElementById("export-excel");

const totalEl = document.querySelector(".summary-card-value.total");
const hadirEl = document.querySelector(".summary-card-value.hadir");
const izinEl = document.querySelector(".summary-card-value.izin");
const sakitEl = document.querySelector(".summary-card-value.sakit");
const alfaEl = document.querySelector(".summary-card-value.alfa");
const mustamilahEl = document.querySelector(".summary-card-value.mustamilah");

/* =========================================================
   DATE UTIL (ANTI TIMEZONE BUG)
========================================================= */
function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parsePossibleDate(value) {
  if (!value) return null;
  const d = new Date(value + "T12:00:00"); // aman timezone
  return isNaN(d) ? null : d;
}

function parseDateFromInput(id, end = false) {
  const v = document.getElementById(id)?.value;
  if (!v) return null;
  const d = new Date(v + "T12:00:00");
  if (end) d.setHours(23, 59, 59, 999);
  return d;
}

function formatTanggalForDisplay(tanggal) {
  const d = parsePossibleDate(tanggal);
  if (!d) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

/* =========================================================
   DEFAULT DATE (1 BULAN)
========================================================= */
function setDefaultDate(start, end) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);

  start.value = formatDateInput(oneMonthAgo);
  end.value = formatDateInput(today);
}

/* =========================================================
   STATUS NORMALIZER
========================================================= */
function normalizeStatusReadable(item) {
  if (!item.status_absensi) return "-";
  return item.status_absensi
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}

/* =========================================================
   LOAD DATA
========================================================= */
async function loadAbsensiSantri() {
  try {
    const res = await fetch(`${API_BASE}/absensi/santri/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Gagal mengambil data absensi");

    const json = await res.json();
    RAW_DATA = Array.isArray(json.data) ? json.data : [];

    applyFilterAndRender();

  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      `<tr><td colspan="5" style="text-align:center">Gagal memuat data</td></tr>`;
  }
}

/* =========================================================
   FILTER + RENDER
========================================================= */
function applyFilterAndRender() {
  const start = parseDateFromInput("start-date");
  const end = parseDateFromInput("end-date", true);

  const filtered = RAW_DATA.filter(item => {
    const d = parsePossibleDate(item.tanggal);
    if (!d) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });

  renderTable(filtered);
  renderSummary(filtered);
}

/* =========================================================
   TABLE RENDER
========================================================= */
function renderTable(data) {
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML =
      `<tr><td colspan="5" style="text-align:center">Tidak ada data</td></tr>`;
    return;
  }

  data.forEach(item => {
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${formatTanggalForDisplay(item.tanggal)}</td>
        <td>${item.nama_kelas ?? "-"}</td>
        <td>${item.jam_mulai ?? "-"} - ${item.jam_selesai ?? "-"}</td>
        <td>${item.catatan ?? "-"}</td>
        <td>${normalizeStatusReadable(item)}</td>
      </tr>
    `);
  });
}

/* =========================================================
   SUMMARY
========================================================= */
function renderSummary(data) {
  let hadir = 0, izin = 0, sakit = 0, alfa = 0, mustamilah = 0;

  data.forEach(d => {
    switch (d.status_absensi?.toLowerCase()) {
      case "hadir": hadir++; break;
      case "izin": izin++; break;
      case "sakit": sakit++; break;
      case "alfa": alfa++; break;
      case "mustamilah": mustamilah++; break;
    }
  });

  totalEl.textContent = data.length;
  hadirEl.textContent = hadir;
  izinEl.textContent = izin;
  sakitEl.textContent = sakit;
  alfaEl.textContent = alfa;
  mustamilahEl.textContent = mustamilah;
}

/* =========================================================
   EXPORT EXCEL — SESUAI TABEL
========================================================= */
function exportFilteredToCSV() {
  const startDate = parseDateFromInput("start-date");
  const endDate = parseDateFromInput("end-date", true);

  const filtered = RAW_DATA.filter(item => {
    const d = parsePossibleDate(item.tanggal);
    if (!d) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  if (!filtered.length) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  const excelData = filtered.map((item, i) => ({
    No: i + 1,
    Tanggal: formatTanggalForDisplay(item.tanggal),
    Kelas: item.nama_kelas ?? "-",
    "Jam Mulai": item.jam_mulai ?? "-",
    "Jam Selesai": item.jam_selesai ?? "-",
    Catatan: item.catatan ?? "-",
    Status: normalizeStatusReadable(item)
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws["!cols"] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absensi");

  XLSX.writeFile(
    wb,
    `Absensi_Santri_${formatDateInput(new Date())}.xlsx`
  );
}

/* =========================================================
   EVENTS
========================================================= */
startDateInput.addEventListener("change", applyFilterAndRender);
endDateInput.addEventListener("change", applyFilterAndRender);
exportBtn.addEventListener("click", exportFilteredToCSV);

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setDefaultDate(startDateInput, endDateInput);
  loadAbsensiSantri();
});
