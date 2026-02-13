import { apiGet, apiPut, apiDelete } from "./apiService.js";

/* ======================================================
   AUTH GUARD
====================================================== */
const token = localStorage.getItem("token");
if (!token) {
    alert("Silakan login terlebih dahulu");
    location.href = "/login";
    throw new Error("NO TOKEN");
}

/* ======================================================
   HELPERS
====================================================== */
const $ = (id) => document.getElementById(id);
const q = (sel) => document.querySelector(sel);

function esc(v) {
    return String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* ======================================================
   ROUTER
====================================================== */
const path = location.pathname.replace(/\/$/, "");

if (path === "/dashboard/daftar-santri") {
    initDaftarSantri();
} else if (path === "/dashboard/daftar-pengajar") {
    initDaftarPengajar();
} else if (path === "/dashboard/detail-santri") {
    initDetailSantri();
} else if (path === "/dashboard/detail-pengajar") {
    initDetailPengajar();
}

/* ======================================================
   DAFTAR SANTRI
====================================================== */
function initDaftarSantri() {
    const santriTableBody = $("santriTableBody"); // Gunakan ID spesifik
    if (!santriTableBody) return;

    const searchInput = q(".santri-search input");
    const kategoriSelect = $("kategori_santri");
    const kelasSelect = $("pilih_kelas_santri");
    const exportBtn = q(".export-santri-btn");

    let SANTRI = [];
    let KELAS = [];

    async function loadAll() {
        try {
            const santriRes = await apiGet("/santri?page=1&limit=1000");
            SANTRI = santriRes.data ?? santriRes ?? [];
            const kelasRes = await apiGet("/kelas");
            KELAS = kelasRes.data ?? kelasRes ?? [];
            renderKelas();
            renderTable(SANTRI);
        } catch (err) {
            console.error("Gagal load data santri:", err);
        }
    }

    // Tambahkan listener pada container tabel (Event Delegation)
santriTableBody.addEventListener("click", async (e) => {
    // Cek apakah yang diklik adalah tombol delete atau icon sampah
    const deleteBtn = e.target.closest(".delete-btn");

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
            try {
                await apiDelete(`/santri/${id}`);
                loadAll(); // Refresh data tabel
            } catch (err) {
                console.error("Gagal menghapus:", err);
                alert("Gagal menghapus data");
            }
        }
    }
});

    function renderKelas() {
        if (!kelasSelect) return;
        kelasSelect.innerHTML = `<option value="">Semua Kelas</option>`;
        KELAS.forEach(k => {
            kelasSelect.innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;
        });
    }

    function renderTable(list) {
        santriTableBody.innerHTML = "";
        if (!list.length) {
            santriTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center">Tidak ada data</td></tr>`;
            return;
        }
        list.forEach((s, i) => {
            santriTableBody.innerHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${esc(s.nis)}</td>
                    <td>${esc(s.nama)}</td>
                    <td>${esc(s.nama_kelas ?? "-")}</td>
                    <td>${esc(s.user_email ?? s.email ?? "-")}</td>
                    <td>${esc(s.kategori)}</td>
                    <td><span class="status-badge ${s.status === "aktif" ? "status-aktif" : "status-nonaktif"}">${esc(s.status)}</span></td>
                    <td class="action-icons">
                        <a href="/dashboard/detail-santri?id=${s.id_santri}" class="icon-btn edit-btn"><i class="fas fa-pen"></i></a>
                        <button class="icon-btn delete-btn" data-id="${s.id_santri}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>`;
        });
    }

    function applyFilter() {
        let data = [...SANTRI];
        const key = searchInput?.value.toLowerCase() || "";
        const kat = kategoriSelect?.value || "";
        const kel = kelasSelect?.value || "";
        if (key) data = data.filter(s => s.nama?.toLowerCase().includes(key));
        if (kat) data = data.filter(s => s.kategori === kat);
        if (kel) data = data.filter(s => String(s.id_kelas) === kel);
        renderTable(data);
    }

