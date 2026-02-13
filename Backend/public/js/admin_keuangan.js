import { apiGet, apiPost, apiPut } from "./apiService.js";

/* =====================================================
   HELPER
===================================================== */
const $ = (id) => document.getElementById(id);
const rupiah = (n) => "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);
const todayISO = () => new Date().toISOString().slice(0, 10);
const cleanRupiah = (val) => parseInt(val.replace(/\D/g, "")) || 0;

/* =====================================================
   STATE
===================================================== */
let rawData = [];
let allClassData = [];
let filteredData = [];
let currentMode = "all";

let sppExportData = {};            // MODE 2 — SPP
let billLainnyaExportData = {};    // ✅ MODE 3 — BILL LAINNYA
let exportBuffer = [];


/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
    initDefaultDate();
    await loadDashboardSummary(); // <--- Tambahkan ini agar angka dashboard muncul saat buka page
    await loadGlobalPemasukan();
    await loadInitialClassData();// <--- GANTI loadSantriList dengan ini

  $("ysq-filter-cat").addEventListener("change", onKategoriChange);

  // Listener untuk filter otomatis saat kategori di modal berubah
  $("spp-kategori")?.addEventListener("change", filterClassByCategory);

  document.querySelector(".ysq-main-generate").addEventListener("click", (e) => {
    e.preventDefault();
    generateIncomeReport();
  });
});

function initDefaultDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  if ($("ysq-date-start")) $("ysq-date-start").value = d.toISOString().slice(0, 10);
  if ($("ysq-date-end")) $("ysq-date-end").value = todayISO();
}


async function loadDashboardSummary() {
    try {
        const res = await apiGet("/keuangan/laporan/ringkasan");
        // res.data biasanya berisi { pemasukan, pengeluaran, saldo }
        const data = res.data || res;

        // Update UI Dashboard
        if($("ysq-total-gross")) $("ysq-total-gross").textContent = rupiah(data.pemasukan);
        if($("ysq-total-pengeluaran")) $("ysq-total-pengeluaran").textContent = rupiah(data.pengeluaran);
        if($("ysq-saldo-akhir")) $("ysq-saldo-akhir").textContent = rupiah(data.saldo);
        
        // Load detail tunggakan secara terpisah jika perlu
        const billingRes = await apiGet("/keuangan/billing/all");
        const totalTunggakan = billingRes.reduce(
        (acc, curr) => acc + Number(curr.sisa || 0),
        0
        );

        if($("ysq-tunggakan-total")) $("ysq-tunggakan-total").textContent = rupiah(totalTunggakan);
        
    } catch (err) {
        console.error("Gagal memuat ringkasan dashboard:", err);
    }
}

/* =====================================================
   LOAD DATA KELAS (Dinamis)
===================================================== */
async function loadInitialClassData() {
    try {
      const res = await apiGet("/kelas");
      // Beberapa backend mengirim { success: true, data: [...] }
      // Sementara yang lain langsung mengirim [...]
      allClassData = res.data ? res.data : res; 
      
      console.log("Data Kelas Berhasil Dimuat:", allClassData);
      filterClassByCategory(); 
    } catch (err) {
      console.error("Gagal load data kelas:", err);
    }
  }
  
  // Fungsi untuk update dropdown kelas berdasarkan pilihan kategori (Anak/Dewasa)
  function filterClassByCategory() {
    const category = $("spp-kategori").value; // Mengambil dari dropdown kategori santri
    const selectKelas = $("spp-kelas");
    
    if (!selectKelas) return;
  
    // Debugging: Cek di console browser apakah data kelas sudah masuk atau belum
    console.log("Kategori dipilih:", category);
    console.log("Data semua kelas:", allClassData);
  
    // Filter dengan lebih aman: hapus spasi dan abaikan huruf besar/kecil
    const filtered = allClassData.filter(item => {
      // Pastikan field 'kategori' ada di data dari database
      return item.kategori && 
             item.kategori.toString().toLowerCase().trim() === category.toLowerCase().trim();
    });
  
    if (filtered.length > 0) {
      selectKelas.innerHTML = filtered.map(k => 
        `<option value="${k.id_kelas}">${k.nama_kelas}</option>`
      ).join("");
    } else {
      // Jika masih kosong, tampilkan pesan ini agar kita tahu filternya gagal
      selectKelas.innerHTML = `<option value="">Kelas ${category} tidak ditemukan</option>`;
    }
  }

