import { apiGet, apiPost } from "./apiService.js";

/* ================================
   HELPER
================================ */
const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const cleanRupiah = (val) => parseInt(val.replace(/\D/g, "")) || 0;

/* ================================
   STATE
================================ */
let pengeluaranData = [];
let filteredPengeluaran = [];

/* ================================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", () => {
  if ($("ysq-pengeluaran-body")) {
    loadPengeluaran();
    sortDataPengeluaran();
  }
});

/* ================================
   LOAD DATA
================================ */
async function loadPengeluaran() {
  try {
    const res = await apiGet("/keuangan/pengeluaran");
    pengeluaranData = res.data || res;
    filteredPengeluaran = [...pengeluaranData];
    renderPengeluaranTable();
  } catch (err) {
    console.error("Gagal load pengeluaran:", err);
  }
}

window.sortDataPengeluaran = function () {
    const order = $("sort-pengeluaran").value;
  
    filteredPengeluaran.sort((a, b) => {
      const tglA = new Date(a.tanggal);
      const tglB = new Date(b.tanggal);
  
      return order === "asc"
        ? tglA - tglB
        : tglB - tglA;
    });
  
    renderPengeluaranTable();
  };
  

/* ================================
   RENDER TABLE
================================ */
function renderPengeluaranTable() {
  const tbody = $("ysq-pengeluaran-body");
  tbody.innerHTML = "";

  if (!filteredPengeluaran.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center">
          Belum ada data pengeluaran
        </td>
      </tr>`;
    return;
  }

  filteredPengeluaran.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${new Date(d.tanggal).toLocaleDateString("id-ID")}</td>
        <td>${d.kategori}</td>
        <td>${d.keterangan || "-"}</td>
        <td align="right">${rupiah(d.nominal)}</td>
      </tr>
    `;
  });
}

/* ================================
   SORT
================================ */
window.sortDataPengeluaran = function () {
  const order = $("sort-pengeluaran").value;

  filteredPengeluaran.sort((a, b) =>
    order === "asc"
      ? new Date(a.tanggal) - new Date(b.tanggal)
      : new Date(b.tanggal) - new Date(a.tanggal)
  );

  renderPengeluaranTable();
};

/* ================================
   FILTER KATEGORI
================================ */
window.filterByCategory = function () {
  const kategori = $("filter-kategori").value;

  filteredPengeluaran =
    kategori === "all"
      ? [...pengeluaranData]
      : pengeluaranData.filter(p => p.kategori === kategori);

  sortDataPengeluaran();
};

/* ================================
   SEARCH
================================ */
window.searchPengeluaran = function () {
  const keyword = $("search-out").value.toLowerCase();

  filteredPengeluaran = pengeluaranData.filter(p =>
    (p.kategori || "").toLowerCase().includes(keyword) ||
    (p.keterangan || "").toLowerCase().includes(keyword)
  );

  sortDataPengeluaran();
};

/* ================================
   MODAL
================================ */
window.openModalPengeluaran = function () {
  $("modalPengeluaran").style.display = "flex";
  $("out-tgl").value = todayISO();
};

window.closeModalPengeluaran = function () {
  $("modalPengeluaran").style.display = "none";
};

/* ================================
   SAVE
================================ */
window.savePengeluaran = async function () {
  const payload = {
    kategori: $("out-jenis").value,
    tanggal: $("out-tgl").value,
    nominal: cleanRupiah($("out-nominal").value),
    keterangan: $("out-ket").value
  };

  if (!payload.kategori || payload.nominal <= 0) {
    return alert("Data pengeluaran tidak valid");
  }

  try {
    await apiPost("/keuangan/pengeluaran", payload);

    alert("Pengeluaran berhasil disimpan");
    closeModalPengeluaran();

    $("out-jenis").value = "";
    $("out-nominal").value = "";
    $("out-ket").value = "";

    loadPengeluaran();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan pengeluaran");
  }
};

/* ================================
   FORMAT RUPIAH
================================ */
window.formatRupiah = function (input) {
  input.value = new Intl.NumberFormat("id-ID")
    .format(cleanRupiah(input.value));
};

function exportPengeluaranExcel() {
    // Header Excel
    const rows = [
      ["LAPORAN PENGELUARAN KEUANGAN"],
      [`Dicetak: ${new Date().toLocaleDateString("id-ID")}`],
      [],
      ["No", "Tanggal", "Jenis Pengeluaran", "Keterangan", "Nominal (Rp)"]
    ];
  
    // Isi data
    filteredPengeluaran.forEach((d, i) => {
      rows.push([
        i + 1,
        new Date(d.tanggal).toLocaleDateString("id-ID"),
        d.kategori,
        d.keterangan || "-",
        d.nominal
      ]);
    });
  
    // Buat worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);
  
    // Lebar kolom (biar rapi)
    ws["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 25 },
      { wch: 40 },
      { wch: 18 }
    ];
  
    // Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
  
    // Nama file
    const filename = `laporan-pengeluaran-${todayISO()}.xlsx`;
  
    XLSX.writeFile(wb, filename);
  }  
  
  
  window.exportData = function (type) {
    if (!filteredPengeluaran || !filteredPengeluaran.length) {
      alert("Tidak ada data pengeluaran untuk diexport");
      return;
    }
  
    if (type === "excel") {
      exportPengeluaranExcel();
    }
  };
  
  