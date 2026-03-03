const API = "/api";
const token = localStorage.getItem("token");

/* ================= VARIABEL GLOBAL DATA ================= */
// Variabel ini penting agar fungsi download bisa mengambil data yang sedang tampil
let currentRaporTahsin = null;
let currentRaporTahfidz = null;

/* ================= ELEMENT ================= */
const namaEl = document.getElementById("nama-santri");
const nisEl = document.getElementById("nis-santri");
const kelasEl = document.getElementById("kelas-santri");
const pengajarEl = document.getElementById("pengajar-santri");
const selectPeriode = document.querySelector(".ysq-select-minimal");

const tahfidzTabBtn = document.querySelectorAll(".ysq-tab-btn")[1];
const tahfidzSection = document.getElementById("section-rapor-tahfidz");

/* ================= HELPER PREDIKAT ================= */
function getPredikatUI(nilai) {
    const n = parseFloat(nilai);
    if (n >= 90) return { teks: "Mumtaz", warna: "#27ae60" };
    if (n >= 80) return { teks: "Jayyid Jiddan", warna: "#2ecc71" };
    if (n >= 70) return { teks: "Jayyid", warna: "#f1c40f" };
    if (n >= 60) return { teks: "Maqbul", warna: "#e67e22" };
    return { teks: "Dhaif", warna: "#e74c3c" };
}

/* ================= LOAD AWAL ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadRaporSantri();

    if (selectPeriode) {
        selectPeriode.addEventListener("change", () => {
            loadRaporSantri(selectPeriode.value);
        });
    }
});

/* ================= TAB ================= */
window.showTab = function (tab) {
    document.getElementById("section-tahsin").classList.toggle("ysq-is-hidden", tab !== "tahsin");
    document.getElementById("section-rapor-tahfidz").classList.toggle("ysq-is-hidden", tab === "tahsin");

    const btns = document.querySelectorAll(".ysq-tab-btn");
    btns[0].classList.toggle("active", tab === "tahsin");
    btns[1].classList.toggle("active", tab !== "tahsin");
};

/* ================= LOAD RAPOR ================= */
async function loadRaporSantri(periode = "") {
    try {
        const url = periode ? `${API}/rapor/santri/me?periode=${encodeURIComponent(periode)}` : `${API}/rapor/santri/me`;
        
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw data.message;

        /* ---------- SIMPAN DATA KE GLOBAL ---------- */
        currentRaporTahsin = data.rapor_tahsin;
        currentRaporTahfidz = data.rapor_tahfidz;

        /* ---------- IDENTITAS SANTRI ---------- */
        const s = data.santri;
        namaEl.textContent = s.nama;
        nisEl.textContent = s.nis;
        kelasEl.textContent = s.kelas;
        pengajarEl.textContent = s.pengajar;

        /* ---------- DROP DOWN PERIODE ---------- */
        if (selectPeriode && data.periode_list && selectPeriode.options.length <= 1) {
            selectPeriode.innerHTML = ""; 
            data.periode_list.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p;
                opt.textContent = p;
                if (p === data.selected_periode) opt.selected = true;
                selectPeriode.appendChild(opt);
            });
        }

        /* ---------- RENDER TAMPILAN ---------- */
        if (data.rapor_tahsin) {
            renderTahsin(data.rapor_tahsin);
        } else {
            document.querySelector("#section-tahsin tbody").innerHTML = `<tr><td colspan="2" style="text-align:center;">Data tidak ditemukan.</td></tr>`;
            document.querySelector(".val-total").textContent = "00.00";
        }

        if (data.rapor_tahfidz) {
            renderTahfidz(data.rapor_tahfidz);
            tahfidzTabBtn.style.display = "inline-flex";
        } else {
            tahfidzTabBtn.style.display = "none";
            tahfidzSection.classList.add("ysq-is-hidden");
        }

    } catch (err) {
        console.error("Gagal memuat rapor:", err);
    }
}