if (exportBtn) {
    exportBtn.onclick = () => {
        const kat = kategoriSelect?.value || "Semua";
        const fileName = `Daftar-Santri-${kat}.xls`; // Gunakan .xls agar format terbaca Excel

        // 1. Kelompokkan data berdasarkan Nama Kelas
        const kelompokKelas = {};
        SANTRI.forEach(s => {
            const namaKelas = s.nama_kelas || "Tanpa Kelas";
            if (!kelompokKelas[namaKelas]) {
                kelompokKelas[namaKelas] = [];
            }
            kelompokKelas[namaKelas].push(s);
        });

        // 2. Bangun Struktur HTML untuk Excel
        let htmlKonten = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"></head>
            <body>
        `;

        for (const kelas in kelompokKelas) {
            htmlKonten += `
                <h3>KELAS: ${kelas.toUpperCase()}</h3>
                <table border="1">
                    <thead>
                        <tr style="background-color: #f2f2f2; font-weight: bold;">
                            <th>No</th>
                            <th>NIS</th>
                            <th>Nama</th>
                            <th>Tanggal Lahir</th>
                            <th>Alamat</th>
                            <th>Email</th>
                            <th>No HP</th>
                            <th>Kelas</th>
                            <th>Kategori</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            kelompokKelas[kelas].forEach((s, i) => {
                htmlKonten += `
                    <tr>
                        <td>${i + 1}</td>
                        <td style="mso-number-format:'\\@'">${s.nis || '-'}</td>
                        <td>${s.nama || '-'}</td>
                        <td>${s.tanggal_lahir ? s.tanggal_lahir.split('T')[0] : '-'}</td>
                        <td>${s.alamat || '-'}</td>
                        <td>${s.user_email || s.email || '-'}</td>
                        <td style="mso-number-format:'\\@'">${s.no_wa || '-'}</td>
                        <td>${s.nama_kelas || '-'}</td>
                        <td>${s.kategori || '-'}</td>
                        <td>${s.status || '-'}</td>
                    </tr>
                `;
            });

            htmlKonten += `</tbody></table><br>`; // Jarak antar tabel kelas
        }

        htmlKonten += `</body></html>`;

        // 3. Proses Download
        const blob = new Blob([htmlKonten], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
    };
}

    if (searchInput) searchInput.onkeyup = applyFilter;
    if (kategoriSelect) kategoriSelect.onchange = applyFilter;
    if (kelasSelect) kelasSelect.onchange = applyFilter;

    loadAll();
}

/* ======================================================
   DAFTAR PENGAJAR
====================================================== */
function initDaftarPengajar() {
    const pengajarTableBody = $("pengajarTableBody"); // Pastikan memanggil elemen dengan ID ini
    if (!pengajarTableBody) return; // Mencegah error baris 1153

    const searchInput = q(".teacher-search-input input");
    let DATA = [];

    async function load() {
        try {
            const res = await apiGet("/pengajar");
            DATA = res.data ?? res ?? [];
            render();
        } catch (err) {
            console.error("Gagal load data pengajar:", err);
        }
    }

    // Tambahkan listener pada body tabel pengajar
pengajarTableBody.addEventListener("click", async (e) => {
    // Mencari elemen tombol delete terdekat yang diklik
    const deleteBtn = e.target.closest(".delete-btn");

    if (deleteBtn) {
        const id = deleteBtn.dataset.id;

        // Konfirmasi sebelum menghapus
        if (confirm("Apakah Anda yakin ingin menghapus data pengajar ini?")) {
            try {
                // Memanggil fungsi apiDelete dari apiService.js
                await apiDelete(`/pengajar/${id}`);

                // Panggil kembali fungsi load untuk memperbarui tampilan tabel
                load();
            } catch (err) {
                console.error("Gagal menghapus pengajar:", err);
                alert("Gagal menghapus data: " + (err.message || "Terjadi kesalahan server"));
            }
        }
    }
});

    function render() {
        const key = searchInput?.value.toLowerCase() || "";
        const uniqueData = [];
        const map = new Map();

        DATA.forEach(item => {
            if (!map.has(item.id_pengajar)) {
                map.set(item.id_pengajar, true);
                uniqueData.push(item);
            }
        });

        const list = uniqueData.filter(p => p.nama?.toLowerCase().includes(key));
        pengajarTableBody.innerHTML = list.length
            ? list.map((p, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.nip ?? "-"}</td>
                    <td>${p.nama}</td>
                    <td>${p.nama_kelas !== '-' ? p.nama_kelas : (p.mapel || "-")}</td>
                    <td>${p.user_email ?? p.email ?? "-"}</td>
                    <td><span class="status-badge ${p.status === "aktif" ? "status-aktif" : "status-nonaktif"}">${p.status}</span></td>
                    <td class="action-icons">
                        <a href="/dashboard/detail-pengajar?id=${p.id_pengajar}" class="icon-btn edit-btn"><i class="fas fa-pen"></i></a>
                        <button class="icon-btn delete-btn" data-id="${p.id_pengajar}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>`).join("")
            : `<tr><td colspan="7">Tidak ada data</td></tr>`;
    }

    if (searchInput) searchInput.addEventListener("keyup", render);
    load();
}

// Tambahkan sisa fungsi (initDetailSantri, initDetailPengajar) di bawah sini...

/* ================= DETAIL SANTRI ================= */
function initDetailSantri() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return location.href = "/dashboard/daftar-santri";

    const f = {
        nis: $("nisn"),
        nama: $("nama-lengkap"),
        alamat: $("alamat"),
        tempat: $("tempat-lahir"),
        tanggal: $("tanggal-lahir"),
        wa: $("no-telepon"),
        kategori: $("kategori-santri"),
        username: $("username"),
        email: $("email"),
        status: $("status-akun"),
        daftar: $("tanggal-terdaftar")
    };

    const btnEdit = $("btn-edit-santri");
    const btnSave = $("btn-simpan-santri-footer");

    function setDisabled(state) {
        Object.values(f).forEach(i => i && (i.disabled = state));
        btnSave.style.display = state ? "none" : "inline-block";
    }

    async function load() {
        try {
            const res = await apiGet(`/santri/${id}`);
            const s = res.data ?? res;

            f.nis.value = s.nis ?? "";
            f.nama.value = s.nama ?? "";
            f.alamat.value = s.alamat ?? "";
            f.tempat.value = s.tempat_lahir ?? "";
            f.tanggal.value = s.tanggal_lahir?.split("T")[0] ?? "";
            f.wa.value = s.no_wa ?? "";
            
            // FIX: Paksa ke huruf kecil agar cocok dengan value="anak"/"dewasa" di HTML
            if (s.kategori) {
                f.kategori.value = s.kategori.toLowerCase().trim();
            }

            f.username.value = s.username ?? "-";
            f.email.value = s.user_email ?? s.email ?? "";
            f.status.value = s.status ?? "nonaktif";

            function formatDateForInput(dateString) {
                if (!dateString) return "";
                const d = new Date(dateString);
                if (isNaN(d.getTime())) return "";
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }

            f.daftar.value = formatDateForInput(s.tanggal_terdaftar);

        } catch (err) {
            console.error("Gagal memuat data santri", err);
            alert("Gagal memuat data santri");
        }
    }

    btnEdit.onclick = () => setDisabled(false);

    btnSave.onclick = async () => {
        try {
            // Validasi sederhana: jangan kirim kategori jika kosong
            if (!f.kategori.value) {
                alert("Kategori harus dipilih!");
                return;
            }

            await apiPut(`/santri/${id}`, {
                nama: f.nama.value,
                alamat: f.alamat.value,
                tempat_lahir: f.tempat.value,
                tanggal_lahir: f.tanggal.value || null,
                no_wa: f.wa.value,
                kategori: f.kategori.value, // Mengirim "anak" atau "dewasa"
                email: f.email.value,
                status: f.status.value
            });
            alert("Data santri diperbarui");
            location.href = "/dashboard/daftar-santri";
        } catch (err) {
            console.error("Update santri error:", err);
            alert("Gagal memperbarui data santri");
        }
    };

    setDisabled(true);
    load();
}

