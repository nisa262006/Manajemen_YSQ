import { apiGet } from "./apiService.js";

/* ===============================
   HELPER
================================ */
const $ = (id) => document.getElementById(id);

function setDefaultDate(startInput, endInput) {
    if (!startInput || !endInput) return;
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 1);
    const formatYMD = (d) => d.toISOString().split('T')[0];
    startInput.value = formatYMD(past);
    endInput.value = formatYMD(now);
}

function fixDateDisplay(dateString) {
    if (!dateString) return "-";
    // Mengambil YYYY-MM-DD secara mentah untuk menghindari bug timezone
    return dateString.substring(0, 10);
}

/* ======================================================
   LOGIKA ABSENSI PENGAJAR
====================================================== */
function initAbsensiPengajar() {
    const selectData = $("select-data");
    // Cek apakah ini halaman riwayat absensi pengajar
    if (!selectData || !$("btn-export-absensi") || document.body.getAttribute("data-page") !== "riwayat-absensi") return;

    const dateInputs = document.querySelectorAll('.attendance-filter-horizontal input[type="date"]');
    const startDate = dateInputs[0];
    const endDate = dateInputs[1];
    const tableBody = $("table-body");
    const sumHadir = $("sum-hadir");
    const sumIzin = $("sum-izin");
    const sumSakit = $("sum-dynamic");
    const sumAlfa = $("sum-alfa");
    const btnExport = $("btn-export-absensi");

    let allAbsensi = [];
    let filteredAbsensi = [];

    async function init() {
        setDefaultDate(startDate, endDate);
        await Promise.all([loadPengajar(), loadAbsensi()]);
        applyFilter();
    }

    async function loadPengajar() {
        const res = await apiGet("/pengajar");
        const list = res?.data ?? res ?? [];
        selectData.innerHTML = `<option value="">Semua Pengajar</option>`;
        list.forEach(p => {
            selectData.innerHTML += `<option value="${p.id_pengajar}">${p.nama}</option>`;
        });
    }

    async function loadAbsensi() {
        const res = await apiGet("/absensi/pengajar/all");
        allAbsensi = res?.data ?? res ?? [];
    }

    function applyFilter() {
        const startVal = startDate.value;
        const endVal = endDate.value;
        const pengajarId = selectData.value;

        filteredAbsensi = allAbsensi.filter(a => {
            const dbDate = fixDateDisplay(a.tanggal);
            const matchPengajar = !pengajarId || String(a.id_pengajar) === pengajarId;
            const matchStart = !startVal || dbDate >= startVal;
            const matchEnd = !endVal || dbDate <= endVal;
            return matchPengajar && matchStart && matchEnd;
        });

        renderTable();
        renderSummary();
    }

function renderTable() {
    tableBody.innerHTML = filteredAbsensi.length ? "" : `<tr><td colspan="5" align="center">Tidak ada data</td></tr>`;

    // Ambil data pengajar dari select untuk fallback
    const selectedPengajarName = selectData.options[selectData.selectedIndex].text;

    filteredAbsensi.forEach(a => {
        // PERBAIKAN DI SINI:
        // 1. Cek nama_pengajar dari API absensi
        // 2. Jika tidak ada, coba cari nama dari list pengajar (jika ada array global)
        // 3. Jika sedang filter 1 pengajar, gunakan nama dari dropdown
        let displayName = a.nama_pengajar;

        if (!displayName || displayName === "-") {
            if (selectData.value !== "") {
                displayName = selectedPengajarName;
            } else {
                // Jika "Semua Pengajar", tapi API tidak kasi nama_pengajar,
                // ini fallback terakhir (waspada jika a.nama berisi 'ngaji')
                displayName = a.nama || "-";
            }
        }

        tableBody.innerHTML += `
            <tr>
                <td>${fixDateDisplay(a.tanggal)}</td>
                <td style="font-weight: bold;">${displayName}</td>
                <td>${a.nama_kelas ?? "-"}</td>
                <td><span class="status-badge ${a.status_absensi?.toLowerCase()}">${a.status_absensi}</span></td>
                <td>${a.catatan ?? "-"}</td>
            </tr>`;
    });
}

    function renderSummary() {
        sumHadir.textContent = filteredAbsensi.filter(a => a.status_absensi === "Hadir").length;
        sumIzin.textContent = filteredAbsensi.filter(a => a.status_absensi === "Izin").length;
        sumSakit.textContent = filteredAbsensi.filter(a => a.status_absensi === "Sakit").length;
        sumAlfa.textContent = filteredAbsensi.filter(a => ["Alfa", "Tidak Hadir"].includes(a.status_absensi)).length;
    }

    function exportToExcel() {
        if (!filteredAbsensi.length) return alert("Data kosong");

        const selectedOption = selectData.options[selectData.selectedIndex];
        const pengajarName = selectedOption.text;
        const isSemua = selectData.value === "";
        const rangeTanggal = `${startDate.value}_hingga_${endDate.value}`;
        const fileName = `Laporan_Absensi_Pengajar_${pengajarName.replace(/\s+/g, '_')}_${rangeTanggal}.xlsx`;

        // 1. Header Laporan
        let wsData = [
            ["LAPORAN ABSENSI PENGAJAR"],
            ["Nama Pengajar:", pengajarName],
            ["Periode:", `${startDate.value} s/d ${endDate.value}`],
            [],
            ["DATA DETAIL KEHADIRAN"],
            ["No", "Tanggal", "Nama Pengajar", "Kelas", "Status", "Catatan"]
        ];

        // 2. Masukkan Data Detail
        filteredAbsensi.forEach((a, i) => {
            const rowName = a.nama_pengajar || a.nama || (isSemua ? "-" : pengajarName);
            wsData.push([
                i + 1,
                fixDateDisplay(a.tanggal),
                rowName,
                a.nama_kelas ?? "-",
                a.status_absensi,
                a.catatan ?? "-"
            ]);
        });

        // 3. LOGIKA REKAP PER PENGAJAR (Ini bagian yang Anda minta)
        // Bagian ini akan muncul di bawah tabel detail
        wsData.push([], ["REKAPITULASI TOTAL PER PENGAJAR"], ["Nama Pengajar", "Hadir", "Izin", "Sakit", "Tidak Hadir (Alfa)"]);

        // Mengelompokkan data berdasarkan nama pengajar
        const rekapPerPengajar = filteredAbsensi.reduce((acc, curr) => {
            const nama = curr.nama_pengajar || curr.nama || (isSemua ? "Tidak Diketahui" : pengajarName);
            if (!acc[nama]) {
                acc[nama] = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
            }

            const status = curr.status_absensi?.toLowerCase();
            if (status === "hadir") acc[nama].hadir++;
            else if (status === "izin") acc[nama].izin++;
            else if (status === "sakit") acc[nama].sakit++;
            else if (status === "alfa" || status === "tidak hadir") acc[nama].alfa++;

            return acc;
        }, {});

        // Masukkan hasil pengelompokan ke dalam array wsData
        Object.keys(rekapPerPengajar).forEach(nama => {
            const r = rekapPerPengajar[nama];
            wsData.push([nama, r.hadir, r.izin, r.sakit, r.alfa]);
        });

        // 4. Generate File Excel
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
        XLSX.writeFile(wb, fileName);
    }

    selectData.addEventListener("change", applyFilter);
    startDate.addEventListener("change", applyFilter);
    endDate.addEventListener("change", applyFilter);
    btnExport?.addEventListener("click", exportToExcel);

    init();
}