/* =====================================================
   LOAD GLOBAL PEMASUKAN (Data Lunas)
===================================================== */
async function loadGlobalPemasukan() {
  try {
    const res = await apiGet("/keuangan/laporan/pemasukan/detail");
    rawData = res.data || res || []; // Sesuaikan dengan struktur response backend
    applyFilter();
  } catch (err) {
    console.error(err);
  }
}

/* =====================================================
   KATEGORI CHANGE & DYNAMIC UI
===================================================== */
function onKategoriChange() {
    const cat = $("ysq-filter-cat").value;
    currentMode =
      cat === "iuran" ? "spp" :
      cat === "infaq" ? "infaq" :
      "all";
    renderFilterInputs(currentMode);
  }
  

function renderFilterInputs(mode) {
    const container = $("ysq-filter-dynamic");
    if (!container) return;
  
    if (mode === "spp") {
      container.innerHTML = `
        <div class="ysq-inc-form-group" style="flex: 2;">
          <label>Cari Nama Santri:</label>
          <input type="text" id="ysq-search-name" class="ysq-inc-input">
        </div>
  
        <div class="ysq-inc-form-group">
          <label>Status:</label>
          <select id="ysq-filter-status" class="ysq-inc-input">
            <option value="all">Semua</option>
            <option value="lunas">Lunas</option>
            <option value="belum bayar">Belum Bayar</option>
          </select>
        </div>
      `;

      document
        .getElementById("ysq-search-name")
        ?.addEventListener("input", (e) => {
            renderSPPView(e.target.value.toLowerCase());
        });

      // 🔥 PASANG LISTENER DI SINI (TEMPAT PALING BENAR)
      document
        .getElementById("ysq-filter-status")
        ?.addEventListener("change", () => {
          const keyword =
            $("ysq-search-name")?.value.toLowerCase() || "";
          renderSPPView(keyword);
        });
    }
  
    else if (mode === "infaq") {
      container.innerHTML = `
        <div class="ysq-inc-form-group" style="flex: 2;">
          <label>Cari Jenis Biaya:</label>
          <input type="text" id="ysq-search-name" class="ysq-inc-input">
        </div>
      `;
    
      // 🔥 WAJIB: pasang listener
      document
        .getElementById("ysq-search-name")
        ?.addEventListener("input", (e) => {
          renderInfaqView(e.target.value.toLowerCase());
        });
    }    
  
    else {
      container.innerHTML = `
        <div class="ysq-inc-form-group">
          <label>Periode Awal:</label>
          <input type="date" id="ysq-date-start" class="ysq-inc-input">
        </div>
        <div class="ysq-inc-form-group">
          <label>Periode Akhir:</label>
          <input type="date" id="ysq-date-end" class="ysq-inc-input">
        </div>
      `;
      initDefaultDate();
    }
  }
  

/* =====================================================
   CORE GENERATE REPORT (SINKRON DENGAN BACKEND)
===================================================== */
window.generateIncomeReport = async function () {
    resetUI();
    const searchInput = $("ysq-search-name");
    const keyword = searchInput ? searchInput.value.toLowerCase() : "";
  
    if (currentMode === "spp") {
      await renderSPPView(keyword);
    } else if (currentMode === "infaq") {
      await renderInfaqView(keyword); // Gunakan await karena ini fungsi async sekarang
    } else {
      await loadGlobalPemasukan();
    }
  };

