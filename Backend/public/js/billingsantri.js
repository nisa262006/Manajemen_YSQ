import { apiGet, apiPost } from "./apiService.js";

const rupiah = (n) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);

let allBilling = [];
let activeBilling = null;

/* ============================
   INIT
============================ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadBillingSantri();
  initPeriodeFilter();

  document
    .getElementById("main-filter")
    .addEventListener("change", onKategoriChange);

  document
    .getElementById("status-filter")
    .addEventListener("change", () => {
      renderSPP();
      renderNonIuran();
    });

    document
    .getElementById("year-filter")
    ?.addEventListener("change", () => {
      renderSPP();
      renderNonIuran();
    });  

  document
    .getElementById("paymentForm")
    .addEventListener("submit", submitPayment);

  document.getElementById("close-modal").onclick = closePaymentModal;
  document
  .getElementById("inputAmount")
  ?.addEventListener("input", (e) => {
    formatRupiahInput(e.target);
  });

});

/* ============================
   LOAD BILLING SANTRI
============================ */
async function loadBillingSantri() {
  try {
    const res = await apiGet("/keuangan/billing/me");
    allBilling = res.data || res;

    renderSummary();
    renderSPP();
    renderNonIuran();
  } catch (err) {
    console.error("Gagal load billing:", err);
  }
}

/* ============================
   SUMMARY
============================ */
function renderSummary() {
  const total = allBilling
    .filter((b) => b.status !== "lunas")
    .reduce((acc, b) => acc + Number(b.sisa || 0), 0);

  document.getElementById("nominal-tagihan-aktif").textContent =
    rupiah(total);
}

/* ============================
   RENDER SPP
============================ */
function renderSPP() {
  const container = document.getElementById("spp-data-container");
  container.innerHTML = "";

  const yearVal =
  document.getElementById("year-filter")?.value || "all";
  const statusVal =
    document.getElementById("status-filter")?.value || "all";

  let spp = allBilling.filter((b) => b.jenis === "SPP");

  if (yearVal !== "all") {
    spp = spp.filter(b => b.periode?.startsWith(yearVal));
  }  

  if (statusVal !== "all") {
  spp = spp.filter(b => {
    if (statusVal === "success") return b.status === "lunas";
    if (statusVal === "warning") return b.status === "nyicil";
    if (statusVal === "danger") return b.status === "belum bayar";
  });
  }

  if (!spp.length) {
    container.innerHTML =
      `<div class="grid-row"><div class="grid-cell">Tidak ada tagihan SPP</div></div>`;
    return;
  }

  spp.forEach((b) => {
    let statusText = "";
    let statusClass = "";
  
    // 1. Tentukan teks dan warna pill berdasarkan logika
if (b.status === "lunas") {
  statusText = "LUNAS";
  statusClass = "success";

} else if (b.status === "nyicil") {
  statusText = "MENICIL";
  statusClass = "warning";

} else if (b.status === "menunggu") {
  statusText = "MENUNGGU VERIFIKASI";
  statusClass = "warning";

} else {
  statusText = "BELUM BAYAR";
  statusClass = "danger";
}

  
    // 2. Tombol bayar hanya muncul jika statusnya bukan lunas DAN tidak sedang menunggu
    const actionBtn =
  ["lunas", "menunggu"].includes(b.status)
    ? "-"
    : `<button class="ysq-btn-upload"
        onclick="openPaymentModal(${b.id_billing}, '${b.periode}', ${b.sisa})">
        Bayar
      </button>`;
  
    container.innerHTML += `
      <div class="grid-row">
        <div class="grid-cell text-left">${b.periode}</div>
        <div class="grid-cell">${rupiah(b.nominal)}</div>
        <div class="grid-cell">${rupiah(b.nominal - b.sisa)}</div>
        <div class="grid-cell">${rupiah(b.sisa)}</div>
        <div class="grid-cell">
          <span class="ysq-status-pill ${statusClass}">
            ${statusText}  </span>
        </div>
        <div class="grid-cell">${actionBtn}</div>
      </div>
    `;
  })};

