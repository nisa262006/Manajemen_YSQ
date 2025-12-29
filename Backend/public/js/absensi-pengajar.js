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

async function loadKelasByTanggal() {
    const tanggal = document.getElementById("tanggalAbsensiPengajar")?.value;
    const kelasSelect = document.getElementById("kelasSelect");

    if (!tanggal || !kelasSelect) return;

    const hari = new Date(tanggal)
        .toLocaleDateString("id-ID", { weekday: "long" })
        .toLowerCase();

    try {
        const res = await fetchJSON(
            `${BASE_URL}/jadwal/pengajar/me/hari/${hari}`,
            { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        const list = res?.data || [];

        if (list.length === 0) {
            kelasSelect.innerHTML =
                `<option value="">🚫 Tidak ada jadwal di hari ${hari}</option>`;

            document.getElementById("absensiBody").innerHTML =
                `<tr><td colspan="4" style="text-align:center; color:#b91c1c">
                    Tidak ada kelas pada hari ini
                </td></tr>`;

            document.getElementById("jamAbsenDisplay").textContent = "-";
            return;
        }

        kelasSelect.innerHTML =
            `<option value="">-- Pilih Kelas --</option>` +
            list.map(k =>
                `<option value="${k.id_kelas}">
                    ${k.nama_kelas} (${k.jam_mulai} - ${k.jam_selesai})
                </option>`
            ).join("");

    } catch (err) {
        console.error("Gagal load kelas by tanggal:", err);
    }
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
    } catch (err) { alert("absensi sudah ada."); }
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
    BAGIAN RIWAYAT ABSENSI (FIXED & COMPLETE)
====================================================== */

// 1. Fungsi Update Statistik (Mencegah error updateRiwayatStats is not defined)
function updateRiwayatStats(list) {
    const statHadir = document.getElementById("statTotalHadir");
    const statIzin = document.getElementById("statTotalIzin");
    
    if (!list) return;

    const hadir = list.filter(i => (i.status_absensi || i.status)?.toLowerCase() === "hadir").length;
    const izinSakit = list.filter(i => ["izin", "sakit"].includes((i.status_absensi || i.status)?.toLowerCase())).length;
    
    if (statHadir) statHadir.textContent = hadir;
    if (statIzin) statIzin.textContent = izinSakit;
}

// 2. Fungsi Export Excel (Mencegah error exportRiwayatKeExcel is not defined)
function exportRiwayatKeExcel() {
    const tbody = document.getElementById("riwayatBody");
    if (!tbody || tbody.rows.length === 0 || tbody.rows[0].cells.length < 2) {
        return alert("Tidak ada data untuk diekspor.");
    }

    const elKelas = document.getElementById("riwayatKelasSelect");
    const namaKelas = elKelas?.options[elKelas.selectedIndex]?.text || "Semua_Kelas";
    const tglFilter = document.getElementById("riwayatTanggal")?.value || "Semua_Tanggal";

    const wsData = [
        ["LAPORAN RIWAYAT ABSENSI SANTRI"],
        ["Kelas:", namaKelas], ["Tanggal:", tglFilter], [],
        ["No", "Nama Santri", "Hari / Tanggal", "Jam", "Status", "Catatan", "Kelas"]
    ];

    Array.from(tbody.rows).forEach((row, i) => {
        const rowData = Array.from(row.cells).map(cell => cell.innerText);
        wsData.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat");
    XLSX.writeFile(wb, `Riwayat_Absensi_${namaKelas.replace(/\s/g, '_')}.xlsx`);
}

// 3. Filter Riwayat Utama
async function applyRiwayatFilters() {
    const tanggal = document.getElementById("riwayatTanggal")?.value;
    const kelasId = document.getElementById("riwayatKelasSelect")?.value;
    const tbody = document.getElementById("riwayatBody");

    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" align="center">Memuat data riwayat...</td></tr>`;

    try {
        // Mengambil data dari endpoint absensi santri
        const res = await fetchJSON(`${BASE_URL}/absensi/santri/kelas/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        let data = (res.data || res || []);

        if (tanggal) {
            data = data.filter(item => new Date(item.tanggal).toISOString().split('T')[0] === tanggal);
        }

        if (kelasId && kelasId !== "") {
            data = data.filter(item => String(item.id_kelas) === String(kelasId));
        }

        renderRiwayatTable(data);
        updateRiwayatStats(data); // Sekarang sudah terdefinisi
    } catch (err) {
        console.error("Error filter riwayat:", err);
        tbody.innerHTML = `<tr><td colspan="7" align="center" style="color:red">Gagal memuat data</td></tr>`;
    }
}

// 4. Render Tabel
function renderRiwayatTable(data) {
    const tbody = document.getElementById("riwayatBody");
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" align="center">Data tidak ditemukan</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${item.nama_santri || '-'}</strong></td>
            <td>${new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
            <td>${item.jam_mulai || '-'} - ${item.jam_selesai || '-'}</td>
            <td><span class="badge-status">${item.status_absensi || '-'}</span></td>
            <td>${item.catatan || '-'}</td>
            <td>${item.nama_kelas || '-'}</td>
        </tr>`).join("");
}

/* --- Fungsi Pendukung Riwayat --- */
async function syncRiwayatKelasDropdown() {
    const tanggal = document.getElementById("riwayatTanggal")?.value;
    const riwayatKelasSelect = document.getElementById("riwayatKelasSelect");
    
    if (!riwayatKelasSelect || !tanggal) return;

    // 1. Ambil nama hari dari tanggal yang dipilih
    const hari = new Date(tanggal)
        .toLocaleDateString("id-ID", { weekday: "long" })
        .toLowerCase();

    try {
        // 2. Ambil jadwal pengajar
        const res = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        const semuaJadwal = res.data || res || [];
        
        // 3. Filter jadwal yang hanya sesuai dengan hari tersebut
        const jadwalHariIni = semuaJadwal.filter(j => j.hari.toLowerCase() === hari);

        // 4. Update Dropdown
        if (jadwalHariIni.length === 0) {
            riwayatKelasSelect.innerHTML = `<option value="">-- Tidak ada kelas hari ${hari} --</option>`;
        } else {
            riwayatKelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' + 
                jadwalHariIni.map(k => `<option value="${k.id_kelas}">${k.nama_kelas} (${k.jam_mulai})</option>`).join("");
        }
        
        // 5. Kosongkan tabel karena kelas lama sudah tidak relevan dengan tanggal baru
        const tbody = document.getElementById("riwayatBody");
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" align="center">Silahkan pilih kelas</td></tr>`;

    } catch (err) {
        console.error("Gagal sinkronisasi dropdown kelas:", err);
    }
}

// Tambahkan juga fungsi ini jika belum ada untuk mengisi dropdown di awal
async function loadDropdownKelasRiwayat() {
    await syncRiwayatKelasDropdown();
}

/* ======================================================
    INITIALIZATION
====================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Setup Data Awal
    setTodayDateInput();
    await loadProfileData();

    // 2. Setup Halaman Absensi Harian (Jika elemennya ada)
    if (document.getElementById("absensiBody")) {
        loadKelasByTanggal();
        document.getElementById("tanggalAbsensiPengajar")?.addEventListener("change", () => {
            loadKelasByTanggal();
            document.getElementById("absensiBody").innerHTML = `<tr><td colspan="4" style="text-align:center">Pilih kelas untuk melihat santri</td></tr>`;
            document.getElementById("jamAbsenDisplay").textContent = "-";
        });
        document.getElementById("kelasSelect")?.addEventListener("change", loadAbsensiData);
        document.getElementById("simpanAbsenPengajar")?.addEventListener("click", handleSimpanAbsenPengajar);
        document.getElementById("btnSimpanAbsensi")?.addEventListener("click", handleSimpanAbsensiSantri);
    }
        // Logika Khusus Halaman Riwayat
        const riwayatTabelElemen = document.getElementById("riwayatBody");
        if (riwayatTabelElemen) {
            // 1. Isi dropdown kelas
            await loadDropdownKelasRiwayat();
            
            // 2. Tampilkan data awal
            applyRiwayatFilters();
    
            // 3. Event Listeners (Gunakan ID yang benar sesuai riwayat-absensi.html)
            document.getElementById("riwayatTanggal")?.addEventListener("change", async () => {
                await syncRiwayatKelasDropdown();
                applyRiwayatFilters();
            });
            
            document.getElementById("riwayatKelasSelect")?.addEventListener("change", applyRiwayatFilters);
            
            // Perbaikan: Pastikan fungsi exportRiwayatKeExcel sudah didefinisikan di atas
            document.getElementById("eksporLaporan")?.addEventListener("click", exportRiwayatKeExcel);
        }
    
        // Logika Halaman Absensi Harian (Jika ada)
        if (document.getElementById("absensiBody")) {
            loadKelasByTanggal();
            // ... listener absensi lainnya ...
        }
});