/* ================= RENDER UI (TAHSIN & TAHFIDZ) ================= */
function renderTahsin(r) {
    const tbody = document.querySelector("#section-tahsin tbody");
    const nilaiAkhir = Number(r.nilai_akhir);

    tbody.innerHTML = `
        <tr><td>Nilai Pekanan</td><td class="val-bold">${r.nilai_pekanan}</td></tr>
        <tr><td>Ujian Tilawah (Lisan)</td><td class="val-bold">${r.ujian_tilawah}</td></tr>
        <tr><td>Nilai Teori (G-Form)</td><td class="val-bold">${r.nilai_teori}</td></tr>
        <tr><td>Presensi Kehadiran</td><td class="val-bold">${r.nilai_presensi}</td></tr>
    `;

    document.querySelector(".val-total").textContent = nilaiAkhir.toFixed(2);
    document.querySelector(".ysq-text-note").textContent = r.catatan || "Tidak ada catatan.";

    const statusTahsinEl = document.getElementById("status-tahsin");
    if (statusTahsinEl) {
        statusTahsinEl.textContent = nilaiAkhir >= 60 ? "LULUS" : "MENGULANG";
        statusTahsinEl.style.color = nilaiAkhir >= 60 ? "#27ae60" : "#e74c3c";
    }
}

function renderTahfidz(r) {
    const body = document.getElementById("tahfidz-body");
    const nilaiAkhir = Number(r.nilai_akhir);
    const p = getPredikatUI(nilaiAkhir);
    
    body.innerHTML = r.simakan.length === 0 
        ? `<tr><td colspan="2" style="text-align:center;">Belum ada data simakan.</td></tr>`
        : r.simakan.map(s => `<tr><td class="col-center">Juz ${s.juz}</td><td class="col-center">${s.nilai}</td></tr>`).join('');

    document.getElementById("rata-simakan").textContent = Number(r.nilai_rata_simakan).toFixed(2);
    document.getElementById("rata-akhir-tahfidz").textContent = Number(r.nilai_ujian_akhir).toFixed(2);
    document.getElementById("predikat-tahfidz").textContent = nilaiAkhir.toFixed(2);

    const predikatTeks = document.querySelector(".ysq-summary-predikat-v2 .text-p");
    if (predikatTeks) {
        predikatTeks.textContent = p.teks;
        predikatTeks.style.color = p.warna;
    }

    const statusKelulusanEl = document.getElementById("status-kelulusan-tahfidz");
    if (statusKelulusanEl) {
        statusKelulusanEl.textContent = nilaiAkhir >= 60 ? "LULUS" : "Mengulang";
        statusKelulusanEl.style.color = nilaiAkhir >= 60 ? "#27ae60" : "#e74c3c";
    }
}

