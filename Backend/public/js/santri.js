import { apiGet, apiPostForm } from "../js/apiService.js";

/* ======================================================
    STATE & HELPER FUNCTIONS
====================================================== */
let materiCache = [];

// Fungsi untuk ambil parameter ID di URL
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Fungsi PASTI sesuai tanggal laptop (Perbaikan dari sebelumnya)
function setTanggalHariIni() {
    const el = document.getElementById("tanggal-hari-ini");
    if (!el) return;
    const now = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    el.textContent = now.toLocaleDateString('id-ID', options);
}

function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Tambahkan fungsi setText yang mungkin ikut hilang
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? "-";
}


// 🔧 FIX PATH uploads (TANPA ROMBAK)
function fixUploadPath(filePath, folder = "") {
    if (!filePath) return null;

    // Jika DB sudah simpan "/uploads/..."
    if (filePath.startsWith("/uploads")) return filePath;

    // Jika DB hanya simpan nama file
    return folder
        ? `/uploads/${folder}/${filePath}`
        : `/uploads/${filePath}`;
}

/* ======================================================
    INITIALIZATION & PAGE DETECTION
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setTanggalHariIni(); // Set tanggal di pojok kanan atas

    if (document.getElementById("materi-table-body")) {
        initListMateriSantri();
    }

    if (document.getElementById("jadwal-body")) {
        initDashboardSantri();
    }

    if (document.getElementById("materi-table-body")) {
        initListMateriSantri();
    }

    const subForm = document.getElementById("submissionForm");
    if (subForm) {
        subForm.addEventListener("submit", handleSubmission);
    }

   // Di santri.js (Bagian DOMContentLoaded)
const fileInput = document.getElementById("audioFile");
if (fileInput) {
    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB sesuaikan dengan backend

        if (file && file.size > MAX_SIZE) {
            alert(`File "${file.name}" terlalu besar! Maksimal ukuran adalah 10MB.`);
            this.value = ""; // Reset input agar tidak jadi diupload
            return;
        }

        // Jika lolos validasi, tampilkan nama file seperti biasa
        const fileNameDisplay = document.querySelector(".audio-upload-box p");
        const fileStatusInfo = document.getElementById("fileStatusInfo");
        if (fileNameDisplay) fileNameDisplay.textContent = "File Terpilih";
        if (fileStatusInfo) {
            fileStatusInfo.innerHTML = `<i class='bx bx-check-circle'></i> Siap kirim: <strong>${file.name}</strong>`;
        }
    });
}

    
});


/* ======================================================
    1. DASHBOARD SANTRI
====================================================== */
async function initDashboardSantri() {
    try {
        const data = await apiGet("/kelas/santri/me");
        if (!data || !data.santri) return;

        setText("namaSantri", data.santri.nama);
        setText("nisSantri", data.santri.nis);
        setText("kategori-santri", data.santri.kategori);
        setText("kelas-santri", data.santri.nama_kelas);

        renderJadwalSantri(data.santri, data.jadwal ?? []);
    } catch (error) {
        console.error("DASHBOARD SANTRI ERROR:", error);
    }
}

function renderJadwalSantri(santri, jadwal) {
    const tbody = document.getElementById("jadwal-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    if (jadwal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" align="center">Belum ada jadwal kelas</td></tr>`;
        return;
    }

    setText("jadwal-santri", [...new Set(jadwal.map(j => j.hari))].join(", "));

    jadwal.forEach((item, i) => {
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${i + 1}</td>
                <td>${santri.nama_kelas}</td>
                <td>${item.hari}</td>
                <td>${item.jam_mulai} - ${item.jam_selesai}</td>
                <td>${item.pengajar}</td>
                <td align="center">
                    <a href="/dashboard/materi-santri?id_kelas=${santri.id_kelas}">
                        <i class='bx bx-task' style="font-size: 22px; color: #2d5a3f;"></i>
                    </a>
                </td>
            </tr>
        `);
    });
}

/* ======================================================
    2. LIST MATERI AJAR & TUGAS
====================================================== */
async function initListMateriSantri() {
  const id_kelas = getUrlParam("id_kelas");
  if (!id_kelas || id_kelas === "undefined") {
      alert("ID Kelas tidak terdeteksi.");
      window.location.href = "/dashboard/santri";
      return;
  }

  try {
      const response = await apiGet(`/tugas-media/materi/kelas/${id_kelas}`);
      materiCache = response;
      setText("nama-kelas-header", `Kelas: ${response[0]?.nama_kelas || "Aktif"}`);
      renderTableMateri(response);
  } catch (err) {
      console.error("Gagal muat materi:", err);
  }
}

