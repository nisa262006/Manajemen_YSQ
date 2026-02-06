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
let allClassData = []; // <--- TAMBAHKAN INI
let filteredData = [];
let currentMode = "all";

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
          <label>Cari Nama Donatur:</label>
          <input type="text" id="ysq-search-name" class="ysq-inc-input">
        </div>
      `;
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
  
      // 🔥 GROUP BY (tipe + nominal + keterangan)
      const map = {};
      billing
        .filter(b => b.jenis === "LAINNYA")
        .forEach(b => {
          const key = `${b.tipe}-${b.nominal}-${b.keterangan}`;
          if (!map[key]) map[key] = b;
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
   SINKRONISASI MODAL DETAIL (FIXED)
===================================================== */
/* =====================================================
   SINKRONISASI MODAL DETAIL (PERBAIKAN STATUS)
===================================================== */
window.openDetailBilling = async function (idBilling) {
  const modal = $("detailBillingModal");
  if(modal) modal.style.display = "flex";

  const tbody = $("detail-billing-body");
  tbody.innerHTML = `<tr><td colspan="4">Memuat data santri...</td></tr>`;

  try {
      const res = await apiGet(`/keuangan/billing/${idBilling}/santri`);
      const data = res.data || res;

      if (!data || data.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4">Tidak ada data santri aktif.</td></tr>`;
          return;
      }

      tbody.innerHTML = data.map(p => {
          // 🔥 KOREKSI 1: Pastikan mengambil status_pembayaran sesuai alias di Backend
          const rawStatus = p.status; // ← ini dari billing_santri
          const stat = rawStatus.toLowerCase();
          
          let aksi = "-";
          let warna = "#333";
          let teksStatus = "BELUM BAYAR";
          
          // 🔥 KOREKSI 2: Definisikan variabel jumlahBayar agar tidak error
          let jumlahBayar = p.jumlah_bayar ? rupiah(p.jumlah_bayar) : "-";

          // 🔥 KOREKSI 3: Logika penentuan label dan tombol konfirmasi
          if (stat === "menunggu") {
              teksStatus = "⏳ MENUNGGU";
              warna = "orange";
              aksi = `<button class="ysq-inc-btn ysq-inc-btn-primary" 
                        onclick="konfirmasiPembayaran('${p.id_pembayaran}', '${idBilling}')"
                        style="padding: 4px 8px; font-size: 11px;">
                        Konfirmasi
                      </button>`;
          } 
          else if (stat === "lunas" || stat === "terverifikasi") {
              teksStatus = "✅ LUNAS";
              warna = "green";
              aksi = `<i class="fas fa-check-circle" style="color:green"></i>`;
          } 
          else if (stat === "nyicil") {
              teksStatus = "📝 NYICIL";
              warna = "blue";
              aksi = `<small>Belum Lunas</small>`;
          } 
          else { 
              // Status 'belum bayar'
              teksStatus = "❌ BELUM BAYAR";
              warna = "red";
              aksi = p.no_hp ? `
                  <a href="https://wa.me/${p.no_hp.replace(/\D/g, '')}?text=Assalamu'alaikum, mengingatkan pembayaran SPP..." 
                    target="_blank" class="ysq-inc-btn" style="background:#25D366; color:white; padding:4px 8px; font-size:11px; text-decoration:none; border-radius:4px;">
                    WA Tagih
                  </a>` : "-";
          }

          return `
              <tr>
                  <td>${p.nama}</td>
                  <td align="right"><b>${jumlahBayar}</b></td>
                  <td style="color:${warna}; font-weight:bold; font-size: 12px;">${teksStatus}</td>
                  <td align="center">${aksi}</td>
              </tr>`;
      }).join("");

  } catch (err) {
      console.error("Error Detail Billing:", err);
      tbody.innerHTML = `<tr><td colspan="4">Gagal memuat detail pembayaran.</td></tr>`;
  }
};

window.konfirmasiPembayaran = async function (idPembayaran, idBilling) {
  if (!idPembayaran || idPembayaran === 'undefined') {
      return alert("ID Pembayaran tidak ditemukan! Pastikan santri sudah klik 'Bayar'.");
  }

  if (!confirm("Apakah Anda yakin ingin memverifikasi pembayaran ini?")) return;

  try {
      const res = await apiPut(`/keuangan/pembayaran/${idPembayaran}/konfirmasi`);
      if (res.success) {
          alert("Berhasil! Saldo dashboard akan diperbarui.");
          // Refresh data
          await openDetailBilling(idBilling);
          await loadDashboardSummary();
          if (typeof renderSPPView === "function") renderSPPView();
      }
  } catch (err) {
      alert("Gagal konfirmasi: " + (err.message || "Error server"));
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
  