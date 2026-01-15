/* =========================================================
   CONFIG & AUTH
========================================================= */
const API_BASE = "/api"; // Gunakan nama API_BASE agar sinkron dengan baris bawah
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
    // Mengimbangi timezone agar mendapatkan tanggal lokal yang benar
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().split('T')[0];

    // Atur start date ke awal bulan (agar riwayat muncul)
    const firstDayOfMonth = localISOTime.substring(0, 8) + "01";
    
    startDateInput.value = firstDayOfMonth; 
    endDateInput.value = localISOTime;
}

/* =========================================================
   LOAD DATA
========================================================= */
async function loadAbsensiSantri() {
    try {
        // 1. Pastikan Path sesuai dengan di absensiroutes.js (/absensi/santri/me)
        const response = await fetch(`${API_BASE}/absensi/santri/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Gagal mengambil data");

        const result = await response.json();
        
        // 2. Ambil .data karena backend mengirim { success: true, data: [...] }
        RAW_DATA = result.data || []; 

        // 3. Panggil fungsi yang benar
        renderTable(RAW_DATA);
        renderSummary(RAW_DATA); // Tadi Anda menulis updateSummary, itu penyebab errornya
        
    } catch (err) {
        console.error("Error loadAbsensiSantri:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Gagal memuat data atau data belum ada.</td></tr>`;
    }
}

/* =========================================================
   FILTER & RENDER
========================================================= */
function applyFilterAndRender() {
    const startVal = startDateInput.value;
    const endVal = endDateInput.value;

    const filtered = RAW_DATA.filter(item => {
        const dbDate = fixDate(item.tanggal); // Format YYYY-MM-DD
        const startVal = startDateInput.value;
        const endVal = endDateInput.value;
    
        // Pastikan perbandingan hanya pada level tanggal
        const isAfterStart = !startVal || dbDate >= startVal;
        const isBeforeEnd = !endVal || dbDate <= endVal;
    
        return isAfterStart && isBeforeEnd;
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
document.addEventListener("DOMContentLoaded", async () => {
    setDefaultDate();
    
    // Tunggu data selesai ditarik baru jalankan filter
    await loadAbsensiSantri();
    
    // Jalankan filter agar tabel menyaring data sesuai tanggal hari ini
    applyFilterAndRender();

    startDateInput.addEventListener("change", applyFilterAndRender);
    endDateInput.addEventListener("change", applyFilterAndRender);
    exportBtn.addEventListener("click", exportToExcel);
});