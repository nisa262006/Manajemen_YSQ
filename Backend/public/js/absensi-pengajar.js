const BASE_URL = "http://localhost:8000/api";

// 1. Proteksi Halaman
if (!localStorage.getItem("token")) {
    window.location.replace("/login");
}

/* ---------- Helper: fetch wrapper ---------- */
async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, opts);
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.body = await res.json().catch(() => ({}));
        throw err;
    }
    return res.status === 204 ? null : res.json();
}

function getToken() {
    return localStorage.getItem("token");
}

/* ======================================================
    PENGATURAN TANGGAL & GLOBAL STATE
====================================================== */
let _jadwalUtama = null; 

function setTodayDateInput() {
    const dateInputs = ["filter-tanggal", "tanggalAbsensiPengajar", "tanggalAbsen", "riwayatTanggal"];
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 10);

    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = localISOTime;
    });
}

/* ======================================================
    LOAD PROFILE & UI
====================================================== */
async function loadPengajarProfile() {
    try {
        const me = await fetchJSON(`${BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const nama = me?.profile?.nama || "Pengajar";
        window._currentPengajarId = me?.profile?.id_pengajar; 
        document.querySelectorAll(".user-name").forEach(el => el.textContent = nama);
    } catch (err) {
        console.error("Gagal load profile:", err);
    }
}

/* ======================================================
    ABSENSI SANTRI & PENGAJAR (Halaman Absensi)
====================================================== */

async function populateAbsensiFilters() {
    const kelasSelect = document.getElementById("kelasSelect");
    const riwayatKelasSelect = document.getElementById("riwayatKelasSelect");
    
    try {
        const res = await fetchJSON(`${BASE_URL}/kelas/pengajar/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        const list = res?.data || res || [];
        
        const optionsHtml = '<option value="">-- Semua Kelas --</option>' + 
            list.map(k => `<option value="${k.id_kelas}">${k.nama_kelas}</option>`).join("");

        if (kelasSelect) kelasSelect.innerHTML = optionsHtml;
        if (riwayatKelasSelect) riwayatKelasSelect.innerHTML = optionsHtml;
    } catch (err) {
        console.error("Gagal load filter kelas:", err);
    }
}

async function loadAbsensiData() {
    const id_kelas = document.getElementById("kelasSelect")?.value;
    const tanggal = document.getElementById("tanggalAbsensiPengajar")?.value;
    const tbody = document.getElementById("absensiBody");

    if (!id_kelas || !tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Memuat data...</td></tr>';
        const res = await fetchJSON(`${BASE_URL}/kelas/pengajar/detail/${id_kelas}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        const santri = res?.santri || [];
        const jadwal = res?.jadwal || [];
        const selectedDay = new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long" });
        _jadwalUtama = jadwal.find(j => j.hari.toLowerCase() === selectedDay.toLowerCase()) || jadwal[0];

        if (document.getElementById("jamAbsenDisplay") && _jadwalUtama) {
            document.getElementById("jamAbsenDisplay").textContent = `${_jadwalUtama.jam_mulai} - ${_jadwalUtama.jam_selesai}`;
        }

        if (santri.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Tidak ada santri di kelas ini.</td></tr>';
        } else {
            tbody.innerHTML = santri.map((s, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td><strong>${s.nama_lengkap || s.nama}</strong></td>
                    <td>
                        <select class="status-select select-status-santri" data-santri-id="${s.id_santri}">
                            <option value="Hadir">Hadir</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                            <option value="mustamiah">mustamiah</option>
                            <option value="Alfa">Alfa</option>
                        </select>
                    </td>
                    <td><input type="text" class="input-catatan" placeholder="Catatan..."></td>
                </tr>
            `).join("");
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Gagal memuat data.</td></tr>';
    }
}

async function handleSimpanAbsenPengajar() {
    const status = document.getElementById("statusAbsensiPengajar")?.value;
    const tanggal = document.getElementById("tanggalAbsensiPengajar")?.value;
    if (!status || !_jadwalUtama) return alert("Pilih status kehadiran dan Kelas.");

    try {
        await fetchJSON(`${BASE_URL}/absensi/pengajar`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ id_jadwal: _jadwalUtama.id_jadwal, tanggal, status_absensi: status, catatan: "Absensi pengajar mandiri" })
        });
        document.getElementById("absenPengajarInfo").textContent = "✓ Terkirim";
        alert("Absensi pengajar berhasil disimpan.");
    } catch (err) {
        alert(err.body?.message || "Gagal simpan absen pengajar");
    }
}

