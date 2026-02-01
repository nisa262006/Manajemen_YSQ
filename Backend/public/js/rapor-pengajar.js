const API = "/api";
const token = localStorage.getItem("token");

/* ================= ELEMENT ================= */
const selectKelas = document.getElementById("selectKelas");
const selectSantri = document.getElementById("selectSantri");

let selectedSantri = null;

/* ================= LOAD AWAL ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadKelasPengajar();
  setTanggal();
  generatePeriode(); // Fungsi periode otomatis yang sudah disesuaikan
});

function setTanggal() {
  const el = document.getElementById("tanggal-otomatis");
  if (el) {
    el.textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
}

// UPDATE: Generate periode dengan fitur Auto-Select berdasarkan bulan
function generatePeriode() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Logika penentuan periode default (Juli-Desember = Ganjil)
  let defaultPeriode = "";
  if (currentMonth >= 7) {
    defaultPeriode = `Ganjil ${currentYear}/${currentYear + 1}`;
  } else {
    defaultPeriode = `Genap ${currentYear - 1}/${currentYear}`;
  }

  const periodeOptions = [
    { val: `Ganjil ${currentYear}/${currentYear + 1}`, label: `Ganjil ${currentYear}/${currentYear + 1}` },
    { val: `Genap ${currentYear}/${currentYear + 1}`, label: `Genap ${currentYear}/${currentYear + 1}` },
    { val: `Ganjil ${currentYear - 1}/${currentYear}`, label: `Ganjil ${currentYear - 1}/${currentYear}` },
    { val: `Genap ${currentYear - 1}/${currentYear}`, label: `Genap ${currentYear - 1}/${currentYear}` },
    { val: `${currentYear}`, label: `Tahun Tahunan ${currentYear}` }
  ];

  let htmlOptions = `<option value="">-- Pilih Periode --</option>`;
  periodeOptions.forEach(opt => {
    const isSelected = opt.val === defaultPeriode ? "selected" : "";
    htmlOptions += `<option value="${opt.val}" ${isSelected}>${opt.label}</option>`;
  });
  
  const pTahsin = document.getElementById("periode_tahsin");
  const pTahfidz = document.getElementById("periode_tahfidz");
  
  if (pTahsin) pTahsin.innerHTML = htmlOptions;
  if (pTahfidz) pTahfidz.innerHTML = htmlOptions;
}

/* ================= 2. FUNGSI LOGIKA PREDIKAT & WARNA ================= */
function getPredikatDetail(nilai) {
  const n = parseFloat(nilai);
  if (n >= 90) return { teks: "Mumtaz", ket: "Istimewa", warna: "#EAB308", bg: "#fefce8" };
  if (n >= 80) return { teks: "Jayyid Jiddan", ket: "Sangat Baik", warna: "#22c55e", bg: "#f0fdf4" };
  if (n >= 70) return { teks: "Jayyid", ket: "Baik", warna: "#eab308", bg: "#fffbeb" };
  if (n >= 60) return { teks: "Maqbul", ket: "Cukup", warna: "#f97316", bg: "#fff7ed" };
  return { teks: "Dhaif", ket: "Kurang", warna: "#ef4444", bg: "#fef2f2" };
}

/* ================= LOAD KELAS & SANTRI ================= */
async function loadKelasPengajar() {
  const res = await fetch(`${API}/kelas/pengajar/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  selectKelas.innerHTML = `<option value="">--- Pilih Kelas ---</option>`;
  data.forEach(k => {
    selectKelas.innerHTML += `<option value="${k.id_kelas}">${k.nama_kelas}</option>`;
  });
}

selectKelas.addEventListener("change", async () => {
  const idKelas = selectKelas.value;
  if (!idKelas) return;

  const res = await fetch(`${API}/kelas/pengajar/detail/${idKelas}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  selectSantri.innerHTML = `<option value="">--- Pilih Santri ---</option>`;
  data.santri.forEach(s => {
    selectSantri.innerHTML += `<option value="${s.id_santri}">${s.nama}</option>`;
  });
});

selectSantri.addEventListener("change", () => {
  selectedSantri = selectSantri.value;
});

/* ================= TAB ================= */
window.showTab = function (tab) {
  document.getElementById("section-tahsin")
    .classList.toggle("ysq-is-hidden", tab !== "tahsin");
  document.getElementById("section-rapor-tahfidz")
    .classList.toggle("ysq-is-hidden", tab === "tahsin");

  const btns = document.querySelectorAll(".ysq-tab-btn");
  btns[0].classList.toggle("active", tab === "tahsin");
  btns[1].classList.toggle("active", tab !== "tahsin");
};

/* ================= UPDATE FUNGSI HITUNG TAHSIN ================= */
window.hitungRataTahsin = function () {
  const vals = document.querySelectorAll(".val-tahsin");
  let total = 0, count = 0;

  vals.forEach(v => {
    if (v.value !== "") {
      total += Number(v.value);
      count++;
    }
  });

  const rata = count ? (total / count).toFixed(2) : "0.00";
  const elTotal = document.getElementById("total_rata_tahsin");
  
  const detail = getPredikatDetail(rata);
  const container = elTotal.closest('.ysq-row-final-score');
  
  elTotal.innerHTML = `${rata} <span style="font-size: 14px; margin-left: 10px; color: white;">(${detail.teks} - ${detail.ket})</span>`;
  container.style.backgroundColor = detail.warna; 
};