function renderTableMateri(data) {
  const tbody = document.getElementById("materi-table-body");
  if (!tbody) return;

  if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" align="center">Belum ada materi untuk kelas ini.</td></tr>`;
      return;
  }

  tbody.innerHTML = data.map((item, index) => {
      const tgl = item.deadline_tugas || item.deadline; 
      let displayDeadline = tgl ? new Date(tgl).toLocaleDateString('id-ID') : "-";

      return `
          <tr>
              <td>${index + 1}</td>
              <td><strong>${item.judul}</strong></td>
              <td>${item.id_tugas ? '<span class="status-badge" style="background:#e8f5e9; color:#2e7d32; padding:4px 8px; border-radius:4px; font-size:12px;">Ada Tugas</span>' : '<span style="color:#94a3b8">Hanya Materi</span>'}</td>
              <td>${new Date(item.created_at).toLocaleDateString('id-ID')}</td>
              <td><span style="color: #e67e22; font-weight: 600;">${displayDeadline}</span></td>
              <td style="text-align: center;">
                  <button class="btn-detail-sqm" onclick="showDetailMateri(${item.id_materi})">
                      <i class="fas fa-eye"></i> Detail
                  </button>
              </td>
          </tr>`;
  }).join("");
}

/* ======================================================
    3. DETAIL VIEW & FORM SUBMISSION (FIXED)
====================================================== */
window.showDetailMateri = async function (idMateri) {
    // 1. Cari data materi dari cache
    const materi = materiCache.find(m => m.id_materi === idMateri);
    if (!materi) {
        alert("Data materi tidak ditemukan.");
        return;
    }

    // 2. Perpindahan tampilan (List ke Detail)
    const viewList = document.getElementById('view-list-materi');
    const viewDetail = document.getElementById('view-detail-materi');
    if (viewList) viewList.style.display = 'none';
    if (viewDetail) viewDetail.style.display = 'block';

    // 3. Reset state tampilan detail (Scroll ke atas)
    window.scrollTo(0, 0);

    // 4. Isi Informasi Utama Materi
    setText('det-materi-judul', materi.judul);
    setText('det-materi-deskripsi', materi.deskripsi_materi || "Tidak ada deskripsi.");

    // 5. Render Lampiran File/Link Materi
    const materiFileBox = document.getElementById("det-materi-file-container");
    if (materiFileBox) {
        materiFileBox.innerHTML = "";
        if (fixUploadPath(materi.file_path)) {
            materiFileBox.innerHTML = `
               <a href="${fixUploadPath(materi.file_path, 'materi')}" target="_blank">
                    <i class="fas fa-file-download"></i> Unduh File Materi
                </a>`;
        } else if (materi.link_url) {
            materiFileBox.innerHTML = `
                <a href="${materi.link_url}" target="_blank" class="file-link">
                    <i class="fas fa-link"></i> Buka Link Materi
                </a>`;
        } else {
            materiFileBox.innerHTML = `<p class="text-muted" style="font-size:0.9rem;"><i>Tidak ada lampiran materi.</i></p>`;
        }
    }

    // 6. Logika Bagian Tugas
    const taskContainer = document.getElementById("tugas-container");
    const submissionForm = document.getElementById("submissionForm");
    const mySubmissionInfo = document.getElementById("mySubmissionInfo");

    if (materi.id_tugas) {
        // Tampilkan wadah tugas
        if (taskContainer) taskContainer.style.display = "block";

        // Isi Instruksi & Deadline
        setText("det-tugas-instruksi", materi.instruksi_tugas || "Kerjakan tugas sesuai instruksi pengajar.");
        setText("det-tugas-deadline", materi.deadline_tugas 
            ? new Date(materi.deadline_tugas).toLocaleDateString("id-ID", { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              }) 
            : "Tidak ada batas waktu"
        );

        // Set Hidden Input ID Tugas untuk form pengiriman
        const activeIdTugasInput = document.getElementById("active-id-tugas");
        if (activeIdTugasInput) activeIdTugasInput.value = materi.id_tugas;

        // Render Lampiran File dari Pengajar (Jika ada file tugas spesifik)
        const tugasFileBox = document.getElementById("det-tugas-file-container");
        if (tugasFileBox) {
            tugasFileBox.innerHTML = "";
            if (materi.file_tugas) {
                tugasFileBox.innerHTML = `
                    <a href="${fixUploadPath(materi.file_tugas, 'tugas')}" target="_blank" class="file-link" style="background: #fdf2f2; color: #991b1b; border: 1px solid #fecaca;">
                        <i class="fas fa-file-pdf"></i> Unduh Panduan Tugas
                    </a>`;
            } else if (materi.link_tugas) {
                tugasFileBox.innerHTML = `
                    <a href="${materi.link_tugas}" target="_blank" class="file-link">
                        <i class="fas fa-external-link-alt"></i> Buka Link Referensi Tugas
                    </a>`;
            }
        }

        // 🔥 KUNCI UTAMA: Cek apakah santri sudah mengerjakan tugas ini atau belum
        // Fungsi ini akan otomatis menyembunyikan form dan menampilkan nilai jika sudah dikumpul
        await cekPengumpulanSaya(materi.id_tugas);

    } else {
        // Sembunyikan bagian tugas jika materi ini memang tidak ada tugasnya
        if (taskContainer) taskContainer.style.display = "none";
        if (submissionForm) submissionForm.style.display = "none";
        if (mySubmissionInfo) mySubmissionInfo.style.display = "none";
    }
};
  