/* ======================================================
   LOGIKA ABSENSI SANTRI
====================================================== */
/* ======================================================
   LOGIKA ABSENSI SANTRI (FIXED)
====================================================== */
function initAbsensiSantri() {
    const pilihKelas = $("pilih_kelas");
    const pilihSantri = $("pilih_santri");
    if (!pilihKelas || !pilihSantri) return;

    const dateInputs = document.querySelectorAll('.attendance-filter-horizontal input[type="date"]');
    const startDate = dateInputs[0];
    const endDate = dateInputs[1];
    const tableBody = $("table-body");
    const sumHadir = $("sum-hadir");
    const sumIzin = $("sum-izin");
    const sumMust = $("sum-dynamic");
    const sumAlfa = $("sum-alfa");
    const btnExport = $("btn-export-absensi-siswa");

    let allAbsensi = [];
    let allSantri = [];
    let allKelas = [];
    let filteredAbsensi = [];

    async function init() {
        setDefaultDate(startDate, endDate);
        // PERBAIKAN: Menambahkan apiGet("/kelas") ke dalam array Promise
        const [absRes, santriRes, kelasRes] = await Promise.all([
            apiGet("/absensi/santri/all"),
            apiGet("/santri?limit=9999"),
            apiGet("/kelas")
        ]);

        allAbsensi = absRes?.data ?? absRes ?? [];
        allSantri = santriRes?.data ?? santriRes ?? [];
        allKelas = kelasRes?.data ?? kelasRes ?? [];

        renderDropdownKelas();
        renderDropdownSantri();
        applyFilter();
    }

    function renderDropdownKelas() {
        pilihKelas.innerHTML = `<option value="">Semua Kelas</option>`;
        allKelas.forEach(k => {
            // Hilangkan karakter "-" dari dropdown
            if (k.nama_kelas && k.nama_kelas !== "-") {
                pilihKelas.innerHTML += `<option value="${k.nama_kelas}">${k.nama_kelas}</option>`;
            }
        });
    }

    function renderDropdownSantri() {
        const kls = pilihKelas.value;
        const list = allSantri.filter(s => s.status === "aktif" && (!kls || s.nama_kelas === kls));
        pilihSantri.innerHTML = `<option value="">Semua Santri</option>`;
        list.forEach(s => {
            pilihSantri.innerHTML += `<option value="${s.nama}">${s.nama}</option>`;
        });
    }

    function applyFilter() {
        const startVal = startDate.value;
        const endVal = endDate.value;
        const kls = pilihKelas.value;
        const snt = pilihSantri.value;

        filteredAbsensi = allAbsensi.filter(a => {
            const dbDate = fixDateDisplay(a.tanggal);
            const matchKls = !kls || a.nama_kelas === kls;
            const matchSnt = !snt || a.nama_santri === snt;
            const matchStart = !startVal || dbDate >= startVal;
            const matchEnd = !endVal || dbDate <= endVal;
            return matchKls && matchSnt && matchStart && matchEnd;
        });

        renderTable();
        renderSummary();
    }

    function renderTable() {
        tableBody.innerHTML = filteredAbsensi.length ? "" : `<tr><td colspan="5" align="center">Tidak ada data</td></tr>`;

        // Urutkan berdasarkan tanggal terbaru
        const sorted = [...filteredAbsensi].sort((a, b) => fixDateDisplay(b.tanggal).localeCompare(fixDateDisplay(a.tanggal)));

        sorted.forEach(a => {
            // PERBAIKAN TAMPILAN: Hilangkan strip "-"
            const displayKelas = (a.nama_kelas && a.nama_kelas !== "-") ? a.nama_kelas : "Tanpa Kelas";
            const displayCatatan = (a.catatan && a.catatan !== "-") ? a.catatan : "";

            tableBody.innerHTML += `
                <tr>
                    <td>${fixDateDisplay(a.tanggal)}</td>
                    <td>${a.nama_santri}</td>
                    <td>${displayKelas}</td>
                    <td><span class="status-badge ${a.status_absensi?.toLowerCase()}">${a.status_absensi}</span></td>
                    <td>${displayCatatan}</td>
                </tr>`;
        });
    }

    function renderSummary() {
        sumHadir.textContent = filteredAbsensi.filter(a => a.status_absensi === "Hadir").length;
        sumIzin.textContent = filteredAbsensi.filter(a => a.status_absensi === "Izin").length;
        sumMust.textContent = filteredAbsensi.filter(a => a.status_absensi === "Mustamiah").length;
        sumAlfa.textContent = filteredAbsensi.filter(a => ["Alfa", "Tidak Hadir"].includes(a.status_absensi)).length;
    }

    function exportToExcel() {
        if (!filteredAbsensi.length) return alert("Data kosong");

        const rangeTanggal = `${startDate.value}_s_d_${endDate.value}`;
        const fileName = `Laporan_Absensi_Santri_${rangeTanggal}.xlsx`;

        // 1. Header Laporan
        let wsData = [
            ["LAPORAN ABSENSI SANTRI"],
            ["Periode:", `${startDate.value} s/d ${endDate.value}`],
            [],
            ["DATA DETAIL KEHADIRAN"],
            ["No", "Tanggal", "Nama Santri", "Kelas", "Status", "Catatan"]
        ];

        // 2. Masukkan Data Detail (Tabel Atas)
        filteredAbsensi.forEach((a, i) => {
            wsData.push([
                i + 1,
                fixDateDisplay(a.tanggal),
                a.nama_santri,
                a.nama_kelas ?? "-",
                a.status_absensi,
                a.catatan ?? "-"
            ]);
        });

        // 3. LOGIKA REKAPITULASI PER SANTRI (Agar mirip Gambar 1)
        wsData.push([], ["REKAPITULASI TOTAL PER SANTRI"], ["Nama Santri", "Hadir", "Izin", "Sakit", "Mustami'ah", "Alfa/Tidak Hadir"]);

        // Mengelompokkan data berdasarkan nama santri
        const rekapPerSantri = filteredAbsensi.reduce((acc, curr) => {
            const nama = curr.nama_santri || "Tanpa Nama";
            if (!acc[nama]) {
                acc[nama] = { hadir: 0, izin: 0, sakit: 0, mustamiah: 0, alfa: 0 };
            }

            const status = curr.status_absensi?.toLowerCase();
            if (status === "hadir") acc[nama].hadir++;
            else if (status === "izin") acc[nama].izin++;
            else if (status === "sakit") acc[nama].sakit++;
            else if (status === "mustamiah") acc[nama].mustamiah++;
            else if (status === "alfa" || status === "tidak hadir") acc[nama].alfa++;

            return acc;
        }, {});

        // Masukkan hasil rekap ke dalam array wsData
        Object.keys(rekapPerSantri).forEach(nama => {
            const r = rekapPerSantri[nama];
            wsData.push([nama, r.hadir, r.izin, r.sakit, r.mustamiah, r.alfa]);
        });

        // 4. Generate & Download File Excel
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
        XLSX.writeFile(wb, fileName);
    }

    pilihKelas.addEventListener("change", () => { renderDropdownSantri(); applyFilter(); });
    pilihSantri.addEventListener("change", applyFilter);
    startDate.addEventListener("change", applyFilter);
    endDate.addEventListener("change", applyFilter);
    btnExport?.addEventListener("click", exportToExcel);

    init();
}

/* ===============================
   RUN ON LOAD
================================ */
document.addEventListener("DOMContentLoaded", () => {
    initAbsensiPengajar();
    initAbsensiSantri();
});