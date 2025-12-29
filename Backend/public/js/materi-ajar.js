/* =====================================================
   CONFIG & STATE
===================================================== */
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

async function loadMateri() {
  if (!selectedKelas || !tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="5" align="center">Memuat materi...</td></tr>`;

  try {
    const materi = await fetchWithAuth(`/tugas-media/materi/kelas/${selectedKelas}/pengajar`);
    window.currentMateriList = materi; // Simpan ke global agar bisa diakses lihatDetail

    if (!materi.length) {
      tableBody.innerHTML = `<tr><td colspan="5" align="center">Belum ada materi.</td></tr>`;
      return;
    }

    tableBody.innerHTML = materi.map((m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${m.judul}</strong></td>
        <td><span class="badge-${m.tipe_konten}">${m.tipe_konten === 'file' ? '📁 File' : '🔗 Link'}</span></td>
        <td>${new Date(m.created_at).toLocaleDateString("id-ID")}</td>
        <td>
          <button class="btn-detail" onclick="lihatDetail(${m.id_materi})">
            <i class="fas fa-eye"></i> Detail
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) { console.error(err); }
}

/* =====================================================
   LOGIKA MODAL DETAIL (PUSAT KENDALI)
===================================================== */
window.lihatDetail = async (idMateri) => {
  try {
    activeMateriId = idMateri;
    const materi = window.currentMateriList.find(m => m.id_materi === idMateri);
    if (!materi) return alert("Materi tidak ditemukan");

    // 1. Isi Data Materi
    document.getElementById("detMateriJudul").innerText = materi.judul;
    document.getElementById("detMateriDeskripsi").innerText = materi.deskripsi || "Tidak ada deskripsi";
    
    const kontanBox = document.getElementById("detMateriKonten");
    kontanBox.innerHTML = materi.file_path 
      ? `<a href="${materi.file_path}" target="_blank" class="btn-view"><i class="fas fa-file-download"></i> Lihat File Materi</a>` 
      : (materi.link_url ? `<a href="${materi.link_url}" target="_blank" class="btn-view"><i class="fas fa-link"></i> Buka Link</a>` : "");

    // 2. Ambil & Render Tugas
    const tugasRes = await fetchWithAuth(`/tugas-media/tugas/materi/${idMateri}`);
    renderTugasInfo(tugasRes);

    document.getElementById("modalDetailTerpadu").style.display = "flex";
  } catch (err) {
    alert("Gagal memuat detail");
  }
};

function renderTugasInfo(tugasList) {
  const section = document.getElementById("sectionDetailTugas");
  const btnBuatWrapper = document.getElementById("btnBuatTugasWrapper");
  const statusWrapper = document.getElementById("statusSantriWrapper");
  const lampiranTugas = document.getElementById("detTugasLampiran");

  if (!tugasList || tugasList.length === 0) {
      section.style.display = "none";
      statusWrapper.style.display = "none";
      btnBuatWrapper.style.display = "block";
      
      // Buat tombol "Buat Tugas" jadi cantik & lebar
      btnBuatWrapper.innerHTML = `
          <button class="btn-status-full" onclick="openModalTugasBaru()" style="width:100%; background:#0ea5e9; color:white; padding:12px; border-radius:8px; border:none; font-weight:600; cursor:pointer; margin-top:15px;">
              <i class="fas fa-plus-circle"></i> Buat Tugas untuk Materi Ini
          </button>
      `;
      activeTugasId = null;
      return;
  }

  // Jika tugas ada
  const t = tugasList[0];
  activeTugasId = t.id_tugas;

  section.style.display = "block";
  btnBuatWrapper.style.display = "none";
  statusWrapper.style.display = "block";

  document.getElementById("detTugasJudul").innerText = t.deskripsi;
  document.getElementById("detTugasDeadline").innerText = new Date(t.deadline).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Render Lampiran Pengajar
  let htmlLampiran = "";
  if (t.file_path) {
      htmlLampiran += `<a href="${t.file_path}" target="_blank" class="btn-view" style="margin-right:10px;"><i class="fas fa-file-download"></i> File Tugas</a>`;
  }
  if (t.link_url) {
      htmlLampiran += `<a href="${t.link_url}" target="_blank" class="btn-view"><i class="fas fa-external-link-alt"></i> Link Tugas</a>`;
  }
  lampiranTugas.innerHTML = htmlLampiran || "<p class='text-muted' style='font-size:12px;'>Tidak ada lampiran dokumen</p>";

  // AKTIFKAN TOMBOL EDIT
  document.getElementById("btnEditTugas").onclick = () => openEditTugas(t);
  document.getElementById("btnEditMateri").onclick = () => openEditMateri();
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
      
      listBody.innerHTML = "";
      if (!data || data.length === 0) {
          listBody.innerHTML = "<tr><td colspan='4' align='center'>Belum ada santri di kelas ini.</td></tr>";
          return;
      }

      data.forEach(s => {
          const isSudah = s.status === 'Sudah Kirim';
          let aksiHTML = "-";

          if (isSudah) {
              const fileIcon = s.file_path ? `<a href="${s.file_path}" target="_blank" class="btn-view" title="Lihat File"><i class="fas fa-file-pdf"></i></a>` : '';
              const linkIcon = s.link_url ? `<a href="${s.link_url}" target="_blank" class="btn-view" title="Buka Link"><i class="fas fa-link"></i></a>` : '';
              aksiHTML = `${fileIcon} ${linkIcon}` || "<small>Tanpa Lampiran</small>";
          } else {
              aksiHTML = `<span style="color: #ef4444; font-size: 11px; font-style: italic;">Belum mengirim tugas</span>`;
          }

          listBody.innerHTML += `
              <tr>
                  <td><strong>${s.nama}</strong></td>
                  <td><span class="badge ${isSudah ? 'badge-success' : 'badge-danger'}">${s.status}</span></td>
                  <td>${s.submitted_at ? new Date(s.submitted_at).toLocaleString('id-ID') : '-'}</td>
                  <td align="center">${aksiHTML}</td>
              </tr>`;
      });

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
   SUBMIT HANDLERS
===================================================== */
window.handleKirimTugas = async () => {
  if (isSubmittingTugas) return;
  const desc = document.getElementById("modalTugasDesc").value;
  const deadline = document.getElementById("tugasDeadline").value;
  if (!desc || !deadline) return alert("Deskripsi & Deadline wajib diisi");

  isSubmittingTugas = true;
  const formData = new FormData();
  formData.append("id_kelas", selectedKelas);
  formData.append("id_materi", activeMateriId);
  formData.append("judul", desc.substring(0, 50));
  formData.append("deskripsi", desc);
  formData.append("deadline", deadline);

  const fileEl = document.getElementById("modalTugasFile");
  if (fileEl?.files[0]) formData.append("file", fileEl.files[0]);

  try {
    const res = await fetch(BASE_URL + "/tugas-media/tugas", {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      body: formData
    });
    if (!res.ok) throw await res.json();
    alert("Tugas berhasil dibuat!");
    closeModalTugas();
    lihatDetail(activeMateriId); // Refresh tampilan detail
  } catch (err) { alert(err.error || "Gagal simpan"); }
  finally { isSubmittingTugas = false; }
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
  isEditModeTugas = true;
  document.getElementById("modalTugas").style.display = "flex";
  document.querySelector("#modalTugas h3").innerHTML = '<i class="fas fa-edit"></i> Edit Tugas';
  
  document.getElementById("modalTugasDesc").value = tugas.deskripsi;
  document.getElementById("modalTugasLink").value = tugas.link_url || "";
  
  // Format tanggal untuk input date (YYYY-MM-DD)
  const date = new Date(tugas.deadline).toISOString().split('T')[0];
  document.getElementById("tugasDeadline").value = date;
};

/* ======================================================
    LOGIKA PROFIL (Header, Mini Profile & Pengaturan)
====================================================== */
window.openProfil = function() {
  const modal = document.getElementById("modalProfil");
  if (modal) {
      modal.style.display = "flex";
      // Panggil fungsi untuk memuat data profil ke dalam form
      if (typeof loadProfileData === "function") {
          loadProfileData();
      }
  } else {
      console.error("Elemen modalProfil tidak ditemukan di HTML");
  }
};

// Pastikan fungsi tutup juga ada
window.closeModalProfil = function() {
  const modal = document.getElementById("modalProfil");
  if (modal) modal.style.display = "none";
};


async function loadProfileData() {
  try {
      // Menggunakan fetchWithAuth agar konsisten dengan file ini
      const res = await fetchWithAuth("/me");
      
      // Sesuaikan dengan struktur respons API Anda (biasanya res.profile atau res langsung)
      const p = res.profile || res;

      // 1. Update Semua elemen nama di Header & Sidebar
      document.querySelectorAll(".user-name").forEach(el => {
          el.textContent = p.nama || "Pengajar";
      });

      // 2. Update Popup Mini Profile (Quick View)
      if (document.getElementById("mini-nama")) {
          document.getElementById("mini-nama").textContent = p.nama || "-";
          document.getElementById("mini-email").innerHTML = `<i class="fas fa-envelope"></i> ${p.email || "-"}`;
          document.getElementById("mini-phone").innerHTML = `<i class="fab fa-whatsapp"></i> ${p.no_kontak || "-"}`;
          document.getElementById("mini-avatar-initials").textContent = (p.nama || "P").charAt(0).toUpperCase();
      }

      // 3. Update Input Form di Modal Pengaturan (Agar siap diedit)
      if (document.getElementById("input-nama")) {
          document.getElementById("input-nama").value = p.nama || "";
          document.getElementById("input-email").value = p.email || "";
          document.getElementById("input-wa").value = p.no_kontak || "";
          // Jika ada field tanggal terdaftar di HTML:
          const tglEl = document.getElementById("input-terdaftar");
          if (tglEl) tglEl.value = p.tanggal_terdaftar || "-";
      }
      
      // Update inisial di avatar bulat header
      const initialEl = document.getElementById("profile-initials");
      if (initialEl) initialEl.textContent = (p.nama || "P").charAt(0).toUpperCase();

  } catch (err) { 
      console.error("Gagal memuat profil:", err); 
  }
}

// Fungsi untuk membuka Modal Pengaturan
window.openModalProfil = function() {
  // Sembunyikan mini profile jika sedang terbuka
  const card = document.getElementById("miniProfilCard");
  if (card) card.style.display = "none";
  
  // Tampilkan modal pengaturan
  document.getElementById("modalProfil").style.display = "flex";
  
  // Pastikan data terbaru masuk ke input form
  loadProfileData(); 
};

window.closeModalProfil = function() {
  document.getElementById("modalProfil").style.display = "none";
};

// Jalankan loadProfileData saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  loadProfileData();
});

window.handleSimpanProfil = async () => {
  const nama = document.getElementById("input-nama").value;
  const no_kontak = document.getElementById("input-wa").value;

  try {
      await fetchWithAuth("/update-profil-pengajar", { // Sesuaikan endpoint backend
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama, no_kontak })
      });

      alert("Profil berhasil diperbarui!");
      closeModalProfil();
      loadProfileData(); // Refresh tampilan nama di seluruh halaman
  } catch (err) {
      alert("Gagal menyimpan: " + (err.error || "Terjadi kesalahan"));
  }
};