/* ============================
   RENDER NON IURAN
============================ */
function renderNonIuran() {
  const rows = document.querySelector("#section-non-iuran .grid-body");
  rows.innerHTML = "";

  const yearVal =
    document.getElementById("year-filter")?.value || "all";
  const statusVal =
    document.getElementById("status-filter")?.value || "all";

  let non = allBilling.filter(b => b.jenis === "LAINNYA");

  // 🔹 FILTER TAHUN
  if (yearVal !== "all") {
    non = non.filter(b =>
      b.tanggal_mulai?.slice(0, 4) === yearVal
    );
  }

  // 🔹 FILTER STATUS
  if (statusVal !== "all") {
    non = non.filter(b => {
      if (statusVal === "success") return b.status === "lunas";
      if (statusVal === "warning") return b.sisa < b.nominal && b.sisa > 0;
      if (statusVal === "danger") return b.sisa === b.nominal;
    });
  }

  if (!non.length) {
    rows.innerHTML =
      `<div class="grid-row"><div class="grid-cell">Tidak ada tagihan</div></div>`;
    return;
  }

  non.forEach(b => {
    let statusText = "";
    let statusClass = "";
    
    if (b.status === "lunas") {
  statusText = "LUNAS";
  statusClass = "success";

} else if (b.status === "nyicil") {
  statusText = "MENICIL";
  statusClass = "warning";

} else if (b.status === "menunggu") {
  statusText = "MENUNGGU VERIFIKASI";
  statusClass = "warning";

} else {
  statusText = "BELUM BAYAR";
  statusClass = "danger";
}

  
    rows.innerHTML += `
      <div class="grid-row">
        <div class="grid-cell text-left">${b.tipe}</div>
        <div class="grid-cell">${rupiah(b.nominal)}</div>
        <div class="grid-cell">${rupiah(b.nominal - b.sisa)}</div>
        <div class="grid-cell">${rupiah(b.sisa)}</div>
        <div class="grid-cell">
          <span class="ysq-status-pill ${statusClass}">
            ${statusText} </span>
        </div>
        <div class="grid-cell">
          ${
  ["lunas", "menunggu"].includes(b.status)
    ? "-"
    : `<button class="ysq-btn-upload"
        onclick="openPaymentModal(${b.id_billing}, '${b.tipe}', ${b.sisa})">
        Bayar
      </button>`
}
        </div>
      </div>
    `;
  });
}


/* ============================
   FILTER
============================ */
function onKategoriChange(e) {
  const val = e.target.value;
  document.getElementById("section-spp-table").style.display =
    val === "spp" ? "block" : "none";
  document.getElementById("section-non-iuran").style.display =
    val === "non-iuran" ? "block" : "none";
}

/* ============================
   MODAL
============================ */
window.openPaymentModal = function (idBilling, label, sisa) {
  activeBilling = idBilling;

  document.getElementById("billPeriodInfo").textContent = label;
  document.getElementById("billAmountInfo").textContent =
    new Intl.NumberFormat("id-ID").format(sisa);

  document.getElementById("inputAmount").value = "";
  document.getElementById("paymentModal").style.display = "flex";
};

function closePaymentModal() {
  document.getElementById("paymentModal").style.display = "none";
}

/* ============================
   SUBMIT PAYMENT
============================ */
async function submitPayment(e) {
  e.preventDefault();

  const amount = parseInt(
    document.getElementById("inputAmount").value.replace(/\D/g, "")
  );
  const metode = e.target.querySelector("select").value;

  if (!amount || amount <= 0) {
    alert("Jumlah bayar tidak valid");
    return;
  }

  try {
    await apiPost("/keuangan/pembayaran", {
      id_billing: activeBilling,
      jumlah_bayar: amount,
      metode,
    });

    alert("Pembayaran berhasil dikirim, menunggu verifikasi admin");
    closePaymentModal();
    loadBillingSantri();
  } catch (err) {
    alert("Gagal mengirim pembayaran");
  }
}

/* ============================
   PERIODE FILTER
============================ */
function initPeriodeFilter() {
  const select = document.getElementById("year-filter");
  if (!select) return;

  const tahunSet = new Set();

  allBilling.forEach(b => {
    if (b.periode) {
      tahunSet.add(b.periode.slice(0, 4)); // ambil 2026
    }
  });

  select.innerHTML =
    `<option value="all">Semua Tahun</option>` +
    [...tahunSet]
      .sort()
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
}


function formatRupiahInput(input) {
  // Ambil angka saja
  let angka = input.value.replace(/\D/g, "");

  if (!angka) {
    input.value = "";
    return;
  }

  // Format ribuan Indonesia
  input.value = new Intl.NumberFormat("id-ID").format(angka);
}
