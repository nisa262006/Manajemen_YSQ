/* =========================================================
   CONFIG & AUTH
========================================================= */
const BASE_URL = "/api";
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
const $ = (id) => document.getElementById(id);
const tbody = $("absensi-body");
const startDateInput = $("start-date");
const endDateInput = $("end-date");
const exportBtn = $("export-excel");

// Summary Elements
const totalEl = $("sum-total");
const hadirEl = $("sum-hadir");
const izinEl = $("sum-izin");
const sakitEl = $("sum-sakit");
const alfaEl = $("sum-alfa");
const mustamiahEl = $("sum-mustamiah");

/* =========================================================
   UTILITIES (ANTI TIMEZONE BUG)
========================================================= */

// Mengunci tanggal agar sesuai Database (Tanpa konversi Jam)
function fixDate(dateString) {
    if (!dateString) return "";
    return dateString.substring(0, 10);
}

// Format Tanggal untuk Tampilan Tabel (contoh: 24 Desember 2025)
function formatTanggalDisplay(dateString) {
    const raw = fixDate(dateString);
    if (!raw) return "-";
    const [y, m, d] = raw.split("-");
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function setDefaultDate() {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 1);

    const formatYMD = (d) => {
        return d.toISOString().split('T')[0];
    };

    startDateInput.value = formatYMD(past);
    endDateInput.value = formatYMD(now);
}

/* =========================================================
   LOAD DATA
========================================================= */
async function loadAbsensiSantri() {
    try {
        const res = await fetch(`${API_BASE}/absensi/santri/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Gagal mengambil data");

        const json = await res.json();
        RAW_DATA = Array.isArray(json.data) ? json.data : (json.absensi || []);

        applyFilterAndRender();
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" align="center">Gagal memuat data atau data kosong</td></tr>`;
    }
}

/* =========================================================
   FILTER & RENDER
========================================================= */
function applyFilterAndRender() {
    const startVal = startDateInput.value;
    const endVal = endDateInput.value;

    const filtered = RAW_DATA.filter(item => {
        const dbDate = fixDate(item.tanggal);
        const matchStart = !startVal || dbDate >= startVal;
        const matchEnd = !endVal || dbDate <= endVal;
        return matchStart && matchEnd;
    });

    // Urutkan Tanggal Terbaru di Atas
    filtered.sort((a, b) => fixDate(b.tanggal).localeCompare(fixDate(a.tanggal)));

    renderTable(filtered);
    renderSummary(filtered);
}

function renderTable(data) {
    tbody.innerHTML = "";
    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="5" align="center">Tidak ada riwayat absensi pada periode ini</td></tr>`;
        return;
    }

    data.forEach(item => {
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${formatTanggalDisplay(item.tanggal)}</td>
                <td>${item.nama_kelas ?? "-"}</td>
                <td>${item.jam_mulai ?? "-"} - ${item.jam_selesai ?? "-"}</td>
                <td>${item.catatan ?? "-"}</td>
                <td><span class="status-badge ${item.status_absensi?.toLowerCase()}">${item.status_absensi}</span></td>
            </tr>
        `);
    });
}

function renderSummary(data) {
    let counts = { hadir: 0, izin: 0, sakit: 0, alfa: 0, mustamiah: 0 };

    data.forEach(item => {
        const status = item.status_absensi?.toLowerCase();
        if (status === "hadir") counts.hadir++;
        else if (status === "izin") counts.izin++;
        else if (status === "sakit") counts.sakit++;
        else if (status === "alfa" || status === "tidak hadir") counts.alfa++;
        else if (status === "mustamiah") counts.mustamiah++;
    });

    totalEl.textContent = data.length;
    hadirEl.textContent = counts.hadir;
    izinEl.textContent = counts.izin;
    sakitEl.textContent = counts.sakit;
    alfaEl.textContent = counts.alfa;
    mustamiahEl.textContent = counts.mustamiah;
}

/* =========================================================
   EXPORT EXCEL
========================================================= */
function exportToExcel() {
    const startVal = startDateInput.value;
    const endVal = endDateInput.value;

    const filtered = RAW_DATA.filter(item => {
        const dbDate = fixDate(item.tanggal);
        return (!startVal || dbDate >= startVal) && (!endVal || dbDate <= endVal);
    });

    if (!filtered.length) return alert("Data kosong, tidak bisa export");

    const excelData = filtered.map((item, i) => ({
        "No": i + 1,
        "Tanggal": fixDate(item.tanggal),
        "Kelas": item.nama_kelas || "-",
        "Jam": `${item.jam_mulai} - ${item.jam_selesai}`,
        "Status": item.status_absensi,
        "Catatan": item.catatan || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Absensi");
    XLSX.writeFile(wb, `Riwayat_Absensi_Santri_${startVal}_to_${endVal}.xlsx`);
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    setDefaultDate();
    loadAbsensiSantri();

    startDateInput.addEventListener("change", applyFilterAndRender);
    endDateInput.addEventListener("change", applyFilterAndRender);
    exportBtn.addEventListener("click", exportToExcel);
});