async function handleSimpanAbsensiSantri() {
    const rows = document.querySelectorAll("#absensiBody tr");
    const tanggal = document.getElementById("tanggalAbsensiPengajar")?.value;
    if (!rows.length || !_jadwalUtama) return alert("Data tidak lengkap.");

    try {
        for (const row of rows) {
            const select = row.querySelector(".status-select");
            if (!select) continue;
            await fetchJSON(`${BASE_URL}/absensi/santri`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    id_santri: select.dataset.santriId, id_jadwal: _jadwalUtama.id_jadwal,
                    tanggal, status_absensi: select.value, catatan: row.querySelector(".input-catatan")?.value || ""
                })
            });
        }
        alert("Seluruh absensi santri berhasil disimpan.");
    } catch (err) { alert("Beberapa data mungkin gagal disimpan."); }
}

/* ======================================================
    DASHBOARD STATS
====================================================== */
async function loadDashboardStats() {
    try {
        const resRekap = await fetchJSON(`${BASE_URL}/absensi/pengajar/rekap`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (document.querySelector(".persentase-kehadiran")) document.querySelector(".persentase-kehadiran").textContent = resRekap?.persentase || "0%";
    } catch (err) { console.warn("Gagal load stats:", err); }
}

/* ======================================================
    RIWAYAT ABSENSI
====================================================== */
let riwayatAbsenMaster = []; 

async function loadRiwayatAbsensi() {
    const id_kelas = document.getElementById("riwayatKelasSelect")?.value;
    const tbody = document.getElementById("riwayatBody");
    if (!tbody) return;

    if (!id_kelas) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Silakan pilih kelas terlebih dahulu...</td></tr>';
        updateRiwayatStats([]); 
        return;
    }

    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Memuat data riwayat...</td></tr>';
        const res = await fetchJSON(`${BASE_URL}/absensi/santri/kelas/me`, { headers: { Authorization: `Bearer ${getToken()}` } });
        const allData = Array.isArray(res) ? res : (res?.data || []);
        
        riwayatAbsenMaster = allData.filter(item => {
            const matchId = String(item.id_kelas) === String(id_kelas);
            const selectEl = document.getElementById("riwayatKelasSelect");
            const matchNama = item.nama_kelas === selectEl.options[selectEl.selectedIndex].text;
            return matchId || matchNama;
        });
        
        applyRiwayatFilters(); 
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Gagal memuat data riwayat dari server.</td></tr>';
    }
}

function applyRiwayatFilters() {
    const tanggalInput = document.getElementById("riwayatTanggal")?.value;
    const tbody = document.getElementById("riwayatBody");
    if (!tbody) return;

    let filtered = riwayatAbsenMaster;
    if (tanggalInput && tanggalInput !== "") {
        filtered = riwayatAbsenMaster.filter(item => item.tanggal && item.tanggal.slice(0, 10) === tanggalInput);
    }

    renderRiwayatTable(filtered);
    updateRiwayatStats(filtered);
}

