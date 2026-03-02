const API = "/api";
const token = localStorage.getItem("token");

/* ================= STATE ================= */
let selectedSantri = null;
let selectedJadwal = null;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  setTanggal();
  generatePeriode();
  loadJadwalPengajar();
  initEvents();
  initSidebar();
  initLogout();
});

/* ================= TANGGAL ================= */
function setTanggal() {
  const el = document.getElementById("tanggal-otomatis");
  if (!el) return;

  el.textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/* ================= PERIODE ================= */
function generatePeriode() {
  const now = new Date();
  const y = now.getFullYear();

  const periodeList = [
    `Ganjil ${y - 1}/${y}`,
    `Genap ${y - 1}/${y}`,
    `Ganjil ${y}/${y + 1}`,
    `Genap ${y}/${y + 1}`
  ];

  const html = `<option value="">-- Pilih Periode --</option>` +
    periodeList.map(p => `<option value="${p}">${p}</option>`).join("");

  const pTahsin = document.getElementById("periode_tahsin");
  const pTahfidz = document.getElementById("periode_tahfidz");

  if (pTahsin) pTahsin.innerHTML = html;
  if (pTahfidz) pTahfidz.innerHTML = html;
}

/* ================= LOAD JADWAL (DIPERBAIKI) ================= */
async function loadJadwalPengajar() {
  const selectKelas = document.getElementById("selectKelas");
  if (!selectKelas) return;

  const res = await fetch(`${API}/jadwal/pengajar/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  selectKelas.innerHTML = `<option value="">--- Pilih Kelas ---</option>`;

  data.forEach(j => {
    // Tambahkan atribut data-kategori untuk pengecekan nantinya
    selectKelas.innerHTML += `
      <option value="${j.id_jadwal}" data-kategori="${j.kategori}">
        ${j.nama_kelas} - ${j.hari} (${j.jam_mulai} - ${j.jam_selesai})
      </option>
    `;
  });
}

/* ================= EVENTS ================= */
function initEvents() {
  const selectKelas = document.getElementById("selectKelas");
  const selectSantri = document.getElementById("selectSantri");

  if (selectKelas) {
    selectKelas.addEventListener("change", async () => {
      selectedJadwal = selectKelas.value;
      const selectedOption = selectKelas.options[selectKelas.selectedIndex];
      const kategori = selectedOption.getAttribute("data-kategori") || "";
  
      // Jika sedang di tab tahfidz tapi ganti ke kelas non-tahfidz, paksa pindah ke tahsin
      const isTahfidzTabVisible = !document.getElementById("section-rapor-tahfidz").classList.contains("ysq-is-hidden");
      if (isTahfidzTabVisible && !kategori.toLowerCase().includes("tahfidz")) {
        showTab("tahsin");
      }

      const res = await fetch(`${API}/rapor/jadwal/${selectedJadwal}/santri`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      selectSantri.innerHTML = `<option value="">--- Pilih Santri ---</option>`;

      data.forEach(s => {
        selectSantri.innerHTML += `
          <option value="${s.id_santri}">${s.nama}</option>
        `;
      });
    });
  }

  if (selectSantri) {
    selectSantri.addEventListener("change", () => {
      selectedSantri = selectSantri.value;
    });
  }

  // Tahsin input manual predikat
  const totalTahsin = document.getElementById("total_rata_tahsin");
  if (totalTahsin) {
    totalTahsin.addEventListener("input", updatePredikatTahsinManual);
  }

  const uas = document.getElementById("n_uas_tahfidz");
  if (uas) {
    uas.addEventListener("input", hitungRataTahfidz);
  }
}

/* ================= TAB (DIPERBAIKI DENGAN VALIDASI) ================= */
window.showTab = function (tab) {
  const selectKelas = document.getElementById("selectKelas");
  const selectedOption = selectKelas.options[selectKelas.selectedIndex];
  
  // Ambil kategori dari atribut data-kategori
  const kategori = selectedOption ? selectedOption.getAttribute("data-kategori") : "";

  // Jika mencoba buka Tahfidz tapi kelas bukan kategori Tahfidz
  if (tab === "tahfidz") {
    if (!selectedJadwal) {
      alert("Silakan pilih kelas terlebih dahulu.");
      return;
    }
    
    // Validasi kategori kelas (asumsi string dari DB adalah 'Tahfidz')
    if (!kategori || !kategori.toLowerCase().includes("tahfidz")) {
      alert("Tab Rapor Tahfidz hanya tersedia untuk kategori kelas Tahfidz.");
      return; // Batalkan perpindahan tab
    }
  }

  // Logika perpindahan tab jika validasi lolos
  document.getElementById("section-tahsin")
    .classList.toggle("ysq-is-hidden", tab !== "tahsin");
  document.getElementById("section-rapor-tahfidz")
    .classList.toggle("ysq-is-hidden", tab === "tahsin");

  const btns = document.querySelectorAll(".ysq-tab-btn");
  btns[0].classList.toggle("active", tab === "tahsin");
  btns[1].classList.toggle("active", tab !== "tahsin");
};

/* ================= PREDIKAT TAHSIN ================= */
function updatePredikatTahsinManual() {
  const nilai = Number(document.getElementById("total_rata_tahsin").value) || 0;
  const el = document.getElementById("status_predikat_tahsin");
  if (!el) return;

  let text = "";
  if (nilai >= 90) text = "Mumtaz (Istimewa)";
  else if (nilai >= 80) text = "Jayyid Jiddan (Sangat Baik)";
  else if (nilai >= 70) text = "Jayyid (Baik)";
  else if (nilai >= 60) text = "Maqbul (Cukup)";
  else if (nilai > 0) text = "Dhaif (Kurang)";

  el.innerText = text;
}

/* ================= TAHFIDZ ================= */
window.tambahKeDaftar = function () {
  const juz = document.getElementById("quick_juz").value;
  const nilai = document.getElementById("quick_nilai").value;
  const list = document.getElementById("tahfidz-list-body");

  if (!juz || !nilai) return alert("Juz dan nilai wajib diisi");

  const tr = document.createElement("tr");
  tr.dataset.juz = juz;
  tr.innerHTML = `
    <td>Juz ${juz}</td>
    <td>${nilai}</td>
    <td align="center">
      <button onclick="hapusBarisDaftar(this)">
        <i class="fas fa-trash"></i>
      </button>
      <input type="hidden" class="nilai-simakan-hidden" value="${nilai}">
    </td>
  `;

  const empty = document.getElementById("empty-row");
  if (empty) empty.remove();

  list.appendChild(tr);

  document.getElementById("quick_juz").value = "";
  document.getElementById("quick_nilai").value = "";

  hitungRataTahfidz();
};

window.hapusBarisDaftar = function (btn) {
  btn.closest("tr").remove();
  hitungRataTahfidz();
};

function hitungRataTahfidz() {
  const nilaiEls = document.querySelectorAll(".nilai-simakan-hidden");
  const elRataSimakan = document.getElementById("rata_simakan");
  const elTotalAkhir = document.getElementById("total_rata_tahfidz");
  const elPredikat = document.getElementById("predikat_tahfidz");
  const bar = document.querySelector("#section-rapor-tahfidz .ysq-row-final-score");

  const uas = Number(document.getElementById("n_uas_tahfidz").value || 0);

  let total = 0;
  nilaiEls.forEach(n => total += Number(n.value));

  const rataSimakan = nilaiEls.length ? total / nilaiEls.length : 0;

  // ✅ Update rata-rata simakan
  if (elRataSimakan) {
    elRataSimakan.textContent = rataSimakan.toFixed(2);
  }

  // ✅ Hitung rata-rata akhir
  let rataAkhir = 0;
  if (nilaiEls.length && uas) {
    rataAkhir = (rataSimakan + uas) / 2;
  } else {
    rataAkhir = rataSimakan;
  }

  const nilaiFix = rataAkhir.toFixed(2);

  if (elTotalAkhir) {
    elTotalAkhir.textContent = nilaiFix;
  }

  // =======================
  // 🔥 HITUNG PREDIKAT
  // =======================

  let predikat = "";
  let warna = "#1976d2"; // default biru

  if (rataAkhir >= 90) {
    predikat = "Mumtaz (Istimewa)";
    warna = "#16a34a";
  } else if (rataAkhir >= 80) {
    predikat = "Jayyid Jiddan (Sangat Baik)";
    warna = "#22c55e";
  } else if (rataAkhir >= 70) {
    predikat = "Jayyid (Baik)";
    warna = "#eab308";
  } else if (rataAkhir >= 60) {
    predikat = "Maqbul (Cukup)";
    warna = "#f97316";
  } else if (rataAkhir > 0) {
    predikat = "Dhaif (Kurang)";
    warna = "#ef4444";
  }

  if (elPredikat) {
    elPredikat.textContent = predikat;
    elPredikat.style.fontWeight = "600";
  }

  // ✅ Ubah warna background bar
  if (bar) {
    bar.style.backgroundColor = warna;
    bar.style.transition = "0.3s ease";
  }
}
/* ================= SAVE ================= */
async function saveTahsin() {
  const periode = document.getElementById("periode_tahsin").value;
  if (!periode) throw "Periode belum dipilih";

  const body = {
    id_santri: Number(selectedSantri),
    id_jadwal: Number(selectedJadwal),
    periode,
    nilai_pekanan: Number(document.getElementById("n_pekanan").value),
    ujian_tilawah: Number(document.getElementById("n_tilawah").value),
    nilai_teori: Number(document.getElementById("n_teori").value),
    nilai_presensi: Number(document.getElementById("n_absen").value),
    nilai_akhir: Number(document.getElementById("total_rata_tahsin").value) || 0,
    catatan: document.getElementById("catatan_progres").value
  };

  const res = await fetch(`${API}/rapor/tahsin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const result = await res.json();
  if (!res.ok) throw result.message;
}

window.saveTahfidz = async function () {
  const periode = document.getElementById("periode_tahfidz").value;
  if (!periode) throw "Periode belum dipilih";

  // 1️⃣ BUAT HEADER
  const headerRes = await fetch(`${API}/rapor/tahfidz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id_santri: Number(selectedSantri),
      id_jadwal: Number(selectedJadwal),
      periode
    })
  });

  const header = await headerRes.json();
  if (!headerRes.ok) throw header.message;

  const idRapor = header.id_rapor;

  // 2️⃣ KIRIM SIMAKAN PER JUZ
  const rows = document.querySelectorAll("#tahfidz-list-body tr[data-juz]");

  if (!rows.length) throw "Belum ada nilai simakan yang diinput";

  for (const row of rows) {
    const juz = row.dataset.juz;
    const nilai = row.querySelector(".nilai-simakan-hidden").value;

    const simakanRes = await fetch(`${API}/rapor/tahfidz/simakan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id_rapor: idRapor,
        juz: Number(juz),
        nilai: Number(nilai)
      })
    });

    if (!simakanRes.ok) {
      const err = await simakanRes.json();
      throw err.message || "Gagal simpan simakan";
    }
  }

  // 3️⃣ FINALISASI
  const uas = Number(document.getElementById("n_uas_tahfidz").value);
  if (!uas) throw "Nilai ujian akhir belum diisi";

  const finalRes = await fetch(`${API}/rapor/tahfidz/final`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id_rapor: idRapor,
      nilai_ujian_akhir: uas
    })
  });

  if (!finalRes.ok) {
    const err = await finalRes.json();
    throw err.message || "Gagal finalisasi rapor";
  }

  return true;
};

window.saveData = async function (jenis) {
  if (!selectedSantri) return alert("Silakan pilih santri terlebih dahulu.");
  if (!selectedJadwal) return alert("Silakan pilih kelas terlebih dahulu.");

  try {
    if (jenis === "Tahsin") {
      await saveTahsin();
      alert("Rapor Tahsin berhasil disimpan.");
    } else {
      await saveTahfidz();
      alert("Rapor Tahfidz berhasil disimpan.");
    }

    location.reload();

  } catch (err) {
    alert(err || "Terjadi kesalahan saat menyimpan data.");
  }
};

/* ================= SIDEBAR ================= */
function initSidebar() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }
}

/* ================= LOGOUT ================= */
function initLogout() {
  const logoutBtn = document.querySelector(".sidebar-footer li");
  if (!logoutBtn) return;

  logoutBtn.style.cursor = "pointer";
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  });
}