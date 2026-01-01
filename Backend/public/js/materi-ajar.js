
   CONFIG & STATE
/*===================================================== */
const BASE_URL = "/api";
let selectedKelas = null;
let userRole = null;

// State Management
let isEditModeMateri = false;
let isEditModeTugas = false;
let activeMateriId = null;
let activeTugasId = null;
let isSubmittingTugas = false;

// DOM Elements
let kelasSelect = null;
let tanggalInput = null;
let tableBody = null;

/* =====================================================
   FETCH HELPER
===================================================== */
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw { message: "Token tidak ditemukan" };

  const res = await fetch(BASE_URL + url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch (_) {}
    throw err;
  }
  return res.json();
}

/* =====================================================
   INIT & ELEMENT SETUP
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const me = await fetchWithAuth("/me");
    userRole = me.role;
    if (userRole !== "pengajar") throw { message: "Akses khusus pengajar" };

    initElements();
    setToday();
    await loadKelasByTanggal();
  } catch (err) {
    alert(err.message || "Akses ditolak");
    window.location.href = "/login";
  }
});

function initElements() {
  kelasSelect = document.getElementById("materiKelasSelect");
  tanggalInput = document.getElementById("materiTanggal");
  tableBody = document.getElementById("materiTableBody");

  tanggalInput?.addEventListener("change", loadKelasByTanggal);
  kelasSelect?.addEventListener("change", () => {
    selectedKelas = kelasSelect.value;
    loadMateri();
  });
}

function setToday() { 
  if(tanggalInput) tanggalInput.value = new Date().toISOString().split("T")[0]; 
}

/* =====================================================
   LOGIKA JADWAL & TABEL
===================================================== */
async function loadKelasByTanggal() {
  if (!kelasSelect || !tableBody) return;
  kelasSelect.innerHTML = `<option value="">-- Pilih Kelas --</option>`;
  const hari = new Date(tanggalInput.value).toLocaleDateString("id-ID", { weekday: "long" });

  try {
    const jadwal = await fetchWithAuth("/jadwal/pengajar/me");
    const kelasHariIni = jadwal.filter(j => j.hari === hari);

    if (!kelasHariIni.length) {
      selectedKelas = null;
      tableBody.innerHTML = `<tr><td colspan="5" align="center">Tidak ada jadwal hari ini</td></tr>`;
      return;
    }

    kelasHariIni.forEach(k => {
      const opt = document.createElement("option");
      opt.value = k.id_kelas;
      opt.textContent = `${k.nama_kelas} (${k.jam_mulai})`;
      kelasSelect.appendChild(opt);
    });

    selectedKelas = kelasHariIni[0].id_kelas;
    kelasSelect.value = selectedKelas;
    loadMateri();
  } catch (err) { console.error(err); }
}