/* ================= DOWNLOAD PDF (Sesuai Gambar Referensi) ================= */
/* ================= DOWNLOAD PDF (VERSI LENGKAP & BENAR) ================= */
window.downloadRapor = async function (jenis) {
    const { jsPDF } = window.jspdf;
    
    // 1. Validasi Data
    const dataRapor = (jenis === 'tahsin') ? currentRaporTahsin : currentRaporTahfidz;
    if (!dataRapor) {
        alert("Data rapor tidak ditemukan untuk periode ini!");
        return;
    }

    try {
        // Tampilkan loading jika perlu (optional)
        console.log(`Memproses PDF ${jenis}...`);

        // 2. Isi Identitas Santri ke Template PDF
        document.getElementById("pdf-nama").textContent = namaEl.textContent;
        document.getElementById("pdf-nis").textContent = nisEl.textContent;
        document.getElementById("pdf-kelas").textContent = kelasEl.textContent;
        document.getElementById("pdf-pengajar").textContent = pengajarEl.textContent;

        // 3. AMBIL PERIODE DARI DROPDOWN (PENTING)
        const periodeSelect = document.querySelector(".ysq-select-minimal");
        const teksPeriode = periodeSelect ? periodeSelect.options[periodeSelect.selectedIndex].text : "-";
        const pdfPeriodeEl = document.getElementById("pdf-periode");
        if (pdfPeriodeEl) pdfPeriodeEl.textContent = teksPeriode;

        // 4. Siapkan Area Tabel
        const tableArea = document.getElementById("pdf-content-table");
        const nilaiAkhir = Number(dataRapor.nilai_akhir || 0);
        const p = getPredikatUI(nilaiAkhir);
        const statusTeks = nilaiAkhir >= 60 ? "LULUS" : "MENGULANG";

        // 5. Render HTML Tabel berdasarkan Jenis Rapor
        if (jenis === "tahsin") {
            tableArea.innerHTML = `
                <table class="pdf-table">
                    <thead>
                        <tr><th>KOMPONEN PENILAIAN</th><th>NILAI</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Nilai Pekanan</td><td>${dataRapor.nilai_pekanan || 0}</td></tr>
                        <tr><td>Ujian Tilawah (Lisan)</td><td>${dataRapor.ujian_tilawah || 0}</td></tr>
                        <tr><td>Nilai Teori (G-Form)</td><td>${dataRapor.nilai_teori || 0}</td></tr>
                        <tr><td>Presensi Kehadiran</td><td>${dataRapor.nilai_presensi || 0}</td></tr>
                        <tr class="row-highlight-orange">
                            <td style="font-weight:bold">NILAI AKHIR</td>
                            <td style="font-weight:bold">${nilaiAkhir.toFixed(2)}</td>
                        </tr>
                        <tr class="row-highlight-blue">
                            <td>PREDIKAT</td>
                            <td style="font-weight:bold">${p.teks.toUpperCase()}</td>
                        </tr>
                        <tr style="font-weight:bold; background: #f9f9f9;">
                            <td>STATUS KELULUSAN</td>
                            <td style="color: ${nilaiAkhir >= 60 ? 'green' : 'red'}">${statusTeks}</td>
                        </tr>
                    </tbody>
                </table>`;
        } else {
            // Untuk Tahfidz
            let simakanRows = dataRapor.simakan && dataRapor.simakan.length > 0 
                ? dataRapor.simakan.map(s => `<tr><td>Juz ${s.juz}</td><td>${s.nilai}</td></tr>`).join('')
                : `<tr><td colspan="2">Tidak ada data simakan</td></tr>`;

            tableArea.innerHTML = `
                <table class="pdf-table">
                    <thead>
                        <tr class="row-highlight-orange"><th colspan="2">RINCIAN NILAI SIMAKAN</th></tr>
                        <tr><th>NOMOR JUZ</th><th>NILAI</th></tr>
                    </thead>
                    <tbody>
                        ${simakanRows}
                        <tr class="row-highlight-orange">
                            <td>Rata-rata Simakan</td>
                            <td>${Number(dataRapor.nilai_rata_simakan || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Nilai Ujian Akhir (UAS)</td>
                            <td>${Number(dataRapor.nilai_ujian_akhir || 0).toFixed(2)}</td>
                        </tr>
                        <tr class="row-highlight-blue">
                            <td style="font-weight:bold">TOTAL AKHIR (PREDIKAT)</td>
                            <td style="font-weight:bold">${nilaiAkhir.toFixed(2)}</td>
                        </tr>
                        <tr style="font-weight:bold; background:#eee">
                            <td>PREDIKAT</td>
                            <td>${p.teks.toUpperCase()}</td>
                        </tr>
                        <tr style="font-weight:bold">
                            <td>STATUS KELULUSAN</td>
                            <td style="color: ${nilaiAkhir >= 60 ? 'green' : 'red'}">${statusTeks}</td>
                        </tr>
                    </tbody>
                </table>`;
        }

        // 6. Proses Konversi HTML ke Gambar (Canvas)
        const element = document.getElementById("rapor-template-print");
        
        // Gunakan parameter scale tinggi agar PDF tidak pecah/blur
        const canvas = await html2canvas(element, { 
            scale: 3, 
            useCORS: true,
            logging: false,
            allowTaint: true
        });

        // 7. Generate PDF
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");
        
        // Ukuran A4 dalam mm adalah 210 x 297
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        
        // Simpan dengan nama file yang informatif
        const namaFile = `Rapor_${jenis}_${namaEl.textContent}_${teksPeriode.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
        pdf.save(namaFile);

    } catch (error) {
        console.error("Error saat download PDF:", error);
        alert("Terjadi kesalahan saat membuat PDF. Silakan coba lagi.");
    }
};


