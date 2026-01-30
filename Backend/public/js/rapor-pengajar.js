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

/* ================= HITUNG TAHSIN ================= */
window.hitungRataTahsin = function () {
  const vals = document.querySelectorAll(".val-tahsin");
  let total = 0, count = 0;

  vals.forEach(v => {
    if (v.value !== "") {
      total += Number(v.value);
      count++;
    }
  });

  document.getElementById("total_rata_tahsin").textContent =
    count ? (total / count).toFixed(2) : "0.00";
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

  // ❌ Cegah juz dobel
  const existing = [...listBody.querySelectorAll("tr")]
    .some(tr => tr.dataset?.juz === juz);

  if (existing) {
    alert(`Juz ${juz} sudah dimasukkan`);
    return;
  }

  // hapus row kosong
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

/* ================= HITUNG TAHFIDZ ================= */
window.hitungRataTahfidz = function () {
  const nilaiEls = document.querySelectorAll(".nilai-simakan-hidden");
  const elRata = document.getElementById("rata_simakan");
  const elAkhir = document.getElementById("total_rata_tahfidz");
  const uas = Number(document.getElementById("n_uas_tahfidz").value || 0);

  let total = 0;
  nilaiEls.forEach(n => total += Number(n.value));

  const rataSimakan = nilaiEls.length ? total / nilaiEls.length : 0;
  elRata.textContent = rataSimakan.toFixed(2);

  const nilaiAkhir =
    nilaiEls.length && uas
      ? (rataSimakan + uas) / 2
      : rataSimakan;

  elAkhir.textContent = nilaiAkhir.toFixed(2);
};

/* ================= SAVE TAHSIN ================= */
async function saveTahsin() {
  const body = {
    id_santri: Number(selectedSantri),
    periode: new Date().getFullYear().toString(),
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
  const periode = new Date().getFullYear().toString();

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

  await fetch(`${API}/rapor/tahfidz/final`, {
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