/* ================= TAHFIDZ : TAMBAH JUZ ================= */
window.tambahKeDaftar = function () {
  const inputJuz = document.getElementById("quick_juz");
  const inputNilai = document.getElementById("quick_nilai");
  const listBody = document.getElementById("tahfidz-list-body");

  const juz = inputJuz.value;
  const nilai = inputNilai.value;

  if (!juz || !nilai) {
    alert("Juz dan nilai wajib diisi");
    return;
  }

  const existing = [...listBody.querySelectorAll("tr")]
    .some(tr => tr.dataset?.juz === juz);

  if (existing) {
    alert(`Juz ${juz} sudah dimasukkan`);
    return;
  }

  const empty = document.getElementById("empty-row");
  if (empty) empty.remove();

  const tr = document.createElement("tr");
  tr.dataset.juz = juz;

  tr.innerHTML = `
    <td>Juz ${juz}</td>
    <td>${nilai}</td>
    <td style="text-align:center">
      <button type="button" onclick="hapusBarisDaftar(this)">
        <i class="fas fa-trash-alt"></i>
      </button>
      <input type="hidden" class="nilai-simakan-hidden" value="${nilai}">
    </td>
  `;

  listBody.appendChild(tr);
  inputJuz.value = "";
  inputNilai.value = "";
  inputJuz.focus();
  hitungRataTahfidz();
};

/* ================= HAPUS BARIS ================= */
window.hapusBarisDaftar = function (btn) {
  btn.closest("tr").remove();

  const listBody = document.getElementById("tahfidz-list-body");
  if (listBody.children.length === 0) {
    listBody.innerHTML = `
      <tr id="empty-row">
        <td colspan="3" style="text-align:center;color:#94a3b8;padding:20px;">
          Belum ada data juz yang ditambahkan.
        </td>
      </tr>`;
  }
  hitungRataTahfidz();
};

/* ================= UPDATE FUNGSI HITUNG TAHFIDZ ================= */
window.hitungRataTahfidz = function () {
  const nilaiEls = document.querySelectorAll(".nilai-simakan-hidden");
  const elRata = document.getElementById("rata_simakan");
  const elAkhir = document.getElementById("total_rata_tahfidz");
  const uas = Number(document.getElementById("n_uas_tahfidz").value || 0);

  let total = 0;
  nilaiEls.forEach(n => total += Number(n.value));

  const rataSimakan = nilaiEls.length ? total / nilaiEls.length : 0;
  elRata.textContent = rataSimakan.toFixed(2);

  const nilaiAkhir = nilaiEls.length && uas ? (rataSimakan + uas) / 2 : rataSimakan;
  const nilaiFixed = nilaiAkhir.toFixed(2);
  
  const detail = getPredikatDetail(nilaiFixed);
  const container = elAkhir.closest('.ysq-row-final-score');
  
  elAkhir.innerHTML = `${nilaiFixed} <span style="font-size: 14px; margin-left: 10px; color: white;">(${detail.teks} - ${detail.ket})</span>`;
  container.style.backgroundColor = detail.warna;
};

/* ================= SAVE TAHSIN ================= */
async function saveTahsin() {
  // UPDATE: Ambil periode dari dropdown yang dipilih pengajar
  const periode = document.getElementById("periode_tahsin").value;
  if (!periode) throw "Periode belum dipilih";

  const body = {
    id_santri: Number(selectedSantri),
    periode: periode,
    nilai_pekanan: Number(document.getElementById("n_pekanan").value),
    ujian_tilawah: Number(document.getElementById("n_tilawah").value),
    nilai_teori: Number(document.getElementById("n_teori").value),
    nilai_presensi: Number(document.getElementById("n_absen").value),
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

/* ================= SAVE TAHFIDZ ================= */
window.saveTahfidz = async function () {
  // UPDATE: Ambil periode dari dropdown yang dipilih pengajar
  const periode = document.getElementById("periode_tahfidz").value;
  if (!periode) throw "Periode belum dipilih";

  const headerRes = await fetch(`${API}/rapor/tahfidz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id_santri: Number(selectedSantri), periode })
  });

  const header = await headerRes.json();
  if (!headerRes.ok) throw header.message;

  const idRapor = header.id_rapor;

  const rows = document.querySelectorAll("#tahfidz-list-body tr[data-juz]");
  for (const row of rows) {
    const juz = row.dataset.juz;
    const nilai = row.querySelector(".nilai-simakan-hidden").value;

    await fetch(`${API}/rapor/tahfidz/simakan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id_rapor: idRapor, juz: Number(juz), nilai: Number(nilai) })
    });
  }

  const finalRes = await fetch(`${API}/rapor/tahfidz/final`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id_rapor: idRapor,
      nilai_ujian_akhir: Number(document.getElementById("n_uas_tahfidz").value)
    })
  });
  
  if (!finalRes.ok) {
    const err = await finalRes.json();
    throw err.message;
  }
};

/* ================= SAVE DATA ================= */
window.saveData = async function (jenis) {
  if (!selectedSantri) {
    alert("Pilih santri terlebih dahulu");
    return;
  }

  try {
    if (jenis === "Tahsin") await saveTahsin();
    else await saveTahfidz();

    alert("Rapor berhasil disimpan");
    location.reload();
  } catch (err) {
    alert(err || "Terjadi kesalahan");
  }
};

window.resetFormTahsin = () => location.reload();
window.resetFormTahfidz = () => location.reload();