/* =====================================================
   MODE SPP (Admin - Manajemen Tagihan & Konfirmasi)
==================================================== */
async function renderSPPView(keyword = "") {
    addHeaderButton("Tambah SPP", openSPPModal);
  
    const statusFilter = ($("ysq-filter-status")?.value || "all").toLowerCase();
  
    const header = document.querySelector(".ysq-inc-table thead");
    header.innerHTML = `
      <tr>
        <th>PERIODE</th>
        <th>NAMA SANTRI</th>
        <th>KATEGORI</th>
        <th>TOTAL TAGIHAN</th>
        <th>TUNGGAKAN</th>
        <th>STATUS</th>
        <th>AKSI</th>
      </tr>`;
  
    const tbody = $("ysq-income-body");
    tbody.innerHTML = `<tr><td colspan="7">Memuat data tagihan...</td></tr>`;
  
    try {
        const res = await apiGet("/keuangan/billing/all");

        // 🔒 KUNCI: SPP ONLY
        let data = res.filter(d =>
          d.jenis === "SPP" &&
          d.id_santri !== null
        );
        
        // ===== SIMPAN UNTUK EXPORT =====
        sppExportData = {};

        data.forEach(d => {
          if (!sppExportData[d.periode]) {
            sppExportData[d.periode] = [];
          }
          sppExportData[d.periode].push(d);
        });

  
      // 🔍 filter nama
      if (keyword) {
        data = data.filter(d =>
          (d.nama || "").toLowerCase().includes(keyword)
        );
      }      
  
      // 🔍 filter status
      // Cari bagian ini di kode Anda dan gabungkan menjadi satu:
      if (statusFilter !== "all") {
        data = data.filter(d => {
          const s = d.status?.toLowerCase().trim();
          if (statusFilter === "lunas") return s === "lunas";
          if (statusFilter === "belum bayar") return s === "belum bayar";
          return true;
        });
      }
  
      tbody.innerHTML = "";
      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Data tidak ditemukan</td></tr>`;
        return;
      }
  
      data.forEach(d => {
        const isLunas = d.status === "lunas";
        const statusClass = isLunas ? "status-lunas" : "status-tunggakan";
  
        const actionBtn = isLunas
  ? `<span style="color: green">✓ Selesai</span>`
  : `<button
       class="ysq-inc-btn ysq-inc-btn-danger"
       onclick="openDetailBilling('${d.id_billing}')"
       style="padding:2px 8px;font-size:12px">
       Konfirmasi
     </button>`;

  
        tbody.innerHTML += `
          <tr>
            <td>${d.periode}</td>
            <td>${d.nama}</td>
            <td>${d.tipe.toUpperCase()}</td>
            <td>${rupiah(d.nominal)}</td>
            <td style="color:${isLunas ? "green" : "red"}; font-weight:bold">
              ${rupiah(d.sisa)}
            </td>
            <td><span class="ysq-badge ${statusClass}">
              ${d.status.toUpperCase()}
            </span></td>
            <td>${actionBtn}</td>
          </tr>`;
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7">Gagal memuat data</td></tr>`;
    }
  }

  
  window.openKonfirmasi = async function (idBilling) {
    try {
      // Ambil semua pembayaran
      const data = await apiGet(`/keuangan/billing/${idBilling}/santri`);

        const p = data.find(x => x.status === "menunggu");

        if (!p || !p.id_pembayaran) {
        return alert("Belum ada pembayaran dari santri");
        }
  
      if (!p) {
        return alert("Belum ada pembayaran dari santri");
      }
  
      if (!confirm(`Terima pembayaran sebesar ${rupiah(p.jumlah_bayar)} ?`)) {
        return;
      }
  
      await apiPut(`/keuangan/pembayaran/${p.id_pembayaran}/konfirmasi`);
  
      alert("Pembayaran berhasil dikonfirmasi");
      renderSPPView();
      loadDashboardSummary();
  
    } catch (err) {
      console.error(err);
      alert("Gagal konfirmasi pembayaran");
    }
  };  
  

/* =====================================================
   MODE INFAQ (Admin - Verifikasi Donasi)
===================================================== */
async function renderInfaqView(keyword = "") {
    addHeaderButton("Tambah pembayaran", openInfaqModal);
    
  
    const header = document.querySelector(".ysq-inc-table thead");
    header.innerHTML = `
      <tr>
        <th>Tanggal</th>
        <th>Biaya</th>
        <th>Keterangan</th>
        <th>Nominal</th>
        <th>Aksi</th>
      </tr>`;
  
    const tbody = $("ysq-income-body");
    tbody.innerHTML = `<tr><td colspan="5">Memuat data...</td></tr>`;
  
    try {
      const billing = await apiGet("/keuangan/billing/all");

// ===============================
// 🔥 SIMPAN DATA UNTUK EXPORT
// ===============================
billLainnyaExportData = {};

// ===============================
// 🔥 DATA UNTUK TABEL
// ===============================
const map = {};

billing
  .filter(b => b.jenis === "LAINNYA")
  .forEach(b => {

    // --- UNTUK TABEL ---
    const key = `${b.tipe}-${b.nominal}-${b.keterangan}`;
    if (!map[key]) map[key] = b;

    // --- UNTUK EXPORT ---
    const billKey = b.tipe.toUpperCase();
    if (!billLainnyaExportData[billKey]) {
      billLainnyaExportData[billKey] = {
        santri: []
      };
    }

    billLainnyaExportData[billKey].santri.push({
      nama: b.nama || "Santri",
      jumlah_bayar: Number(b.nominal || 0),
      status: b.status?.toLowerCase() === "lunas" ? "lunas" : "belum bayar"
    });    
  });

let data = Object.values(map);
  
      if (keyword) {
        data = data.filter(b =>
          b.tipe.toLowerCase().includes(keyword.toLowerCase())
        );
      }
  
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="5">Tidak ada pembayaran lainnya</td></tr>`;
        return;
      }
  
      tbody.innerHTML = data.map(b => `
        <tr>
          <td>${new Date(b.created_at).toLocaleDateString("id-ID")}</td>
          <td>${b.tipe}</td>
          <td>${b.keterangan || "-"}</td>
          <td align="right">${rupiah(b.nominal)}</td>
          <td>
          <button class="ysq-inc-btn ysq-inc-btn-primary"
            onclick="openDetailBilling('${b.id_billing}')">
            Lihat Pembayaran
          </button>
        </td>
        </tr>
      `).join("");
  
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="5">Gagal memuat data</td></tr>`;
    }
  }  

  window.konfirmasiInfaq = async function (idPembayaran) {
    if (!confirm("Konfirmasi infaq ini?")) return;
  
    await apiPut(`/keuangan/pembayaran/${idPembayaran}/verifikasi`);
  
    alert("Infaq berhasil dikonfirmasi");
    renderInfaqView();
    loadDashboardSummary();
  };

  
