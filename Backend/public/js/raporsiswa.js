const API = "/api";
const token = localStorage.getItem("token");

/* ================= ELEMENT ================= */
const namaEl = document.getElementById("nama-santri");
const nisEl = document.getElementById("nis-santri");
const kelasEl = document.getElementById("kelas-santri");
const pengajarEl = document.getElementById("pengajar-santri");

const tahfidzTabBtn = document.querySelectorAll(".ysq-tab-btn")[1];
const tahfidzSection = document.getElementById("section-rapor-tahfidz");

/* ================= LOAD AWAL ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadRaporSantri();
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

/* ================= LOAD RAPOR ================= */
async function loadRaporSantri() {
  try {
    const res = await fetch(`${API}/rapor/santri/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw data.message;

    /* ---------- IDENTITAS SANTRI ---------- */
    const s = data.santri;
    namaEl.textContent = s.nama;
    nisEl.textContent = s.nis;
    kelasEl.textContent = s.kelas;
    pengajarEl.textContent = s.pengajar;

    /* ---------- RAPOR TAHSIN ---------- */
    if (data.rapor_tahsin) {
      renderTahsin(data.rapor_tahsin);
    }

    /* ---------- RAPOR TAHFIDZ ---------- */
    if (data.rapor_tahfidz) {
      renderTahfidz(data.rapor_tahfidz);
      tahfidzTabBtn.style.display = "inline-flex";
    } else {
      tahfidzTabBtn.style.display = "none";
      tahfidzSection.classList.add("ysq-is-hidden");
    }

  } catch (err) {
    alert("Gagal memuat rapor santri");
    console.error(err);
  }
}

/* ================= RENDER TAHSIN ================= */
function renderTahsin(r) {
  const tbody = document.querySelector("#section-tahsin tbody");

  tbody.innerHTML = `
    <tr>
      <td>Nilai Pekanan</td>
      <td class="val-bold">${r.nilai_pekanan}</td>
    </tr>
    <tr>
      <td>Ujian Tilawah (Lisan)</td>
      <td class="val-bold">${r.ujian_tilawah}</td>
    </tr>
    <tr>
      <td>Nilai Teori (G-Form)</td>
      <td class="val-bold">${r.nilai_teori}</td>
    </tr>
    <tr>
      <td>Presensi Kehadiran</td>
      <td class="val-bold">${r.nilai_presensi}</td>
    </tr>
  `;

  document.querySelector(".val-total").textContent =
    Number(r.nilai_akhir).toFixed(2);

  document.querySelector(".ysq-text-note").textContent =
    r.catatan || "Tidak ada catatan dari pengajar.";
}

/* ================= RENDER TAHFIDZ ================= */
function renderTahfidz(r) {
  const body = document.getElementById("tahfidz-body");
  body.innerHTML = "";

  if (!r.simakan || r.simakan.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="2" style="text-align:center;color:#94a3b8;">
          Belum ada data simakan per juz.
        </td>
      </tr>`;
    return;
  }

  r.simakan.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-center">Juz ${s.juz}</td>
      <td class="col-center">${s.nilai}</td>
    `;
    body.appendChild(tr);
  });

  document.getElementById("rata-simakan").textContent =
    Number(r.nilai_rata_simakan).toFixed(2);

  document.getElementById("rata-akhir-tahfidz").textContent =
    Number(r.nilai_ujian_akhir).toFixed(2);

  document.getElementById("predikat-tahfidz").textContent =
    Number(r.nilai_akhir).toFixed(2);
}

/* ================= PDF (DUMMY) ================= */
window.downloadPDF = function (jenis) {
  alert(`Fitur unduh PDF ${jenis} akan diaktifkan`);
};