///====================================================================
  async function handleSubmission(e) {
    e.preventDefault();
    
    // Ambil element
    const idTugasInput = document.getElementById("active-id-tugas");
    const fileInput = document.getElementById("audioFile");
    const linkInput = document.getElementById("link-tugas");
    const btn = e.target.querySelector('button[type="submit"]');

    const id_tugas = idTugasInput ? idTugasInput.value : null;

    if (!id_tugas) {
        return alert("Error: ID Tugas tidak ditemukan. Coba refresh halaman.");
    }

    if (!fileInput.files[0] && !linkInput.value.trim()) {
        return alert("Pilih file atau masukkan link terlebih dahulu.");
    }

    const formData = new FormData();
    formData.append("id_tugas", id_tugas);
    
    // Nama field harus "file" agar dibaca oleh upload.single("file") di backend
    if (fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
    }

    if (linkInput.value.trim()) {
        formData.append("link_url", linkInput.value.trim());
    }

    try {
        btn.disabled = true;
        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Mengirim...";

        // Pastikan endpoint ini benar sesuai tugasmateriajarroutes.js
        const response = await apiPostForm("/tugas-media/tugas/submit", formData);
        
        alert("Berhasil! Tugas Anda telah terkirim.");
        await cekPengumpulanSaya(id_tugas);
    } catch (err) {
        console.error("Gagal Submit:", err);
        alert(err.error || err.message || "Gagal mengirim tugas.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<i class='bx bxs-paper-plane'></i> Kirim Setoran";
    }
}

window.backToList = function () {
    document.getElementById("view-detail-materi").style.display = "none";
    document.getElementById("view-list-materi").style.display = "block";
    document.getElementById("submissionForm").reset();
    document.getElementById("fileStatusInfo").textContent = "";
    document.querySelector(".audio-upload-box p").textContent = "Pilih File";
};

//====================================================================================

async function cekPengumpulanSaya(idTugas) {
    const formSection = document.getElementById("submissionForm");
    const infoSection = document.getElementById("mySubmissionInfo");

    try {
        const res = await apiGet(`/tugas-media/tugas/${idTugas}/submission/me`);

        if (res && res.submitted) {
            const data = res.data;
            formSection.style.display = "none"; 
            infoSection.style.display = "block";
            
            // --- FIX LOGIKA LAMPIRAN ---
            let lampiranHTML = "";
            if (data.file_path) {
                // Pastikan folder adalah 'submit' dan tag <a> ditutup dengan benar
                const fullPath = fixUploadPath(data.file_path, 'submit');
                lampiranHTML = `
                    <a href="${fullPath}" target="_blank" style="color: #2d5a3f; font-weight: 600; text-decoration: underline;">
                        <i class='bx bx-file'></i> Lihat File yang Dikirim
                    </a>`;
            } else if (data.link_url) {
                lampiranHTML = `
                    <a href="${data.link_url}" target="_blank" style="color: #2d5a3f; font-weight: 600; text-decoration: underline;">
                        <i class='bx bx-link'></i> Buka Link yang Dikirim
                    </a>`;
            } else {
                lampiranHTML = "<span style='color: #94a3b8;'>Tidak ada lampiran</span>";
            }

            // Render Tampilan
            infoSection.innerHTML = `
                <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; position: relative;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #64748b; font-size: 0.75rem; text-transform: uppercase;">Catatan/Jawaban Anda:</label>
                        <p style="margin-top: 5px; color: #1e293b; font-size: 0.95rem; line-height: 1.5;">
                            ${data.catatan_santri || "<i>Tidak ada catatan.</i>"}
                        </p>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #64748b; font-size: 0.75rem; text-transform: uppercase;">Lampiran:</label>
                        <div style="margin-top: 5px;">${lampiranHTML}</div>
                    </div>

                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                        <small style="color: #94a3b8;">Dikirim pada: ${new Date(data.submitted_at).toLocaleString('id-ID')}</small>
                    </div>

                    <div style="position: absolute; bottom: 15px; right: 15px; text-align: right;">
                        <span style="display: block; font-size: 0.7rem; color: #64748b; font-weight: bold; text-transform: uppercase;">Nilai</span>
                        <div style="font-size: 1.8rem; font-weight: 800; color: #2d5a3f;">
                            ${data.nilai !== null ? data.nilai : '<span style="font-size: 0.9rem; color: #e67e22;">---</span>'}
                        </div>
                    </div>
                </div>
                
                ${data.catatan_pengajar ? `
                    <div style="margin-top: 15px; padding: 10px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <small style="font-weight: bold; color: #b45309;">Catatan Pengajar:</small>
                        <p style="margin: 0; font-size: 0.85rem; color: #92400e;">${data.catatan_pengajar}</p>
                    </div>
                ` : ''}
            `;
        } else {
            formSection.style.display = "block";
            infoSection.style.display = "none";
        }
    } catch (err) {
        console.error("Gagal cek pengumpulan:", err);
    }
}