/* =====================================================
   MODAL SPP LOGIC (Gambar 2)
===================================================== */
window.openSPPModal = () => ($("sppModal").style.display = "flex");
window.closeSPPModal = () => ($("sppModal").style.display = "none");

/* =====================================================
   MODAL SPP LOGIC
===================================================== */
window.openSPPModal = () => {
    $("sppModal").style.display = "flex";
    filterClassByCategory();
  };  
  
// Tambahkan parameter 'e' di sini
window.saveSPPFromModal = async function () {
    const idKelas = $("spp-kelas").value;
  
    if (!idKelas) return alert("Pilih kelas terlebih dahulu!");
  
    const payload = {
      id_kelas: idKelas,
      jenis: "SPP",
      tipe: $("spp-kategori").value.toLowerCase(),
      periode_awal: $("spp-tgl-mulai").value,
      periode_akhir: $("spp-tgl-akhir").value,
      nominal: cleanRupiah($("spp-nominal").value)
    };
  
    try {
      const res = await apiPost("/keuangan/billing/manual-kelas", payload);
      if (res.success) {
        alert(res.message);
        closeSPPModal();
  
        // ⬇️ KUNCI UTAMA
        currentMode = "spp";
        $("ysq-filter-cat").value = "iuran";
        renderFilterInputs("spp");
        document
        .getElementById("ysq-filter-status")
        ?.addEventListener("change", () => {
            const keyword = $("ysq-search-name")?.value.toLowerCase() || "";
            renderSPPView(keyword);
        });

        await renderSPPView();
        await loadDashboardSummary();
      }
    } catch (err) {
      alert("Gagal menyimpan SPP");
    }
  };
  

/* =====================================================
   FILTER GLOBAL & SUMMARY (Untuk "Semua Pemasukan")
===================================================== */
function applyFilter() {
  const start = $("ysq-date-start")?.value;
  const end = $("ysq-date-end")?.value;

  filteredData = rawData.filter((d) => {
    const tgl = d.tanggal?.slice(0, 10);
    if (start && tgl < start) return false;
    if (end && tgl > end) return false;
    return true;
  });

  if (currentMode === "all") renderGlobalTable();
  renderSummary(filteredData);
}

function renderGlobalTable() {
    const tbody = $("ysq-income-body");
  
    tbody.innerHTML = filteredData.map(d => {
      const kelas =
        d.nama_kelas ||
        d.kelas ||
        "-";
  
      const periode =
        d.periode ||
        (d.periode_awal && d.periode_akhir
          ? `${d.periode_awal} s/d ${d.periode_akhir}`
          : "-");
  
      return `
        <tr>
          <td>${new Date(d.tanggal).toLocaleDateString("id-ID")}</td>
          <td>${d.nama || "Hamba Allah"}</td>
          <td>${kelas}</td>
          <td>${periode}</td>
          <td>${d.kategori.toUpperCase()}</td>
          <td align="right">${rupiah(d.nominal)}</td>
        </tr>
      `;
    }).join("");
  }
  
  
  function renderSummary(data) {
    let spp = 0, infaq = 0;
  
    data.forEach(d => {
      if (d.kategori === "SPP") spp += Number(d.nominal);
      if (d.kategori === "LAINNYA") infaq += Number(d.nominal);
    });
  
    $("ysq-total-iuran").textContent = rupiah(spp);
    $("ysq-total-infaq").textContent = rupiah(infaq);
    $("ysq-total-gross").textContent = rupiah(spp + infaq);
  }