/* ================= DETAIL PENGAJAR ================= */
function initDetailPengajar() {
    const id = new URLSearchParams(location.search).get("id");
    if (!id) return location.href = "/dashboard/daftar-pengajar";

    const f = {
        nip: $("pengajar-nip"),
        nama: $("pengajar-nama"),
        alamat: $("pengajar-alamat"),
        tanggal: $("pengajar-tanggal-lahir"),
        telp: $("pengajar-no-telepon"),
        kelas: $("pengajar-kelas"),
        username: $("pengajar-username"),
        email: $("pengajar-email"),
        status: $("pengajar-status"),
        daftar: $("pengajar-tanggal-terdaftar")
    };

    const btnEdit = $("btn-edit-pengajar");
    const btnSave = $("btn-simpan-pengajar-footer");

    function setDisabled(state) {
        Object.values(f).forEach(i => i && (i.disabled = state));
        btnSave.style.display = state ? "none" : "inline-block";
    }

    async function load() {
        try {
            const res = await apiGet(`/pengajar/${id}`);
            const p = res.data ?? res;

            f.nip.value = p.nip ?? "-";
            f.nama.value = p.nama ?? "-";
            f.alamat.value = p.alamat ?? "-";
            f.tanggal.value = p.tanggal_lahir ? p.tanggal_lahir.split("T")[0] : "";
            f.telp.value = p.no_kontak ?? "";
            f.username.value = p.username ?? "-";
            f.email.value = p.user_email ?? p.email ?? "";
            f.status.value = p.status ?? "aktif";
            f.daftar.value = p.tanggal_terdaftar ? new Date(p.tanggal_terdaftar).toISOString().split("T")[0] : "-";
        } catch (err) {
            console.error("Load pengajar error:", err);
            alert("Gagal memuat data pengajar");
        }
    }

    btnEdit.onclick = () => setDisabled(false);

    btnSave.onclick = async () => {
        try {
            await apiPut(`/pengajar/${id}`, {
                nama: f.nama.value,
                alamat: f.alamat.value,
                tanggal_lahir: f.tanggal.value || null,
                no_kontak: f.telp.value,
                email: f.email.value,
                status: f.status.value
            });
            alert("Data pengajar diperbarui");
            location.href = "/dashboard/daftar-pengajar";
        } catch (err) {
            console.error("Update pengajar error:", err);
            alert("Gagal memperbarui data pengajar");
        }
    };

    setDisabled(true);
    load();
}