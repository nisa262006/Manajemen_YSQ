import { apiGet } from "../js/apiService.js";

document.addEventListener("DOMContentLoaded", initDashboardSantri);

async function initDashboardSantri() {
  try {
    const data = await apiGet("/kelas/santri/me");

    if (!data || !data.santri) {
      alert(data?.message ?? "Data santri tidak tersedia");
      return;
    }

    renderInfoSantri(data.santri);
    renderJadwalSantri(data.santri, data.jadwal ?? []);

  } catch (error) {
    console.error("DASHBOARD SANTRI ERROR:", error);
    alert("Gagal memuat dashboard santri");
  }
}

/* ==========================
   RENDER INFO SANTRI
========================== */
function renderInfoSantri(santri = {}) {
  setText("namaSantri", santri.nama);
  setText("nisSantri", santri.nis);
  setText("kategori-santri", santri.kategori);
  setText("kelas-santri", santri.nama_kelas);
}

/* ==========================
   RENDER JADWAL SANTRI
========================== */
function renderJadwalSantri(santri = {}, jadwal = []) {
  const tbody = document.getElementById("jadwal-body");
  tbody.innerHTML = "";

  if (!Array.isArray(jadwal) || jadwal.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">Belum ada jadwal</td>
      </tr>
    `;
    setText("jadwal-santri", "-");
    return;
  }

  setText(
    "jadwal-santri",
    [...new Set(jadwal.map(j => j.hari))].join(", ")
  );

  jadwal.forEach((item, index) => {
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${index + 1}</td>
        <td>${santri.nama_kelas ?? "-"}</td>
        <td>${item.hari ?? "-"}</td>
        <td>${item.jam_mulai ?? "-"} - ${item.jam_selesai ?? "-"}</td>
        <td>${item.pengajar ?? "-"}</td>
        <td>-</td>
      </tr>
    `);
  });
}

/* ==========================
   HELPER
========================== */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}
