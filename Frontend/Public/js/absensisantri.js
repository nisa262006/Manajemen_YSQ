// santri_absensi.js
document.addEventListener("DOMContentLoaded", initAbsensi);

let RAW_DATA = []; // menyimpan data asli dari server

function initAbsensi() {
  // elemen UI
  const startDateEl = document.getElementById("start-date");
  const endDateEl = document.getElementById("end-date");
  const exportBtn = document.getElementById("export-excel");

  // set default tanggal (mis. 30 hari terakhir)
  const now = new Date();
  const prior = new Date();
  prior.setMonth(now.getMonth() - 6);   // ⟵ 6 bulan kebelakang
  if (startDateEl && !startDateEl.value) startDateEl.value = formatISODate(prior);
  if (endDateEl && !endDateEl.value) endDateEl.value = formatISODate(now);

  // event listeners
  if (startDateEl) startDateEl.addEventListener("change", renderFiltered);
  if (endDateEl) endDateEl.addEventListener("change", renderFiltered);
  if (exportBtn) exportBtn.addEventListener("click", exportFilteredToCSV);

  // load data
  loadAbsensiSantri();
}

/**
 * Ambil data absensi dari backend, simpan di RAW_DATA lalu render.
 */
async function loadAbsensiSantri() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("Token tidak ditemukan — redirect ke login");
    return (window.location.href = "../login.html");
  }

  try {
    const res = await fetch("http://localhost:5000/absensi/santri/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Fetch absensi gagal:", res.status, txt);
      throw new Error("Gagal mengambil data absensi");
    }

    const data = await res.json();
    console.log("Absensi (raw):", data);
    RAW_DATA = Array.isArray(data) ? data : [];

    renderFiltered(); // render sesuai tanggal default
  } catch (err) {
    console.error("ERROR loadAbsensiSantri:", err);
    alert("Gagal memuat data absensi. Cek console untuk detail.");
  }
}

/**
 * Ambil data yang sudah difilter oleh tanggal (start-date / end-date) dan render UI
 */
function renderFiltered() {
  const startDate = parseDateFromInput("start-date");
  const endDate = parseDateFromInput("end-date", true); // inclusive end
  const filtered = RAW_DATA.filter(item => {
    const t = parsePossibleDate(item.tanggal);
    if (!t) return false;
    if (startDate && t < startDate) return false;
    if (endDate && t > endDate) return false;
    return true;
  });

  renderStats(filtered);
  renderTable(filtered);
}

/**
 * Render statistik (total, hadir, izin, sakit, alfa, mustamilah)
 */
function renderStats(list) {
  const total = list.length;
  const hadir = list.filter(i => normalizeStatus(i) === "hadir").length;
  const izin = list.filter(i => normalizeStatus(i) === "izin").length;
  const sakit = list.filter(i => normalizeStatus(i) === "sakit").length;
  const alfa = list.filter(i => ["alpha", "alfa"].includes(normalizeStatus(i))).length;
  const mustamilah = list.filter(i => normalizeStatus(i) === "mustamilah").length;

  // update DOM — gunakan kelas sesuai HTML
  setText(".summary-card-value.total", total);
  setText(".summary-card-value.hadir", hadir);
  setText(".summary-card-value.izin", izin);
  setText(".summary-card-value.sakit", sakit);
  setText(".summary-card-value.alfa", alfa);
  setText(".summary-card-value.mustamilah", mustamilah);
}

/**
 * Render tabel absensi
 */
