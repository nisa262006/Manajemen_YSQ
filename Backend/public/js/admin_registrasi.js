import { apiGet, apiPut, apiDelete } from "./apiService.js";

/* ============================================================
   AKTIF HANYA DI HALAMAN DAFTAR REGISTRASI
============================================================ */
if (!document.body.classList.contains("page-daftar-registrasi")) {
    console.log("⛔ Bukan halaman registrasi");
} else {

console.log("✅ admin_registrasi.js aktif");

/* =========================
   HELPER
========================= */
const $ = (id) => document.getElementById(id);
const q = (s) => document.querySelector(s);

function esc(str = "") {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatDate(date) {
    return date ? new Date(date).toLocaleDateString("id-ID") : "-";
}

/* =========================
   NOTIFICATION (FIX)
========================= */
function showNotification(message, type = "info") {
    const toast = document.getElementById("notification-toast");
    if (!toast) return;

    toast.className = `toast-notification show ${type}`;
    toast.innerText = message;

    setTimeout(() => {
        toast.className = "toast-notification";
        toast.innerText = "";
    }, 3000);
}

/* =========================
   STATE
========================= */
window.PENDAFTAR = [];
let ACTIVE_ID = null;

/* =========================
   LOAD DATA
========================= */
async function loadPendaftar() {
    try {
        const res = await apiGet("/pendaftar");
        window.PENDAFTAR = Array.isArray(res) ? res : res?.data ?? [];

        renderTable(PENDAFTAR);
        renderStat(PENDAFTAR);

        console.log("✅ Pendaftar:", PENDAFTAR.length);
    } catch (err) {
        console.error(err);
        showNotification("Gagal memuat pendaftar", "error");
    }
}

/* =========================
   RENDER TABLE
========================= */
function renderTable(list) {
    const tbody = $("table-registrasi-body");
    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center">
                    Tidak ada pendaftar
                </td>
            </tr>`;
        return;
    }

    list.forEach((p, i) => {
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${i + 1}</td>
                <td>${esc(p.nama)}</td>
                <td>${esc(p.tempat_lahir)}</td>
                <td>${formatDate(p.tanggal_lahir)}</td>
                <td>${esc(p.no_wa)}</td>
                <td>
                    ${
                        p.status === "diterima"
                            ? `<span class="status-badge status-diterima">Diterima</span>`
                        : p.status === "ditolak"
                            ? `<span class="status-badge status-ditolak">Ditolak</span>`
                        : `<button class="btn-detail" data-id="${p.id_pendaftar}">
                                Lihat Detail
                           </button>`
                    }
                </td>
            </tr>
        `);
    });
}

/* =========================
   STATISTIK
========================= */
function renderStat(data) {
    $("count_pendaftar").innerText = data.length;
    $("count_pending").innerText = data.filter(p => p.status === "pending").length;
    $("count_diterima").innerText = data.filter(p => p.status === "diterima").length;

    // Logika baru: Menghitung total pendaftar yang statusnya 'ditolak'
    $("count_ditolak").innerText = data.filter(p => p.status === "ditolak").length;
}

/* =========================
   EVENT CLICK (DETAIL)
========================= */
document.addEventListener("click", async (e) => {

    if (e.target.classList.contains("btn-detail")) {
        const id = e.target.dataset.id;
        const p = PENDAFTAR.find(x => x.id_pendaftar == id);
        if (!p) return;

        ACTIVE_ID = id;

        $("detail-name").innerText = p.nama || "-";
        $("detail-tempat-lahir").innerText = p.tempat_lahir || "-";
        $("detail-tanggal-lahir").innerText = formatDate(p.tanggal_lahir);
        $("detail-whatsapp").innerText = p.no_wa || "-";
        $("detail-email").innerText = p.email || "-";

        $("popup-detail-pendaftar").style.display = "flex";
        return;
    }

    if (e.target.id === "close-detail-popup") {
        $("popup-detail-pendaftar").style.display = "none";
        ACTIVE_ID = null;
        return;
    }

    if (!ACTIVE_ID) return;

    if (e.target.classList.contains("detail-diterima")) {
        await apiPut(`/pendaftar/terima/${ACTIVE_ID}`);
        updateStatus(ACTIVE_ID, "diterima");
        showNotification("Pendaftar diterima", "success");
    }

    if (e.target.classList.contains("detail-ditolak")) {
        await apiPut(`/pendaftar/tolak/${ACTIVE_ID}`);
        updateStatus(ACTIVE_ID, "ditolak");
        showNotification("Pendaftar ditolak", "warning");
    }

    $("popup-detail-pendaftar").style.display = "none";
    ACTIVE_ID = null;
});

/* =========================
   UPDATE STATUS
========================= */
function updateStatus(id, status) {
    const idx = PENDAFTAR.findIndex(p => p.id_pendaftar == id);
    if (idx !== -1) {
        PENDAFTAR[idx].status = status;
        renderTable(PENDAFTAR);
        renderStat(PENDAFTAR);
    }
}

/* =========================
   SEARCH
========================= */
q("#search-pendaftar")?.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    renderTable(
        PENDAFTAR.filter(p =>
            p.nama.toLowerCase().includes(term) ||
            p.tempat_lahir.toLowerCase().includes(term) ||
            p.no_wa.toLowerCase().includes(term)
        )
    );
});

/* =========================
   RESET PENDAFTAR (FIX FINAL)
========================= */
q("#btn-reset")?.addEventListener("click", async () => {
    if (!confirm("Yakin reset pendaftaran?")) return;

    try {
        await apiDelete("/pendaftar/reset/all");
        showNotification("Pendaftaran berhasil direset", "success");
        await loadPendaftar();
    } catch (err) {
        console.error(err);
        showNotification("Gagal reset pendaftaran", "error");
    }
});

/* =========================
   EXPORT EXCEL
========================= */
function exportPendaftarToExcel() {
    if (!window.PENDAFTAR.length) {
        alert("Tidak ada data pendaftar untuk diekspor.");
        return;
    }

    const excelData = window.PENDAFTAR.map((p, i) => ({
        No: i + 1,
        "Nama Lengkap": p.nama,
        "Tempat Lahir": p.tempat_lahir,
        "Tanggal Lahir": formatDate(p.tanggal_lahir),
        "Nomor WA": p.no_wa,
        Status: p.status
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendaftar");

    const bulan = new Date().toLocaleString("id-ID", { month: "long" });
    const tahun = new Date().getFullYear();

    XLSX.writeFile(wb, `Pendaftar_${bulan}_${tahun}.xlsx`);
}

q(".export-btn")?.addEventListener("click", exportPendaftarToExcel);

/* =========================
   INIT
========================= */
loadPendaftar();

}
