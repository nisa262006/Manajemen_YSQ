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
document.addEventListener("DOMContentLoaded", async () => {
  if (!$("ysq-pengeluaran-body")) return;

  initDefaultDate();
  await loadPengeluaran();

  $("ysq-out-date-start")?.addEventListener("change", applyFilter);
  $("ysq-out-date-end")?.addEventListener("change", applyFilter);
  $("ysq-out-filter-cat")?.addEventListener("change", applyFilter);
  $("ysq-search")?.addEventListener("input", applyFilter);
});

/* ================================
   DEFAULT DATE (1 TAHUN)
================================ */
function initDefaultDate() {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);

  $("ysq-out-date-start").value = start.toISOString().slice(0, 10);
  $("ysq-out-date-end").value = end.toISOString().slice(0, 10);
}

/* ================================
   LOAD DATA
================================ */
async function loadPengeluaran() {
  try {
    const res = await apiGet("/keuangan/pengeluaran");
    pengeluaranData = res.data || res || [];
    applyFilter();
  } catch (err) {
    console.error("Gagal load pengeluaran:", err);
  }
}

/* ================================
   FILTER
================================ */
function applyFilter() {

  const start = $("ysq-out-date-start").value;
  const end = $("ysq-out-date-end").value;
  const kategori = $("ysq-out-filter-cat").value;
  const keyword = $("ysq-search")?.value.toLowerCase() || "";

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  filteredPengeluaran = pengeluaranData.filter(d => {

    const tgl = new Date(d.tanggal);

    if (startDate && tgl < startDate) return false;

    if (endDate) {
      const endPlus = new Date(endDate);
      endPlus.setDate(endPlus.getDate() + 1);
      if (tgl >= endPlus) return false;
    }

    if (kategori !== "all" && d.kategori !== kategori) return false;

    // 🔎 SEARCH FILTER
    const searchable =
      (d.kategori || "").toLowerCase() +
      (d.keterangan || "").toLowerCase();

    if (keyword && !searchable.includes(keyword)) return false;

    return true;
  });

  renderTable();
  renderSummary();
}

/* ================================
   RENDER TABLE
================================ */
function renderTable() {
  const tbody = $("ysq-pengeluaran-body");
  tbody.innerHTML = "";

  if (!filteredPengeluaran.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" align="center">
          Tidak ada data pengeluaran
        </td>
      </tr>`;
    return;
  }

  filteredPengeluaran
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    .forEach(d => {
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
   SUMMARY
================================ */
function renderSummary() {
  const total = filteredPengeluaran.reduce(
    (acc, curr) => acc + Number(curr.nominal || 0),
    0
  );

  $("ysq-total-pengeluaran").textContent = rupiah(total);
}

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

  if (!payload.kategori || !payload.tanggal || payload.nominal <= 0) {
    return alert("Data pengeluaran tidak valid");
  }

  try {
    await apiPost("/keuangan/pengeluaran", payload);

    alert("Pengeluaran berhasil disimpan");
    closeModalPengeluaran();

    $("out-jenis").value = "";
    $("out-nominal").value = "";
    $("out-ket").value = "";

    await loadPengeluaran();
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

/* ================================
   EXPORT EXCEL
================================ */
function exportPengeluaranExcel() {

  const start = $("ysq-out-date-start").value;
  const end = $("ysq-out-date-end").value;

  const rows = [];

  // ======================
  // HITUNG RINGKASAN
  // ======================
  const summary = {};
  let totalAll = 0;

  filteredPengeluaran.forEach(d => {
    const nominal =
      parseInt(String(d.nominal).replace(/\D/g, "")) || 0;

    if (!summary[d.kategori]) summary[d.kategori] = 0;
    summary[d.kategori] += nominal;
    totalAll += nominal;
  });

  // ======================
  // HEADER
  // ======================
  rows.push(["LAPORAN PENGELUARAN KEUANGAN"]);
  rows.push([`Periode: ${start} s/d ${end}`]);
  rows.push([]);

  // ======================
  // RINGKASAN DI ATAS (SEPERTI GAMBAR 2)
  // ======================
  Object.keys(summary).forEach(kat => {
    rows.push([`Total ${kat}`, summary[kat]]);
  });

  rows.push(["Total Keseluruhan", totalAll]);
  rows.push([]); // jarak sebelum tabel

  const headerRowIndex = rows.length + 1;

  // ======================
  // HEADER TABEL
  // ======================
  rows.push(["Tanggal", "Kategori", "Keterangan", "Nominal"]);

  filteredPengeluaran.forEach(d => {
    rows.push([
      new Date(d.tanggal).toLocaleDateString("id-ID"),
      d.kategori,
      d.keterangan || "-",
      parseInt(String(d.nominal).replace(/\D/g, "")) || 0
    ]);
  });

  const dataEndRow = rows.length;

  // ======================
  // BUAT SHEET
  // ======================
  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!autofilter"] = {
    ref: `A${headerRowIndex}:D${dataEndRow}`
  };

  ws["!cols"] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 40 },
    { wch: 18 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");

  XLSX.writeFile(wb, `laporan-pengeluaran-${todayISO()}.xlsx`);
}

/* ================================
   EXPORT PDF (GROUPING)
================================ */
function exportPengeluaranPDF() {

  if (!window.jspdf) {
    alert("Library PDF belum dimuat!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const start = $("ysq-out-date-start").value;
  const end = $("ysq-out-date-end").value;

  doc.setFontSize(14);
  doc.text("LAPORAN PENGELUARAN KEUANGAN", 14, 15);

  doc.setFontSize(10);
  doc.text(`Periode: ${start} s/d ${end}`, 14, 22);

  let yPos = 30;

  const grouped = {};
  let totalAll = 0;

  filteredPengeluaran.forEach(d => {
    if (!grouped[d.kategori]) grouped[d.kategori] = [];
    grouped[d.kategori].push(d);
    totalAll += Number(d.nominal);
  });

  Object.keys(grouped).forEach(kategori => {

    doc.setFontSize(12);
    doc.text(`Kategori: ${kategori}`, 14, yPos);
    yPos += 5;

    const rows = [];
    let subtotal = 0;

    grouped[kategori].forEach(d => {
      rows.push([
        new Date(d.tanggal).toLocaleDateString("id-ID"),
        d.keterangan || "-",
        rupiah(d.nominal)
      ]);
      subtotal += Number(d.nominal);
    });

    doc.autoTable({
      startY: yPos,
      head: [["Tanggal", "Keterangan", "Nominal"]],
      body: rows,
      styles: { fontSize: 9 }
    });

    yPos = doc.lastAutoTable.finalY + 5;

    doc.setFontSize(10);
    doc.text(`Subtotal: ${rupiah(subtotal)}`, 14, yPos);
    yPos += 10;
  });

  doc.setFontSize(12);
  doc.text("------------------------------------", 14, yPos);
  yPos += 6;

  doc.text(`TOTAL KESELURUHAN: ${rupiah(totalAll)}`, 14, yPos);

  doc.save(`laporan-pengeluaran-${todayISO()}.pdf`);
}

/* ================================
   EXPORT HANDLER
================================ */
window.exportData = function (type) {

  if (!filteredPengeluaran.length) {
    alert("Tidak ada data untuk diexport");
    return;
  }

  if (type === "excel") exportPengeluaranExcel();
  if (type === "pdf") exportPengeluaranPDF();
};