function renderTable(list) {
  const tbody = document.getElementById("absensi-body") || document.querySelector(".attendance-table tbody");
  if (!tbody) {
    console.warn("elemen tbody absensi tidak ditemukan (id='absensi-body' atau .attendance-table tbody)");
    return;
  }
  tbody.innerHTML = "";

  list.forEach(item => {
    const tanggal = formatTanggalForDisplay(item.tanggal);
    const kelas = item.kelas ?? item.nama_kelas ?? item.kelas ?? "-";
    const jamMulai = item.jam_mulai ?? item.jam_mulai_absensi ?? "-";
    const jamSelesai = item.jam_selesai ?? item.jam_selesai_absensi ?? "-";
    const catatan = item.catatan ?? item.keterangan ?? "-";
    const statusRaw = normalizeStatusReadable(item);
    const statusClass = makeStatusClass(statusRaw);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${tanggal}</td>
      <td>${escapeHtml(kelas)}</td>
      <td>${escapeHtml(jamMulai)} - ${escapeHtml(jamSelesai)}</td>
      <td>${escapeHtml(catatan)}</td>
      <td><span class="${statusClass}">${escapeHtml(statusRaw)}</span></td>
    `;
    tbody.appendChild(tr);
  });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:18px;color:#666">Tidak ada data absensi pada rentang tanggal ini.</td></tr>`;
  }
}

/* -------------------------
   HELPERS / UTILITIES
   ------------------------- */

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function parseDateFromInput(id, endOfDay = false) {
  const el = document.getElementById(id);
  if (!el || !el.value) return null;
  const d = new Date(el.value + (endOfDay ? "T23:59:59" : "T00:00:00"));
  return isNaN(d) ? null : d;
}

function parsePossibleDate(raw) {
  if (!raw) return null;
  // if already Date
  if (raw instanceof Date) return raw;
  // try ISO or yyyy-mm-dd
  const d = new Date(raw);
  if (!isNaN(d)) return d;
  // try split dd/mm/yyyy or dd-mm-yyyy
  const m1 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(raw);
  if (m1) {
    return new Date(`${m1[3]}-${m1[2]}-${m1[1]}T00:00:00`);
  }
  return null;
}

function formatTanggalForDisplay(raw) {
  const d = parsePossibleDate(raw);
  if (!d) return raw ?? "-";
  return d.toLocaleDateString("id-ID");
}

function formatISODate(d) {
  if (!(d instanceof Date)) return "";
  return d.toISOString().slice(0,10);
}

/**
 * Cari value status dari beberapa kemungkinan nama field
 * dan normalisasi ke lowercase singkat: hadir / izin / sakit / alpha / mustamilah / other
 */
function normalizeStatus(item) {
  const raw = (item.status_absensi ?? item.status ?? item.kehadiran ?? item.keterangan ?? item.ket ?? item.status_kehadiran ?? "").toString().trim().toLowerCase();
  if (!raw) return "unknown";
  if (raw.includes("hadir")) return "hadir";
  if (raw.includes("izin")) return "izin";
  if (raw.includes("sakit")) return "sakit";
  if (raw.includes("alpha") || raw.includes("alfa")) return "alpha";
  if (raw.includes("mustamilah")) return "mustamilah";
  return raw; // fallback: kembalikan string apapun (lowercase)
}

/**
 * Sama seperti normalizeStatus tetapi kembalikan versi readble (cap words)
 */
function normalizeStatusReadable(item) {
  const norm = normalizeStatus(item);
  if (norm === "unknown") return "-";
  // cap first letter
  return norm.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * CSS class generator untuk badge status
 */
function makeStatusClass(statusReadable) {
  if (!statusReadable || statusReadable === "-") return "status-unknown";
  return "status-" + statusReadable.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Escape HTML (prevent injection)
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =========================
   EXPORT CSV (Excel)
   - export data currently terfilter
   ========================= */
/* ============================================================
   EXPORT EXCEL — RAPIH SESUAI TABEL
============================================================ */
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
      return alert("Tidak ada data untuk diekspor pada rentang tanggal ini.");
    }
  
    // Susunan kolom sesuai tampilan tabel
    const excelData = filtered.map((item, i) => ({
      No: i + 1,
      Tanggal: formatTanggalForDisplay(item.tanggal),
      Kelas: item.kelas ?? item.nama_kelas ?? "-",
      "Jam Mulai": item.jam_mulai ?? item.jam_mulai_absensi ?? "-",
      "Jam Selesai": item.jam_selesai ?? item.jam_selesai_absensi ?? "-",
      Catatan: item.catatan ?? item.keterangan ?? "-",
      Status: normalizeStatusReadable(item)
    }));
  
    const ws = XLSX.utils.json_to_sheet(excelData);
  
    // Set lebar kolom agar rapi
    ws["!cols"] = [
      { wch: 5 },   // No
      { wch: 14 },  // Tanggal
      { wch: 20 },  // Kelas
      { wch: 12 },  // Jam Mulai
      { wch: 12 },  // Jam Selesai
      { wch: 25 },  // Catatan
      { wch: 12 }   // Status
    ];
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");
  
    XLSX.writeFile(wb, `Absensi_Santri_${formatISODate(new Date())}.xlsx`);
  }
  