function renderRiwayatTable(list) {
    const tbody = document.getElementById("riwayatBody");
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Tidak ada riwayat untuk kriteria ini.</td></tr>';
        return;
    }
    tbody.innerHTML = list.map((item, idx) => {
        const tgl = new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `<tr>
            <td>${idx + 1}</td>
            <td style="text-align:left;"><strong>${item.nama_santri || item.nama || "-"}</strong></td>
            <td>${item.hari || "-"}, ${tgl}</td>
            <td>${item.jam_mulai || "00.00"} - ${item.jam_selesai || "00.00"}</td>
            <td><span class="badge-status badge-${(item.status_absensi || "").toLowerCase()}">${item.status_absensi || "-"}</span></td>
            <td>${item.catatan_santri || item.catatan || "-"}</td>
            <td>${item.materi || "-"}</td>
        </tr>`;
    }).join("");
}

function updateRiwayatStats(list) {
    const hadir = list.filter(i => i.status_absensi?.toLowerCase() === "hadir").length;
    const izinSakit = list.filter(i => ["izin", "sakit"].includes(i.status_absensi?.toLowerCase())).length;
    const materi = list.length > 0 ? (list[0].materi || "-") : "-";

    if (document.getElementById("statTotalHadir")) document.getElementById("statTotalHadir").textContent = hadir;
    if (document.getElementById("statTotalIzin")) document.getElementById("statTotalIzin").textContent = izinSakit;
    if (document.getElementById("statMateriTerakhir")) document.getElementById("statMateriTerakhir").textContent = materi;
}

function exportRiwayatKeExcel() {
    if (!riwayatAbsenMaster.length) return alert("Tidak ada data untuk diekspor.");
    const elKelas = document.getElementById("riwayatKelasSelect");
    const namaKelas = elKelas.options[elKelas.selectedIndex]?.text || "Semua Kelas";
    const tglFilter = document.getElementById("riwayatTanggal")?.value || "Semua Tanggal";

    const wsData = [
        ["LAPORAN RIWAYAT ABSENSI SANTRI"],
        ["Kelas:", namaKelas], ["Tanggal:", tglFilter], [],
        ["No", "Nama Santri", "Hari / Tanggal", "Jam", "Status", "Catatan Santri", "Materi Kelas"]
    ];

    const tableRows = document.querySelectorAll("#riwayatBody tr");
    tableRows.forEach((row, i) => {
        if(row.cells.length < 7) return;
        wsData.push([i + 1, row.cells[1].innerText, row.cells[2].innerText, row.cells[3].innerText, row.cells[4].innerText, row.cells[5].innerText, row.cells[6].innerText]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Absensi");
    XLSX.writeFile(wb, `Riwayat_Absensi_${namaKelas.replace(/\s/g, '_')}_${tglFilter}.xlsx`);
}

/* ======================================================
    INITIALIZATION
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadPengajarProfile();
    setTodayDateInput();
    populateAbsensiFilters();

    if (document.getElementById("absensiBody")) {
        document.getElementById("kelasSelect")?.addEventListener("change", loadAbsensiData);
        document.getElementById("tanggalAbsensiPengajar")?.addEventListener("change", loadAbsensiData);
        document.getElementById("simpanAbsenPengajar")?.addEventListener("click", handleSimpanAbsenPengajar);
        document.getElementById("btnSimpanAbsensi")?.addEventListener("click", handleSimpanAbsensiSantri);
    }

    if (document.getElementById("riwayatBody")) {
        loadRiwayatAbsensi(); 
        document.getElementById("riwayatKelasSelect")?.addEventListener("change", loadRiwayatAbsensi);
        document.getElementById("riwayatTanggal")?.addEventListener("change", applyRiwayatFilters);
        document.getElementById("eksporLaporan")?.addEventListener("click", exportRiwayatKeExcel);
    }

    if (document.body.classList.contains("page-dashboard-pengajar")) {
        loadDashboardStats();
    }
});

window.handleLogout = function() {
    if (confirm("Apakah anda yakin ingin keluar?")) {
        localStorage.removeItem("token");
        window.location.replace("/login");
    }
};