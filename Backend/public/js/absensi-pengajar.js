const BASE_URL = "/api";

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
    const kelasSelect = document.getElementById("kelasSelect");
    const tbody = document.getElementById("absensiBody");

    if (!kelasSelect) return;

    try {
        // Ambil SEMUA jadwal milik pengajar (tanpa filter hari dari backend)
        const res = await fetchJSON(
            `${BASE_URL}/jadwal/pengajar/me`, 
            { headers: { Authorization: `Bearer ${getToken()}` } }
        );

        const data = res.data || res || [];

        kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';

        if (data.length === 0) {
            kelasSelect.innerHTML = `<option value="">Anda tidak memiliki jadwal mengajar</option>`;
            return;
        }

        // Tampilkan semua jadwal di dropdown
        data.forEach(j => {
            kelasSelect.innerHTML +=
                `<option value="${j.id_kelas}" data-jadwal-id="${j.id_jadwal}">
                    ${j.nama_kelas} (${j.hari}: ${j.jam_mulai} - ${j.jam_selesai})
                </option>`;
        });

        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" align="center">Silakan pilih kelas</td></tr>`;
        }

    } catch (err) {
        console.error("Gagal load jadwal:", err);
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
    const kelasSelect = document.getElementById("kelasSelect");
    const id_kelas = kelasSelect?.value;
    const tbody = document.getElementById("absensiBody");

    if (!id_kelas || !tbody) return;

    // Ambil id_jadwal dari atribut data yang kita pasang di dropdown tadi
    const selectedOption = kelasSelect.options[kelasSelect.selectedIndex];
    const id_jadwal_terpilih = selectedOption.getAttribute("data-jadwal-id");

    try {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Memuat data santri...</td></tr>';
        
        const res = await fetchJSON(`${BASE_URL}/kelas/pengajar/detail/${id_kelas}`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        const santri = res?.santri || [];
        const jadwalList = res?.jadwal || [];

        // Cari data jadwal yang spesifik dipilih
        _jadwalUtama = jadwalList.find(j => j.id_jadwal == id_jadwal_terpilih) || jadwalList[0];

        if (document.getElementById("jamAbsenDisplay") && _jadwalUtama) {
            document.getElementById("jamAbsenDisplay").textContent = `${_jadwalUtama.hari}: ${_jadwalUtama.jam_mulai} - ${_jadwalUtama.jam_selesai}`;
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
                            <option value="mustamiah">Mustamiah</option>
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
            body: JSON.stringify({ id_jadwal: _jadwalUtama.id_jadwal, tanggal, status_absensi: status, catatan: "Absensi pengajar" })
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
    if (!rows.length || !_jadwalUtama) return alert("absensi tidak ada.");

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
async function exportRiwayatKeExcel() {
    try {
        // 1. Ambil Identitas Pengajar & Filter
        const namaPengajar = document.getElementById("header-user-name")?.textContent || "Pengajar";
        const elKelas = document.getElementById("riwayatKelasSelect");
        const idKelasTerpilih = elKelas?.value; // ID Kelas dari dropdown
        const namaKelasTerpilih = elKelas?.options[elKelas.selectedIndex]?.text.split(' (')[0] || "Semua_Kelas";
        
        // 2. Tentukan Rentang Waktu (1 Tahun)
        const now = new Date();
        const setahunLalu = new Date();
        setahunLalu.setFullYear(now.getFullYear() - 1);
        
        const tglMulai = setahunLalu.toISOString().split('T')[0];
        const tglSelesai = now.toISOString().split('T')[0];

        // 3. Ambil Semua Data dari Backend (Endpoint: getAbsensiKelasPengajar)
        const res = await fetchJSON(`${BASE_URL}/absensi/santri/kelas/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        const allData = res.data || [];

        // 4. Filter Data untuk Laporan (Berdasarkan Kelas & Rentang 1 Tahun)
        const dataLaporan = allData.filter(item => {
            const tglItem = item.tanggal; // Format YYYY-MM-DD dari backend
            const matchKelas = !idKelasTerpilih || item.id_kelas == idKelasTerpilih;
            const matchRentang = tglItem >= tglMulai && tglItem <= tglSelesai;
            return matchKelas && matchRentang;
        });

        if (dataLaporan.length === 0) {
            return alert("Tidak ada data absensi dalam 1 tahun terakhir untuk kelas ini.");
        }

        // 5. Susun Header Excel
        const wsData = [
            ["LAPORAN ABSENSI SANTRI (PERIODE 1 TAHUN)"],
            ["Pengajar:", namaPengajar],
            ["Kelas:", namaKelasTerpilih],
            ["Rentang:", `${tglMulai} s/d ${tglSelesai}`],
            [],
            ["NO", "NAMA SANTRI", "TANGGAL", "JAM", "STATUS", "CATATAN", "KELAS"]
        ];

        // 6. Masukkan Data Detail
        dataLaporan.forEach((item, i) => {
            wsData.push([
                i + 1,
                item.nama_santri,
                item.tanggal,
                `${item.jam_mulai} - ${item.jam_selesai}`,
                item.status_absensi,
                item.catatan || "-",
                item.nama_kelas
            ]);
        });

        // 7. LOGIKA REKAPITULASI OTOMATIS (Sesuai Permintaan)
        wsData.push([], ["RINGKASAN TOTAL KEHADIRAN PER SANTRI"], ["NAMA SANTRI", "HADIR", "IZIN", "SAKIT", "MUSTAMIAH", "ALFA"]);

        // Menghitung jumlah status per nama santri
        const rekapMap = dataLaporan.reduce((acc, curr) => {
            const nama = curr.nama_santri;
            if (!acc[nama]) acc[nama] = { hadir: 0, izin: 0, sakit: 0, mustamiah: 0, alfa: 0 };
            
            const st = curr.status_absensi.toLowerCase();
            if (st === "hadir") acc[nama].hadir++;
            else if (st === "izin") acc[nama].izin++;
            else if (st === "sakit") acc[nama].sakit++;
            else if (st === "mustamiah") acc[nama].mustamiah++;
            else if (st === "alfa" || st === "tidak hadir") acc[nama].alfa++;
            
            return acc;
        }, {});

        // Masukkan objek rekap ke dalam baris Excel
        Object.keys(rekapMap).forEach(nama => {
            const r = rekapMap[nama];
            wsData.push([nama, r.hadir, r.izin, r.sakit, r.mustamiah, r.alfa]);
        });

        // 8. Eksekusi Download
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Absensi");
        
        const fileName = `Laporan_1Tahun_${namaKelasTerpilih.replace(/\s/g, '_')}_${tglSelesai}.xlsx`;
        XLSX.writeFile(wb, fileName);

    } catch (err) {
        console.error("Export Error:", err);
        alert("Gagal mengekspor laporan.");
    }
}

// 3. Filter Riwayat Utama
async function applyRiwayatFilters() {
    const tanggal = document.getElementById("riwayatTanggal")?.value;
    const kelasId = document.getElementById("riwayatKelasSelect")?.value;
    const tbody = document.getElementById("riwayatBody");

    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" align="center">Memuat data riwayat...</td></tr>`;

    try {
        // Mengambil seluruh riwayat absensi santri di kelas milik pengajar ini
        const res = await fetchJSON(`${BASE_URL}/absensi/santri/kelas/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        let data = (res.data || res || []);

        // Filter 1: Berdasarkan Tanggal (jika diisi)
        if (tanggal) {
            data = data.filter(item => {
                // Pastikan format tanggal sama YYYY-MM-DD
                const tglItem = new Date(item.tanggal).toISOString().split('T')[0];
                return tglItem === tanggal;
            });
        }

        // Filter 2: Berdasarkan Kelas (jika dipilih salah satu)
        if (kelasId) {
            // Kita cari nama kelas yang dipilih dari dropdown riwayat
            const selectedText = document.getElementById("riwayatKelasSelect")
                .options[document.getElementById("riwayatKelasSelect").selectedIndex]
                .text.split(' (')[0].toLowerCase(); // Ambil nama kelasnya saja sebelum tanda "("
          
            data = data.filter(item =>
              item.nama_kelas?.toLowerCase() === selectedText.toLowerCase()
            );
        }
          
        renderRiwayatTable(data);
        updateRiwayatStats(data); 
    } catch (err) {
        console.error("Error filter riwayat:", err);
        tbody.innerHTML = `<tr><td colspan="7" align="center" style="color:red">Gagal memuat data riwayat</td></tr>`;
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
    const riwayatKelasSelect = document.getElementById("riwayatKelasSelect");
    
    if (!riwayatKelasSelect) return;

    try {
        // Ambil semua jadwal pengajar tanpa peduli hari
        const res = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        
        const semuaJadwal = res.data || res || [];

        if (semuaJadwal.length === 0) {
            riwayatKelasSelect.innerHTML = `<option value="">-- Anda tidak memiliki kelas --</option>`;
        } else {
            // Tampilkan semua kelas yang diampu pengajar
            riwayatKelasSelect.innerHTML = `<option value="">-- Semua Kelas --</option>` +
                semuaJadwal.map(j => `<option value="${j.id_kelas}">${j.nama_kelas} (${j.hari})</option>`).join("");
            
            // Langsung panggil filter untuk menampilkan tabel (default: Semua Kelas)
            await applyRiwayatFilters();
        }        
    } catch (err) {
        console.error("Gagal sinkronisasi dropdown kelas riwayat:", err);
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
    // 1. Setup Data Awal (Mengisi tanggal hari ini ke semua input)
    setTodayDateInput();
    await loadPengajarProfile();

    // 2. Setup Halaman Absensi Harian (Input Absen Baru)
    if (document.getElementById("absensiBody")) {
        await loadKelasByTanggal(); // Langsung cari jadwal hari ini
        
        document.getElementById("tanggalAbsensiPengajar")?.addEventListener("change", () => {
            loadKelasByTanggal();
            document.getElementById("absensiBody").innerHTML = `<tr><td colspan="4" style="text-align:center">Pilih kelas untuk melihat santri</td></tr>`;
            document.getElementById("jamAbsenDisplay").textContent = "-";
        });
        document.getElementById("kelasSelect")?.addEventListener("change", loadAbsensiData);
        document.getElementById("simpanAbsenPengajar")?.addEventListener("click", handleSimpanAbsenPengajar);
        document.getElementById("btnSimpanAbsensi")?.addEventListener("click", handleSimpanAbsensiSantri);
    }

    // 3. SETUP HALAMAN RIWAYAT (Otomatis Load Hari Ini)
    const riwayatTanggal = document.getElementById("riwayatTanggal");
    const riwayatKelasSelect = document.getElementById("riwayatKelasSelect");

    if (riwayatTanggal && riwayatKelasSelect) {
        // 🔥 KUNCI UTAMA: Langsung jalankan sinkronisasi saat halaman dimuat
        // Ini akan mengisi dropdown kelas berdasarkan tanggal hari ini secara otomatis
        await syncRiwayatKelasDropdown(); 

        // Listener jika pengajar ganti tanggal manual
        riwayatTanggal.addEventListener("change", async () => {
            await syncRiwayatKelasDropdown();
        });

        // Listener jika pengajar pilih kelas di riwayat
        riwayatKelasSelect.addEventListener("change", applyRiwayatFilters);
    }

    const btnExport = document.getElementById("eksporLaporan");
if (btnExport) {
    btnExport.onclick = async (e) => {
        e.preventDefault();
        await exportRiwayatKeExcel();
    };
}

// Load data awal
await applyRiwayatFilters();

});

/* ======================================================
    LOGOUT FUNCTION
====================================================== */
window.handleLogout = function() {
    // 1. Hapus token dari localStorage
    localStorage.removeItem("token");
    
    // 2. (Opsional) Hapus data lain jika ada, misal:
    // localStorage.removeItem("user_role");
    
    // 3. Arahkan ke halaman login
    // Menggunakan replace agar user tidak bisa klik "Back" kembali ke dashboard
    window.location.replace("/login");
};

const mobileMenuBtn = document.getElementById("mobileMenuBtn");

mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
});