/* =====================================================
   UI UTILS
===================================================== */
function addHeaderButton(text, action) {
  const header = $("ysq-header-actions");
  if (!header.querySelector(".btn-dynamic")) {
    const btn = document.createElement("button");
    btn.className = "ysq-inc-btn ysq-inc-btn-primary btn-dynamic";
    btn.innerHTML = `<i class="fas fa-plus-circle"></i> ${text}`;
    btn.onclick = action;
    header.prepend(btn);
  }
}

function resetUI() {
  const dynamicBtn = document.querySelector(".btn-dynamic");
  if (dynamicBtn) dynamicBtn.remove();
  
  document.querySelector(".ysq-inc-table thead").innerHTML = `
    <tr>
      <th>Tanggal</th>
      <th>Nama Santri / Sumber</th>
      <th>Kelas</th>
      <th>Periode / Keterangan</th>
      <th>Kategori</th>
      <th>Nominal</th>
    </tr>`;
}

window.formatRupiah = function (input) {
  input.value = new Intl.NumberFormat("id-ID").format(cleanRupiah(input.value));
};

// Modal Infaq handlers
window.openInfaqModal = () => ($("infaqModal").style.display = "flex");
window.closeInfaqModal = () => ($("infaqModal").style.display = "none");
window.saveInfaqFromModal = async function () {
    const payload = {
      nama_pembayaran: $("modal-nama").value,
      tanggal_mulai: $("modal-tgl").value || todayISO(),
      nominal: cleanRupiah($("modal-nominal").value),
      keterangan: $("modal-ket").value
    };
  
    if (!payload.nama_pembayaran || payload.nominal <= 0) {
      return alert("Data pembayaran tidak valid");
    }
  
    try {
      await apiPost("/keuangan/billing/lainnya", payload);
  
      alert("Bill pembayaran lainnya berhasil dibuat");
      closeInfaqModal();
  
      currentMode = "infaq";
      renderInfaqView();
      loadDashboardSummary();
  
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pembayaran lainnya");
    }
  };