// Di materi-ajar.js
async function loadMateri() {
  if (!selectedKelas || !tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="6" align="center">Memuat materi...</td></tr>`;

  try {
    const materi = await fetchWithAuth(`/tugas-media/materi/kelas/${selectedKelas}/pengajar`);
    console.log("Data Materi dari Server:", materi); // CEK DI CONSOLE F12
    window.currentMateriList = materi; 

    if (!materi || materi.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" align="center">Belum ada materi.</td></tr>`;
      return;
    }

    tableBody.innerHTML = materi.map((m, i) => {
      // 1. Jenis Konten
      const jenisKonten = m.file_path 
        ? `<span style="color: #0ea5e9;"><i class="fas fa-file-alt"></i> File</span>` 
        : (m.link_url ? `<span style="color: #f59e0b;"><i class="fas fa-link"></i> Link</span>` : "-");

      // 2. STATUS (MENYESUAIKAN ISI DETAIL)
      // Cek apakah id_tugas ada. Jika null, berarti di detail tidak akan ada tugas.
      const adaTugas = m.id_tugas !== null && m.id_tugas !== undefined;
      
      const statusHTML = adaTugas 
        ? `<div style="background: #eef2ff; color: #4338ca; padding: 6px; border-radius: 6px; border: 1px solid #c7d2fe; font-weight: bold; font-size: 11px; text-align: center;">
             <i class="fas fa-thumbtack"></i> ADA TUGAS
           </div>`
        : `<div style="background: #f8fafc; color: #94a3b8; padding: 6px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px; text-align: center;">
             <i class="fas fa-minus"></i> HANYA MATERI
           </div>`;

      // 3. Tanggal Upload
      const tglUpload = m.created_at 
        ? new Date(m.created_at).toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' })
        : "-";

      return `
        <tr>
          <td align="center">${i + 1}</td>
          <td><strong>${m.judul}</strong></td>
          <td align="center">${jenisKonten}</td>
          <td>${statusHTML}</td> 
          <td align="center">${tglUpload}</td>
          <td align="center">
            <button class="btn-detail" onclick="lihatDetail(${m.id_materi})">
              <i class="fas fa-eye"></i> Detail
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error Load Materi:", err);
    tableBody.innerHTML = `<tr><td colspan="6" align="center" style="color:red;">Gagal memuat data</td></tr>`;
  }
}

/* =====================================================
   LOGIKA MODAL DETAIL (PUSAT KENDALI)
===================================================== */
window.lihatDetail = async (idMateri) => {
  try {
    // Pastikan ID dalam bentuk Number untuk perbandingan
    activeMateriId = Number(idMateri);
    
    if (!window.currentMateriList) {
        console.error("List materi kosong");
        return;
    }

    const materi = window.currentMateriList.find(m => Number(m.id_materi) === activeMateriId);
    
    if (!materi) {
        alert("Materi tidak ditemukan di daftar");
        return;
    }

    // Gunakan optional chaining (?.) untuk mencegah error jika elemen DOM tidak ada
    const judulEl = document.getElementById("detMateriJudul");
    const deskEl = document.getElementById("detMateriDeskripsi");
    const kontanBox = document.getElementById("detMateriKonten");

    if (judulEl) judulEl.innerText = materi.judul;
    if (deskEl) deskEl.innerText = materi.deskripsi || "Tidak ada deskripsi";
    
    if (kontanBox) {
        kontanBox.innerHTML = materi.file_path 
          ? `<a href="${materi.file_path}" target="_blank" class="btn-view"><i class="fas fa-file-download"></i> Lihat File Materi</a>` 
          : (materi.link_url ? `<a href="${materi.link_url}" target="_blank" class="btn-view"><i class="fas fa-link"></i> Buka Link</a>` : "<p class='text-muted'>Tidak ada lampiran</p>");
    }

    // Ambil data tugas dari backend
    const tugasRes = await fetchWithAuth(`/tugas-media/tugas/materi/${activeMateriId}`);
    renderTugasInfo(tugasRes);

    // Tampilkan Modal
    const modalDetail = document.getElementById("modalDetailTerpadu");
    if (modalDetail) modalDetail.style.display = "flex";

  } catch (err) {
    console.error("Detail Error:", err);
    alert("Gagal memuat detail: " + (err.message || "Masalah koneksi"));
  }
};

function renderTugasInfo(tugasList) {
  const section = document.getElementById("sectionDetailTugas");
  const btnBuatWrapper = document.getElementById("btnBuatTugasWrapper");
  const statusWrapper = document.getElementById("statusSantriWrapper");
  const lampiranTugas = document.getElementById("detTugasLampiran");

  if (!tugasList || tugasList.length === 0) {
      if (section) section.style.display = "none";
      if (statusWrapper) statusWrapper.style.display = "none";
      if (btnBuatWrapper) {
          btnBuatWrapper.style.display = "block";
          btnBuatWrapper.innerHTML = `
              <button class="btn-status-full" onclick="openModalTugasBaru()" style="width:100%; background:#0ea5e9; color:white; padding:12px; border-radius:8px; border:none; font-weight:600; cursor:pointer; margin-top:15px;">
                  <i class="fas fa-plus-circle"></i> Buat Tugas untuk Materi Ini
              </button>
          `;
      }
      activeTugasId = null;
      return;
  }

  const t = tugasList[0];
  activeTugasId = t.id_tugas;

  if (section) section.style.display = "block";
  if (btnBuatWrapper) btnBuatWrapper.style.display = "none";
  if (statusWrapper) statusWrapper.style.display = "block";

  // Gunakan ID yang sesuai dengan HTML yang baru (detTugasJudul & detTugasDeadline)
  const judulEl = document.getElementById("detTugasJudul");
  const deadEl = document.getElementById("detTugasDeadline");

  if (judulEl) judulEl.innerText = t.deskripsi;
  if (deadEl) {
      deadEl.innerText = new Date(t.deadline).toLocaleDateString('id-ID', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
  }

  // Render Lampiran
  if (lampiranTugas) {
      let htmlLampiran = "";
      if (t.file_path) {
          htmlLampiran += `<a href="${t.file_path}" target="_blank" class="btn-view" style="margin-right:10px;"><i class="fas fa-file-download"></i> File Tugas</a>`;
      }
      if (t.link_url) {
          htmlLampiran += `<a href="${t.link_url}" target="_blank" class="btn-view"><i class="fas fa-external-link-alt"></i> Link Tugas</a>`;
      }
      lampiranTugas.innerHTML = htmlLampiran || "<p class='text-muted' style='font-size:12px;'>Tidak ada lampiran dokumen</p>";
  }

  // Set tombol aksi
  const btnEditT = document.getElementById("btnEditTugas");
  const btnEditM = document.getElementById("btnEditMateri");
  if (btnEditT) btnEditT.onclick = () => openEditTugas(t);
  if (btnEditM) btnEditM.onclick = () => openEditMateri();
}

/* =====================================================
   1. FEEDBACK PILIH FILE (MATERI & TUGAS)
===================================================== */
// Tambahkan event listener untuk mendeteksi perubahan file
document.addEventListener("change", (e) => {
  // Untuk Modal Materi
  if (e.target && e.target.id === "fileMateri") {
      const fileInfo = document.getElementById("fileInfo");
      if (e.target.files.length > 0) {
          fileInfo.innerHTML = `<i class="fas fa-file-alt"></i> File terpilih: <strong>${e.target.files[0].name}</strong>`;
          fileInfo.style.color = "#059669"; // Warna hijau sukses
      }
  }
  // Untuk Modal Tugas
  if (e.target && e.target.id === "modalTugasFile") {
      const file = e.target.files[0];
      if (file) {
          // Kita bisa tambahkan element info di bawah input file tugas jika belum ada
          alert("File tugas terpilih: " + file.name); 
      }
  }
});

/* =====================================================
 2. MANAJEMEN POPUP STATUS (Sembunyi/Muncul Detail)
===================================================== */
window.showStatusSantri = async () => {
  if (!activeTugasId) {
      alert("ID Tugas tidak ditemukan.");
      return;
  }
  
  // 1. SEMBUNYIKAN MODAL DETAIL (Agar tidak bertumpuk)
  document.getElementById("modalDetailTerpadu").style.display = "none";
  
  try {
      const listBody = document.getElementById("listStatusSantri");
      listBody.innerHTML = "<tr><td colspan='4' align='center'>Memuat data pengumpulan...</td></tr>";
      
      // 2. TAMPILKAN MODAL STATUS
      document.getElementById("modalStatusSantri").style.display = "flex";

      // Pastikan route ini sesuai dengan backend: /api/tugas-media/tugas/:id/status
      const data = await fetchWithAuth(`/tugas-media/tugas/${activeTugasId}/status`);
      
     // Di dalam fungsi showStatusSantri, bagian listBody.innerHTML:
listBody.innerHTML = data.map(s => {
    const isSudah = s.status === 'Sudah Kirim';
    
    // Logika Aksi (Tombol lihat file/link)
    let aksiHTML = "-";
    if (isSudah) {
        const fileIcon = s.file_path ? `<a href="${s.file_path}" target="_blank" style="color: #e67e22; margin-right: 8px;"><i class="fas fa-file-audio fa-lg"></i></a>` : '';
        const linkIcon = s.link_url ? `<a href="${s.link_url}" target="_blank" style="color: #3498db;"><i class="fas fa-link fa-lg"></i></a>` : '';
        aksiHTML = `${fileIcon} ${linkIcon}`;
    }

    return `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>${s.nama}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <span style="padding: 4px 10px; border-radius: 20px; font-size: 11px; background: ${isSudah ? '#dcfce7' : '#fee2e2'}; color: ${isSudah ? '#166534' : '#991b1b'};">
                    ${s.status}
                </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                ${s.submitted_at ? new Date(s.submitted_at).toLocaleString('id-ID', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) : '-'}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;" align="center">
                ${aksiHTML}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;" align="center">
                <span style="font-weight: bold; color: #64748b;">-</span>
            </td>
        </tr>
    `;
}).join("");
  } catch (err) {
      console.error("Error Detail:", err);
      alert("Gagal memuat status: " + (err.error || err.message || "Masalah koneksi"));
      // Jika gagal, kembalikan ke modal detail agar user tidak bingung
      document.getElementById("modalDetailTerpadu").style.display = "flex";
  }
};

// Fungsi Tutup Modal Status dan Kembali ke Detail
window.closeStatusAndBackToDetail = () => {
  document.getElementById("modalStatusSantri").style.display = "none";
  document.getElementById("modalDetailTerpadu").style.display = "flex";
};

/* =====================================================
   SUBMIT HANDLERS (FIXED)
===================================================== */
window.handleKirimTugas = async () => {
  if (isSubmittingTugas) return;

  // Pastikan ID elemen sesuai dengan HTML: "tugasDeadline"
  const desc = document.getElementById("modalTugasDesc")?.value?.trim();
  const deadlineInput = document.getElementById("tugasDeadline");
  const deadlineValue = deadlineInput?.value;

  if (!desc || !deadlineValue) {
      alert("Deskripsi & Deadline wajib diisi!");
      return;
  }

  isSubmittingTugas = true;
  const formData = new FormData();
  formData.append("id_kelas", selectedKelas);
  formData.append("id_materi", activeMateriId);
  formData.append("deskripsi", desc);
  
  // 🔥 KUNCI PERBAIKAN: Kirim field "deadline" secara konsisten
  formData.append("deadline", deadlineValue); 

  const fileEl = document.getElementById("modalTugasFile");
  if (fileEl?.files?.[0]) formData.append("file", fileEl.files[0]);

  const link = document.getElementById("modalTugasLink")?.value?.trim();
  if (link) formData.append("link_url", link);

  try {
      const url = isEditModeTugas 
          ? `${BASE_URL}/tugas-media/tugas/${activeTugasId}` 
          : `${BASE_URL}/tugas-media/tugas`;
      
      const method = isEditModeTugas ? "PUT" : "POST";

      const res = await fetch(url, {
          method: method,
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: formData
      });

      const result = await res.json();
      if (!res.ok) throw result;

      alert(isEditModeTugas ? "Tugas diperbarui!" : "Tugas berhasil dibuat!");
      
      isEditModeTugas = false;
      closeModalTugas();
      // Refresh detail agar info tugas terbaru muncul
      lihatDetail(activeMateriId); 
      
  } catch (err) {
      console.error("SUBMIT ERROR:", err);
      alert(err.error || err.message || "Gagal menyimpan tugas");
  } finally {
      isSubmittingTugas = false;
  }
};

/* =====================================================
   MODAL CONTROLS
===================================================== */
window.openMateriModal = () => {
  if (!selectedKelas) return alert("Pilih kelas terlebih dahulu");
  document.getElementById("modalMateri").style.display = "flex";
};
window.closeMateriModal = () => {
  document.getElementById("formMateri").reset();
  document.getElementById("modalMateri").style.display = "none";
};
window.openModalTugasBaru = () => document.getElementById("modalTugas").style.display = "flex";
window.closeModalTugas = () => document.getElementById("modalTugas").style.display = "none";
window.closeModalDetail = () => document.getElementById("modalDetailTerpadu").style.display = "none";
window.closeModal = (id) => document.getElementById(id).style.display = "none";

window.toggleMateriType = () => {
  const tipe = document.getElementById("tipeMateri").value;
  document.getElementById("fileGroup").style.display = tipe === "file" ? "block" : "none";
  document.getElementById("linkGroup").style.display = tipe === "link" ? "block" : "none";
};

// EDIT MATERI
window.openEditMateri = () => {
  // Cari data materi dari list global
  const materi = window.currentMateriList.find(m => m.id_materi === activeMateriId);
  if (!materi) return alert("Data materi gagal dimuat");

  isEditModeMateri = true;
  document.getElementById("modalMateri").style.display = "flex";
  document.querySelector("#modalMateri h3").innerHTML = '<i class="fas fa-edit"></i> Edit Materi';
  
  // Isi field form
  document.getElementById("judulMateri").value = materi.judul;
  document.getElementById("deskripsiMateri").value = materi.deskripsi || "";
  document.getElementById("tipeMateri").value = materi.tipe_konten;
  
  // Trigger tampilan field (file/link)
  window.toggleMateriType();
  if (materi.tipe_konten === "link") {
      document.getElementById("linkMateri").value = materi.link_url || "";
  }
};

// EDIT TUGAS
window.openEditTugas = (tugas) => {
  if (!tugas || !tugas.id_tugas) {
    alert("ID Tugas tidak valid");
    return;
  }

  activeTugasId = tugas.id_tugas; // 🔥 FIX PENTING
  isEditModeTugas = true;

  document.getElementById("modalTugas").style.display = "flex";
  document.querySelector("#modalTugas h3").innerHTML =
    '<i class="fas fa-edit"></i> Edit Tugas';

  document.getElementById("modalTugasDesc").value = tugas.deskripsi || "";
  document.getElementById("modalTugasLink").value = tugas.link_url || "";

  document.getElementById("tugasDeadline").value =
    new Date(tugas.deadline).toISOString().split("T")[0];
    
    const info = document.getElementById("infoFileLamaTugas");
    if (info) {
      if (tugas.file_path) {
        info.innerHTML = `
          <small style="color:#0f766e">
            📎 File saat ini:
            <a href="${tugas.file_path}" target="_blank">Lihat file</a>
          </small>
        `;
      } else {
        info.innerHTML = "<small>Tidak ada file sebelumnya</small>";
      }
    }
    
};


document.getElementById("formMateri").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("id_kelas", selectedKelas);
  formData.append("judul", document.getElementById("judulMateri").value);
  formData.append("deskripsi", document.getElementById("deskripsiMateri").value);
  formData.append("tipe_konten", document.getElementById("tipeMateri").value);

  // Penanganan File/Link
  if (tipeMateri.value === "file") {
    const file = document.getElementById("fileMateri").files[0];
    if (file) formData.append("file", file); 
    // Saat edit, file tidak wajib diisi ulang jika tidak ingin ganti file
  } else {
    formData.append("link_url", document.getElementById("linkMateri").value);
  }

  try {
    // TENTUKAN URL DAN METHOD (POST jika baru, PUT jika edit)
    const url = isEditModeMateri 
                ? `/api/tugas-media/materi/${activeMateriId}` 
                : "/api/tugas-media/materi";
    const method = isEditModeMateri ? "PUT" : "POST";

    const res = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!res.ok) throw await res.json();

    alert(isEditModeMateri ? "Materi berhasil diperbarui" : "Materi berhasil ditambahkan");
    isEditModeMateri = false; // Reset state
    closeMateriModal();
    loadMateri();
  } catch (err) {
    alert("Gagal menyimpan: " + (err.message || "Terjadi kesalahan"));
  }
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