/* =====================================================
   SINKRONISASI MODAL DETAIL (PERBAIKAN STATUS)
===================================================== */
window.openDetailBilling = async function (idBilling) {
  const modal = $("detailBillingModal");
  if (modal) modal.style.display = "flex";

  const tbody = $("detail-billing-body");
  tbody.innerHTML = `<tr><td colspan="4">Memuat data...</td></tr>`;

  try {
    const res = await apiGet(`/keuangan/billing/${idBilling}/santri`);
    const data = res.data || res;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Belum ada pembayaran</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(p => {

      const statusPembayaran = p.status_pembayaran;
      const statusBilling = p.status_billing;

      let aksi = "-";
      let teksStatus = "";
      let warna = "#333";

      const jumlahBayar = p.jumlah_bayar
        ? rupiah(p.jumlah_bayar)
        : "-";

      /* ===============================
         🔵 STATUS TRANSAKSI
      ================================ */

      if (statusPembayaran === "menunggu") {
        teksStatus = "⏳ MENUNGGU VERIFIKASI";
        warna = "orange";
        aksi = `
          <button class="ysq-inc-btn ysq-inc-btn-primary"
            onclick="konfirmasiPembayaran('${p.id_pembayaran}', '${idBilling}')">
            Konfirmasi
          </button>`;
      }

      else if (statusPembayaran === "lunas") {
        teksStatus = "✅ TERKONFIRMASI";
        warna = "green";
        aksi = `<i class="fas fa-check-circle" style="color:green"></i>`;
      }

      else {
        teksStatus = "❌ BELUM ADA PEMBAYARAN";
        warna = "red";
      }

      return `
        <tr>
          <td>${p.nama}</td>
          <td align="right"><b>${jumlahBayar}</b></td>
          <td style="color:${warna}; font-weight:bold;">
            ${teksStatus}
          </td>
          <td align="center">${aksi}</td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="4">Gagal memuat data</td></tr>`;
  }
};

  window.closeDetailBillingModal = () =>
    $("detailBillingModal").style.display = "none";
  
  
  
  
  window.openDetailBillingLainnya = async function (tipe, periode) {
    $("detailBillingModal").style.display = "flex";
    const tbody = $("detail-billing-body");
  
    tbody.innerHTML = `<tr><td colspan="4">Memuat data santri...</td></tr>`;
  
    try {
      const res = await apiGet(
        `/keuangan/billing/lainnya/detail?tipe=${tipe}&periode=${periode}`
      );
  
      if (!res.length) {
        tbody.innerHTML = `<tr><td colspan="4">Tidak ada data santri</td></tr>`;
        return;
      }
  
      tbody.innerHTML = res.map(p => {
        let status = p.status.toUpperCase();
        let aksi = "-";
  
        if (p.status === "menunggu") {
          aksi = `
            <button class="ysq-inc-btn ysq-inc-btn-primary"
              onclick="konfirmasiPembayaran('${p.id_pembayaran}', '${p.id_billing}')">
              Konfirmasi
            </button>`;
        }
  
        return `
          <tr>
            <td>${p.nama}</td>
            <td align="right">${p.jumlah_bayar ? rupiah(p.jumlah_bayar) : "-"}</td>
            <td>${status}</td>
            <td>${aksi}</td>
          </tr>
        `;
      }).join("");
  
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4">Gagal memuat data</td></tr>`;
    }
  };


/* =====================================================
   KONFIRMASI PEMBAYARAN + AUTO PINDAH KE SEMUA PEMASUKAN
===================================================== */
function konfirmasiPembayaran(idPembayaran, idBilling) {

  if (!idPembayaran || idPembayaran === "undefined") {
    alert("ID Pembayaran tidak ditemukan!");
    return;
  }

  if (!confirm("Apakah Anda yakin ingin memverifikasi pembayaran ini?")) {
    return;
  }

  apiPut(`/keuangan/pembayaran/${idPembayaran}/konfirmasi`)
    .then(async (res) => {

      if (res.success) {

        alert("Pembayaran berhasil dikonfirmasi!");

        // 🔴 Tutup modal
        closeDetailBillingModal();

        // 🔵 Reset mode ke SEMUA PEMASUKAN
        currentMode = "all";
        $("ysq-filter-cat").value = "all";

        // 🔵 Reset tampilan filter
        renderFilterInputs("all");

        // 🔵 Reload data global pemasukan
        await loadGlobalPemasukan();

        // 🔵 Update dashboard summary
        await loadDashboardSummary();

      } else {
        alert("Gagal konfirmasi pembayaran");
      }

    })
    .catch(err => {
      console.error("Error konfirmasi:", err);
      alert("Terjadi kesalahan server");
    });
}

window.konfirmasiPembayaran = konfirmasiPembayaran;
  

  window.exportData = function (type) {

    // MODE 1 — SEMUA PEMASUKAN
    if (currentMode === "all") {
      if (type === "excel") exportAllIncomeExcel();
      if (type === "pdf") exportAllIncomePDF();
      return;
    }
  
    // MODE 2 — SPP
    if (currentMode === "spp") {
      if (type === "excel") exportSPPExcel();
      if (type === "pdf") exportSPPPDF();
      return;
    }
  
    // MODE 3 — BILL LAINNYA
    if (currentMode === "infaq") {
      if (type === "excel") exportBillLainnyaExcel();
      if (type === "pdf") exportBillLainnyaPDF();
      return;
    }
  
    alert("Mode export tidak dikenali");
  };  

  function exportAllIncomePDF() {
    if (!filteredData.length) {
      alert("Tidak ada data untuk diexport");
      return;
    }
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    let totalSPP = 0;
    let totalLainnya = 0;
  
    filteredData.forEach(d => {
      if (d.kategori === "SPP") totalSPP += Number(d.nominal);
      if (d.kategori === "LAINNYA") totalLainnya += Number(d.nominal);
    });
  
    const totalGross = totalSPP + totalLainnya;
  
    // JUDUL
    doc.setFontSize(14);
    doc.text("LAPORAN PEMASUKAN KEUANGAN", 14, 15);
  
    doc.setFontSize(10);
    doc.text(
      `Periode: ${$("ysq-date-start").value} s/d ${$("ysq-date-end").value}`,
      14,
      22
    );
  
    // RINGKASAN
    doc.text(`Total SPP        : ${rupiah(totalSPP)}`, 14, 32);
    doc.text(`Total Lainnya   : ${rupiah(totalLainnya)}`, 14, 38);
    doc.text(`Total Gross     : ${rupiah(totalGross)}`, 14, 44);
  
    // TABEL
    const tableData = filteredData.map(d => [
      new Date(d.tanggal).toLocaleDateString("id-ID"),
      d.nama || "Hamba Allah",
      d.kelas || "-",
      d.periode || d.keterangan || "-",
      d.kategori,
      rupiah(d.nominal)
    ]);
  
    doc.autoTable({
      startY: 55,
      head: [[
        "Tanggal",
        "Nama",
        "Kelas",
        "Periode",
        "Kategori",
        "Nominal"
      ]],
      body: tableData
    });
  
    doc.save(`laporan-pemasukan-${todayISO()}.pdf`);
  }
  
  function exportAllIncomeExcel() {
    if (!filteredData.length) {
      alert("Tidak ada data untuk diexport");
      return;
    }
  
    // =============================
    // HITUNG RINGKASAN
    // =============================
    let totalSPP = 0;
    let totalLainnya = 0;
  
    filteredData.forEach(d => {
      if (d.kategori === "SPP") totalSPP += Number(d.nominal);
      if (d.kategori === "LAINNYA") totalLainnya += Number(d.nominal);
    });
  
    const totalGross = totalSPP + totalLainnya;
  
    // =============================
    // DATA EXCEL
    // =============================
    const rows = [
      ["LAPORAN PEMASUKAN KEUANGAN"],
      [`Periode: ${$("ysq-date-start").value} s/d ${$("ysq-date-end").value}`],
      [],
      ["Total SPP", totalSPP],
      ["Total Bill Lainnya", totalLainnya],
      ["Total Gross", totalGross],
      [],
      [
        "Tanggal",
        "Nama Santri / Sumber",
        "Kelas",
        "Periode / Keterangan",
        "Kategori",
        "Nominal"
      ]
    ];
  
    filteredData.forEach(d => {
      rows.push([
        new Date(d.tanggal).toLocaleDateString("id-ID"),
        d.nama || "Hamba Allah",
        d.kelas || "-",
        d.periode || d.keterangan || "-",
        d.kategori,
        d.nominal
      ]);
    });
  
    // =============================
    // BUAT FILE EXCEL
    // =============================
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 14 },
      { wch: 25 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 }
    ];
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DATA PEMASUKAN");
  
    XLSX.writeFile(
      wb,
      `laporan-pemasukan-${todayISO()}.xlsx`
    );
  }

  

  function exportSPPExcel() {
    if (!sppExportData || Object.keys(sppExportData).length === 0) {
      alert("Data SPP belum dimuat");
      return;
    }
  
    const wb = XLSX.utils.book_new();
  
    Object.keys(sppExportData).forEach(periode => {
      const rows = [];
  
      rows.push([`LAPORAN SPP PERIODE ${periode}`]);
      rows.push([]);
  
      const dataPeriode = sppExportData[periode];
  
      // GROUP BY KELAS
      const byKelas = {};
      dataPeriode.forEach(d => {
        const key = `${d.nama_kelas} (${d.tipe})`;
        if (!byKelas[key]) byKelas[key] = [];
        byKelas[key].push(d);
      });
  
      Object.keys(byKelas).forEach(kelas => {
        rows.push([`Kelas: ${kelas}`]);
        rows.push(["Nama Santri", "Nominal", "Tunggakan", "Status"]);
  
        let lunas = 0, nyicil = 0, belum = 0;
  
        byKelas[kelas].forEach(s => {
          rows.push([
            s.nama,
            s.nominal,
            s.sisa,
            s.status.toUpperCase()
          ]);
  
          if (s.status === "lunas") lunas += s.nominal;
          else if (s.status === "nyicil") nyicil += s.nominal - s.sisa;
          else belum += s.nominal;
        });
  
        rows.push([]);
        rows.push(["Subtotal Lunas", lunas]);
        rows.push(["Subtotal Nyicil", nyicil]);
        rows.push(["Subtotal Belum Bayar", belum]);
        rows.push([]);
      });
  
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `SPP-${periode}`);
    });
  
    XLSX.writeFile(wb, "laporan-spp.xlsx");
  }
  function exportSPPPDF() {
    if (!sppExportData || Object.keys(sppExportData).length === 0) {
      alert("Data SPP belum tersedia untuk export");
      return;
    }
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
  
    let firstPage = true;
  
    Object.keys(sppExportData).forEach((periode) => {
      if (!firstPage) doc.addPage();
      firstPage = false;
  
      doc.setFontSize(14);
      doc.text(`LAPORAN SPP PERIODE ${periode}`, 14, 15);
  
      let yPos = 22;
      const data = sppExportData[periode];
  
      // GROUP BY KELAS + KATEGORI
      const group = {};
      data.forEach(d => {
        // --- PERBAIKAN DI SINI ---
        const namaKelas = d.nama_kelas || d.kelas || d.id_kelas || "Tanpa Kelas";
        const tipeSantri = (d.tipe || "").toUpperCase();
        const key = `${namaKelas} (${tipeSantri})`;
        
        if (!group[key]) group[key] = [];
        group[key].push(d);
      });
  
      Object.keys(group).forEach((kelas) => {
        // Cek apakah yPos sudah mendekati akhir halaman
        if (yPos > 240) {
          doc.addPage();
          yPos = 20;
        }
  
        doc.setFontSize(11);
        doc.text(`Kelas: ${kelas}`, 14, yPos);
        yPos += 4;
  
        const rows = [];
        let lunas = 0, nyicil = 0, belum = 0;
  
        group[kelas].forEach(s => {
          rows.push([
            s.nama,
            rupiah(s.nominal),
            rupiah(s.sisa),
            (s.status || "BELUM BAYAR").toUpperCase()
          ]);
  
          if (s.status === "lunas") lunas += Number(s.nominal);
          else if (s.status === "nyicil") nyicil += (Number(s.nominal) - Number(s.sisa));
          else belum += Number(s.sisa || s.nominal);
        });
  
        doc.autoTable({
          startY: yPos,
          head: [["Nama Santri", "Nominal", "Tunggakan", "Status"]],
          body: rows,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] }
        });
  
        yPos = doc.lastAutoTable.finalY + 6;
  
        doc.setFontSize(9);
        doc.text(`Total Lunas        : ${rupiah(lunas)}`, 14, yPos);
        doc.text(`Total Nyicil       : ${rupiah(nyicil)}`, 14, yPos + 4);
        doc.text(`Total Belum Bayar  : ${rupiah(belum)}`, 14, yPos + 8);
  
        yPos += 16;
      });
    });
  
    doc.save(`laporan-spp-${todayISO()}.pdf`);
  }
  

  function exportBillLainnyaPDF() {
    if (!Object.keys(billLainnyaExportData).length) {
      alert("Data bill lainnya kosong");
      return;
    }
  
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    let first = true;
  
    Object.keys(billLainnyaExportData).forEach((billName) => {
      if (!first) doc.addPage();
      first = false;
  
      doc.setFontSize(14);
      doc.text(`LAPORAN BILL ${billName}`, 14, 15);
  
      const rows = [];
      let lunas = 0;
      let belum = 0;
  
      billLainnyaExportData[billName].santri.forEach(s => {
        rows.push([
          s.nama,
          rupiah(s.jumlah_bayar),
          s.status.toUpperCase()
        ]);
  
        if (s.status === "lunas") lunas += s.jumlah_bayar;
        else belum += s.jumlah_bayar;
      });
  
      doc.autoTable({
        startY: 25,
        head: [["Nama Santri", "Jumlah Bayar", "Status"]],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [39, 174, 96] }
      });
  
      const y = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(10);
      doc.text(`Total Lunas       : ${rupiah(lunas)}`, 14, y);
      doc.text(`Total Belum Bayar : ${rupiah(belum)}`, 14, y + 6);
    });
  
    doc.save("laporan-bill-lainnya.pdf");
  }

  function exportBillLainnyaExcel() {
    if (!Object.keys(billLainnyaExportData).length) {
      alert("Data bill lainnya kosong");
      return;
    }
  
    const wb = XLSX.utils.book_new();
  
    Object.keys(billLainnyaExportData).forEach((billName) => {
      const data = billLainnyaExportData[billName].santri;
  
      let totalLunas = 0;
      let totalBelum = 0;
  
      const rows = [
        [`LAPORAN BILL ${billName}`],
        [],
        ["Nama Santri", "Jumlah Bayar", "Status"]
      ];
  
      data.forEach(s => {
        const nominal = Number(s.jumlah_bayar || 0);
        const status = (s.status || "").toLowerCase();
  
        // isi tabel
        rows.push([
          s.nama,
          nominal,
          status.toUpperCase()
        ]);
  
        // hitung total
        if (status === "lunas") {
          totalLunas += nominal;
        } else {
          totalBelum += nominal;
        }
      });
  
      // ringkasan di atas
      rows.unshift(
        [`Total Lunas`, totalLunas],
        [`Total Belum Bayar`, totalBelum],
        []
      );
  
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 15 }
      ];
  
      XLSX.utils.book_append_sheet(wb, ws, billName);
    });
  
    XLSX.writeFile(wb, "laporan-bill-lainnya.xlsx");
  }
  


  