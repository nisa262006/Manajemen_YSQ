
const BASE_URL = "http://localhost:5000";

/* ---------- Helper: fetch wrapper with json/error handling ---------- */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch(e) { body = await res.text().catch(()=>null); }
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ---------- Helper: token getter ---------- */
function getToken() {
  return localStorage.getItem("token");
}

/* ---------- Helper: debug logger (prints structured output) ---------- */
function logDebug(tag, obj) {
  try {
    console.log(`===== DEBUG ${tag} =====`);
    console.log(obj);
  } catch (e) {
    console.log(tag, obj);
  }
}

/* ---------- Clear sample placeholders in HTML so real data shows ---------- */
function clearPlaceholders() {
  const dashTbody = document.querySelector("#dashboardTable tbody");
  if (dashTbody) dashTbody.innerHTML = "";

  const jadwalTbody = document.getElementById("table_jadwal");
  if (jadwalTbody) jadwalTbody.innerHTML = "";

  const absBody = document.getElementById("absensiBody");
  if (absBody) absBody.innerHTML = "";

  const riwayat = document.getElementById("riwayatBody");
  if (riwayat) riwayat.innerHTML = "";
}

/* ---------- Set all date inputs to today if empty ---------- */
function setTodayToDateInputs() {
  const today = new Date().toISOString().split("T")[0];
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    if (!inp.value) inp.value = today;
  });
}

/* ======================================================
   LOAD DATA PENGAJAR (GET /pengajar/me)
   Untuk menampilkan nama di pojok kanan atas
====================================================== */
async function loadPengajarName() {
  const token = getToken();
  if (!token) {
    console.warn("Token tidak ditemukan, nama pengajar tidak dimuat.");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn("Gagal ambil nama pengajar", res.status);
      return;
    }

    const data = await res.json();
    logDebug("data pengajar", data);

    // API kamu: { success: true, role: "...", profile: { nama: "Maya..." } }
    const nama = data?.profile?.nama ?? data?.nama ?? null;
    if (!nama) {
      console.warn("Response /me tidak mengandung nama di data.profile.nama");
      return;
    }

    // set header name
    const el = document.querySelector(".user-name");
    if (el) el.textContent = nama;

    // set absensi panel pengajar (jika ada elemen static-value khusus)
    const staticVal = document.querySelector(".absensi-header-filters .static-value");
    if (staticVal) staticVal.textContent = nama;

  } catch (err) {
    console.error("loadPengajarName error:", err);
  }
}


/* ======================================================
   POPULATE CLASS SELECTS
   GET /kelas/pengajar/me (may return object or array)
====================================================== */
async function populateClassSelects() {
  const token = getToken();
  if (!token) return;

  try {
    const resp = await fetch(`${BASE_URL}/kelas/pengajar/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resp.ok) {
      console.warn("/kelas/pengajar/me returned", resp.status);
      // ensure selects show placeholder
      document.querySelectorAll("select.custom-select").forEach(sel => {
        if (sel) sel.innerHTML = `<option value="">Tidak ada kelas</option>`;
      });
      return;
    }

    const raw = await resp.json();
    logDebug("kelasData (raw)", raw);

    // normalize to array (backend may return object)
    let kelasList = [];
    if (Array.isArray(raw)) kelasList = raw;
    else if (raw && raw.id_kelas) kelasList = [raw];
    else if (raw && raw.data && Array.isArray(raw.data)) kelasList = raw.data;
    else if (raw && raw.data && raw.data.id_kelas) kelasList = [raw.data];

    window._kelasList = kelasList;
    window._selectedKelasId = kelasList[0]?.id_kelas ?? kelasList[0]?.id ?? null;

    // fill selects used in jadwal & absensi & riwayat
    const selects = document.querySelectorAll("#jadwal-content select.custom-select, #absensi-content select.custom-select, #riwayatKelasSelect");
    selects.forEach(sel => {
      if (!sel) return;
      sel.innerHTML = "";
      if (kelasList.length === 0) {
        sel.innerHTML = `<option value="">Tidak ada kelas</option>`;
        return;
      }
      kelasList.forEach(k => {
        const id = k.id_kelas ?? k.id ?? "";
        const nama = k.nama_kelas ?? k.nama ?? `Kelas ${id}`;
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = nama;
        sel.appendChild(opt);
      });
      // set selected to first
      sel.value = window._selectedKelasId ?? sel.options[0]?.value;
    });

  } catch (err) {
    console.error("populateClassSelects error:", err);
  }
}

/* ======================================================
   LOAD KELAS DETAIL FOR PENGAJAR (GET /kelas/pengajar/detail/:id)
   Returns normalized { kelas, santri[], jadwal[] }
====================================================== */
async function loadKelasDetailForPengajar(kelasId) {
  if (!kelasId) return null;
  const token = getToken();
  if (!token) return null;

  try {
    const detail = await fetchJSON(`${BASE_URL}/kelas/pengajar/detail/${kelasId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logDebug("detail kelas", detail);
    return {
      kelas: detail.kelas ?? detail,
      santri: Array.isArray(detail.santri) ? detail.santri : (detail.santri ? [detail.santri] : []),
      jadwal: Array.isArray(detail.jadwal) ? detail.jadwal : (detail.jadwal ? [detail.jadwal] : [])
    };
  } catch (err) {
    console.error("loadKelasDetailForPengajar error:", err);
    return null;
  }
}

/* ======================================================
   LOAD & RENDER DASHBOARD (nama kelas, hari jadwal, jumlah santri)
   - Uses /kelas/pengajar/me, /kelas/pengajar/detail/:id, /jadwal/pengajar/me
====================================================== */
async function loadPengajarData() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    // === AMBIL DATA KELAS ===
    const kelas = await fetchJSON(`http://localhost:5000/kelas/pengajar/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("===== DEBUG kelasData (raw) =====");
    console.log(kelas);

    const namaKelasEl = document.querySelector(".nama_kelas");
    const jadwalKelasEl = document.querySelector(".jadwal_kelas");
    const jumlahSantriEl = document.querySelector(".jumlah_santri");

    if (kelas.length > 0) {
      const k = kelas[0]; // pengajar selalu punya 1 kelas

      namaKelasEl.textContent = k.nama_kelas ?? "-";
      
      // ambil jadwal dari endpoint jadwal
      const jadwal = await fetchJSON(`http://localhost:5000/jadwal/pengajar/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const jadwalHari = jadwal[0]?.hari ?? "-";
      jadwalKelasEl.textContent = jadwalHari;

      // Ambil jumlah santri dari endpoint detail kelas
      const detail = await fetchJSON(`http://localhost:5000/kelas/pengajar/detail/${k.id_kelas}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("===== DEBUG detail kelas =====");
      console.log(detail);

      jumlahSantriEl.textContent = detail.santri?.length ?? 0;
    }

    // === TAMPILKAN JADWAL HARI INI DI DASHBOARD ===
    try {
      const jadwal = await fetchJSON(`http://localhost:5000/jadwal/pengajar/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      renderDashboardJadwal(Array.isArray(jadwal) ? jadwal : [jadwal]);
    } catch (err) {
      console.warn("Jadwal load error:", err);
      renderDashboardJadwal([]);
    }

  } catch (err) {
    console.error("loadPengajarData error:", err);
  }
}


/* ======================================================
   RENDER Dashboard Jadwal (table)
====================================================== */
function renderDashboardJadwal(jadwal) {
  const tbody = document.querySelector("#dashboardTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const list = Array.isArray(jadwal) ? jadwal : (jadwal ? [jadwal] : []);
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Belum ada jadwal hari ini.</td></tr>`;
    return;
  }

  list.forEach(j => {
    tbody.innerHTML += `
      <tr>
        <td>${j.hari ?? "-"}</td>
        <td>${j.jam_mulai ?? "-"} - ${j.jam_selesai ?? "-"}</td>
        <td>${j.nama_kelas ?? "-"}</td>
        <td>${j.kategori ?? "-"}</td>
        <td>${j.pertemuan_ke ?? "-"}</td>
      </tr>
    `;
  });
}

/* ======================================================
   RENDER PAGE JADWAL (detailed)
====================================================== */
function renderPageJadwal(jadwal) {
  const tbody = document.getElementById("table_jadwal");
  if (!tbody) return;
  tbody.innerHTML = "";

  const list = Array.isArray(jadwal) ? jadwal : (jadwal ? [jadwal] : []);
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Belum ada jadwal.</td></tr>`;
    return;
  }

  list.forEach((j, i) => {
    tbody.innerHTML += `
      <tr class="main-row">
        <td>${j.hari ?? "-"}</td>
        <td>${j.jam_mulai ?? "-"} - ${j.jam_selesai ?? "-"}</td>
        <td>${j.nama_kelas ?? "-"}</td>
        <td>${j.kategori ?? "-"}</td>
        <td>${j.nama_pengajar ?? "-"}</td>
        <td><button class="btn-detail" data-detail-index="${i}">Detail</button></td>
      </tr>
      <tr id="detail-${i}" class="detail-row" style="display:none;">
        <td colspan="7">
          <div class="detail-container">
            <div class="detail-card materi-card">
              <h3>Materi</h3>
              <p>Masukkan Link/File Materi</p>
              <button class="btn-input-detail" data-target="materi">Input Materi</button>
            </div>
            <div class="detail-card absensi-card">
              <h3>Absensi</h3>
              <p>Pencatatan Kehadiran Santri</p>
              <button class="btn-input-detail" data-target="absensi">Absen Santri</button>
            </div>
            <div class="detail-card tugas-card">
              <h3>Tugas</h3>
              <p>Masukkan Link/File Tugas</p>
              <button class="btn-input-detail" data-target="tugas">Input Tugas</button>
            </div>
            <button class="btn-simpan-absensi-pengajar btn-absen-pengajar" data-jadwal-id="${j.id_jadwal ?? j.id}">
                Simpan (Absen Pengajar)
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

/* ======================================================
   LOAD absensi santri for a kelasId & tanggal (render absensiBody)
====================================================== */
async function loadAbsensiSantriFor(kelasId, tanggal) {
  const tbody = document.getElementById("absensiBody");
  if (!tbody) return;

  if (!kelasId) {
    tbody.innerHTML = `<tr><td colspan="4">Pilih kelas terlebih dahulu.</td></tr>`;
    return;
  }

  const detail = await loadKelasDetailForPengajar(kelasId);
  if (!detail || !Array.isArray(detail.santri) || detail.santri.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Belum ada santri di kelas ini.</td></tr>`;
    window._jadwalUtama = null;
    const title = document.querySelector(".absensi-info-bar h3");
    const time = document.querySelector(".absensi-info-bar span");
    if (title) title.textContent = "Absen Hari ";
    if (time) time.textContent = "";
    return;
  }

  tbody.innerHTML = "";
  detail.santri.forEach((s, idx) => {
    const idSantri = s.id_santri ?? s.id ?? "";
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${s.nama ?? "-"}</td>
        <td>
          <select class="status-select" data-santri-id="${idSantri}">
            <option value="Hadir">Hadir</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Mustamiah">Mustamiah</option>
            <option value="Alpha">Alpha</option>
          </select>
        </td>
        <td>
          <input type="text" class="input-catatan" data-santri-id="${idSantri}" placeholder="-">
        </td>
      </tr>
    `;
  });

  window._jadwalUtama = (detail.jadwal && detail.jadwal.length) ? detail.jadwal[0] : null;
  const headerTitle = document.querySelector(".absensi-info-bar h3");
  const headerTime = document.querySelector(".absensi-info-bar span");
  if (window._jadwalUtama) {
    if (headerTitle) headerTitle.textContent = `Absen Hari ${window._jadwalUtama.hari ?? ""}`;
    if (headerTime) headerTime.textContent = `${window._jadwalUtama.jam_mulai ?? ""} - ${window._jadwalUtama.jam_selesai ?? ""}`;
  } else {
    if (headerTitle) headerTitle.textContent = `Absen Hari `;
    if (headerTime) headerTime.textContent = "";
  }
}

/* ======================================================
   Save absensi santri (POST /absensi/santri) - per santri
====================================================== */
async function postAbsensiPengajar(id_jadwal) {
  console.log("==== MULAI ABSEN PENGAJAR ====");

  if (!id_jadwal) {
    alert("id_jadwal diperlukan.");
    return;
  }

  try {
    // Ambil profil dari /me
    const me = await fetchJSON(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    console.log("DATA /me:", me);

    const id_pengajar = me?.profile?.id_pengajar ?? me?.id_pengajar ?? null;
    console.log("ID PENGAJAR:", id_pengajar);

    if (!id_pengajar) {
      alert("ID Pengajar tidak ditemukan di /me");
      return;
    }

    const payload = {
      id_pengajar: Number(id_pengajar),
      id_jadwal: Number(id_jadwal),
      tanggal: new Date().toISOString().split("T")[0],
      status_absensi: "Hadir",
      catatan: "Mengajar sesuai jadwal"
    };

    console.log("PAYLOAD DIKIRIM:", payload);

    const result = await fetchJSON(`${BASE_URL}/absensi/pengajar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });

    console.log("RESPON SERVER:", result);

    alert("Absensi Pengajar berhasil dicatat.");

  } catch (err) {
    console.error("ERROR SAAT ABSEN:", err);
    alert("Gagal mencatat absensi (lihat console).");
  }
}

async function saveAbsensiSantri() {
  const token = getToken();
  if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

  const jadwal = window._jadwalUtama;
  if (!jadwal) return alert("Jadwal tidak ditemukan. Pilih kelas yang memiliki jadwal terlebih dahulu.");

  const tanggal = (document.querySelector("#absensi-content input[type='date']")?.value) || new Date().toISOString().split("T")[0];
  const rows = document.querySelectorAll("#absensiBody tr");
  if (!rows || rows.length === 0) return alert("Tidak ada santri untuk disimpan.");

  const btn = document.getElementById("btnSimpanAbsensi");
  if (btn) { btn.disabled = true; btn.textContent = "Menyimpan..."; }

  try {
    for (let row of rows) {
      const select = row.querySelector(".status-select");
      const input = row.querySelector(".input-catatan");
      if (!select) continue;
      const id_santri = select.dataset.santriId;
      const payload = {
        id_santri: Number(id_santri),
        id_jadwal: jadwal.id_jadwal ?? jadwal.id,
        tanggal,
        status_absensi: select.value,
        catatan: input?.value || ""
      };
      try {
        await fetchJSON(`${BASE_URL}/absensi/santri`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn("Gagal simpan absensi untuk santri:", id_santri, e);
      }
    }
    alert("Absensi Santri berhasil disimpan.");
  } catch (err) {
    console.error("Error saat menyimpan absensi:", err);
    alert("Terjadi kesalahan saat menyimpan. Cek console.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Simpan Absensi"; }
  }
}

/* ======================================================
   POST absensi pengajar (FINAL – SESUAI HTML KAMU)
====================================================== */
async function simpanAbsensiPengajar() {
  console.log("👉 simpanAbsensiPengajar() dipanggil");

  const status = document.getElementById("statusAbsensiPengajar")?.value;
  const kelasId = document.getElementById("kelasSelect")?.value;
  const tanggal = document.getElementById("tanggalAbsensiPengajar")?.value;

  if (!status) return alert("Pilih status kehadiran.");
  if (!kelasId) return alert("Pilih kelas.");
  if (!tanggal) return alert("Pilih tanggal.");

  // --- Ambil ID Pengajar dari /me ---
  const me = await fetchJSON(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  const id_pengajar = me?.profile?.id_pengajar;
  if (!id_pengajar) {
    console.error("❌ id_pengajar tidak ditemukan di /me", me);
    return alert("ID Pengajar tidak ditemukan. Silakan login ulang.");
  }

  // --- Ambil jadwal pengajar ---
  const semuaJadwal = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  if (!semuaJadwal || semuaJadwal.length === 0)
    return alert("Tidak ada jadwal untuk pengajar ini.");

  // --- Cocokkan hari berdasarkan tanggal ---
  const hariTanggal = new Date(tanggal)
    .toLocaleDateString("id-ID", { weekday: "long" })
    .toLowerCase();

  const jadwalHariIni = semuaJadwal.find(
    j => j.hari?.toLowerCase() === hariTanggal
  );

  if (!jadwalHariIni) {
    console.warn("❌ Jadwal tidak ditemukan untuk hari:", hariTanggal);
    return alert(`Tidak ada jadwal pada hari ${hariTanggal}`);
  }

  const id_jadwal = jadwalHariIni.id_jadwal;

  console.log("📌 DATA DIKIRIM:", {
    id_pengajar,
    id_jadwal,
    tanggal,
    status
  });

  // --- Kirim ke backend ---
  await fetchJSON(`${BASE_URL}/absensi/pengajar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      id_pengajar,
      id_jadwal,
      tanggal,
      status_absensi: status,
      catatan: "Absensi pengajar"
    })
  });

  document.getElementById("absenPengajarInfo").textContent =
    `${status} (${tanggal})`;

  alert("Absensi Pengajar berhasil disimpan.");
}


/* ======================================================
   Riwayat absensi (GET /absensi/santri/kelas/me)
====================================================== */
async function loadRiwayatAbsensi() {
  try {
    const data = await fetchJSON(`${BASE_URL}/absensi/santri/kelas/me`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const list = Array.isArray(data) ? data : (data ? [data] : []);
    renderRiwayatAbsensi(list);
  } catch (err) {
    console.error("loadRiwayatAbsensi error:", err);
    const tbody = document.getElementById("riwayatBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5">Gagal memuat riwayat. Cek console.</td></tr>`;
  }
}

function renderRiwayatAbsensi(list) {
  const tbody = document.getElementById("riwayatBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!Array.isArray(list) || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Belum ada riwayat absensi.</td></tr>`;
    return;
  }
  list.forEach((item, idx) => {
    const tanggal = item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID") : "-";
    const jam = item.jam_mulai ? `${item.jam_mulai} - ${item.jam_selesai ?? "-"}` : "-";
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.hari ?? "-"}, ${tanggal}</td>
        <td>${jam}</td>
        <td>${item.status_absensi ?? "-"}</td>
        <td>${item.catatan ?? "-"}</td>
      </tr>
    `;
  });
}

/* ======================================================
   loadPageJadwalFor(kelasId) - we use jadwal/pengajar/me (no kelas param supported)
====================================================== */
async function loadPageJadwalFor(kelasId) {
  try {
    // If backend supports kelas-specific jadwal endpoint, you can call it instead.
    const jadwal = await fetchJSON(`${BASE_URL}/jadwal/pengajar/me`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    renderPageJadwal(jadwal);
  } catch (err) {
    console.error("loadPageJadwalFor error:", err);
    const tb = document.getElementById("table_jadwal");
    if (tb) tb.innerHTML = `<tr><td colspan="6">Gagal memuat jadwal. Cek console.</td></tr>`;
  }
}

/* ======================================================
   Event wiring - nav, selects, buttons
====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // nav
  document.querySelectorAll(".nav-item").forEach(nav => {
    nav.addEventListener("click", async () => {
      const target = nav.getAttribute("data-content-id");
      if (target === "jadwal-content") {
        await populateClassSelects();
        setTodayToDateInputs();
        const kelasSel = document.querySelector("#jadwal-content .filter-group select.custom-select");
        const kelasId = kelasSel?.value ?? window._selectedKelasId;
        await loadPageJadwalFor(kelasId);
        showSectionById("jadwal-content");
      } else if (target === "absensi-content") {
        await populateClassSelects();
        setTodayToDateInputs();
        const kelasSel = document.querySelector("#absensi-content .filter-group select.custom-select");
        const kelasId = kelasSel?.value ?? window._selectedKelasId;
        const tanggal = document.querySelector("#absensi-content input[type='date']")?.value;
        await loadAbsensiSantriFor(kelasId, tanggal);
        showSectionById("absensi-content");
      } else {
        showSectionById("dashboard-content");
      }
    });
  });

  // dynamic click: detail toggle / absen pengajar
  document.body.addEventListener("click", (e) => {
    // toggle detail buttons
    if (e.target.matches(".btn-detail")) {
      const idx = e.target.getAttribute("data-detail-index");
      const row = document.getElementById(`detail-${idx}`);
      if (row) row.style.display = row.style.display === "none" ? "table-row" : "none";
    }

    // absen pengajar (button inside jadwal detail)
    if (e.target.matches(".btn-absen-pengajar")) {
      const id = e.target.dataset.jadwalId;
      postAbsensiPengajar(id);
    }
  });

  // selects and date change handling (delegated)
  document.addEventListener("change", async (e) => {
    // absensi kelas select change
    const absKelasSel = document.querySelector("#absensi-content .filter-group select.custom-select");
    if (e.target === absKelasSel) {
      window._selectedKelasId = e.target.value;
      const tanggal = document.querySelector("#absensi-content input[type='date']")?.value;
      await loadAbsensiSantriFor(e.target.value, tanggal);
      return;
    }

    // absensi date change
    const absDate = document.querySelector("#absensi-content input[type='date']");
    if (e.target === absDate) {
      const kelasId = window._selectedKelasId;
      await loadAbsensiSantriFor(kelasId, e.target.value);
      return;
    }

    // jadwal select change
    const jadKelasSel = document.querySelector("#jadwal-content .filter-group select.custom-select");
    if (e.target === jadKelasSel) {
      window._selectedKelasId = e.target.value;
      await loadPageJadwalFor(e.target.value);
      return;
    }
  });

  // save absensi button
  const btnSave = document.getElementById("btnSimpanAbsensi");
  if (btnSave) btnSave.addEventListener("click", saveAbsensiSantri);

  // view riwayat
  const viewRiway = document.getElementById("btnViewRiwayat");
  if (viewRiway) viewRiway.addEventListener("click", async () => {
    showSectionById("riwayat-kehadiran-content");
    await loadRiwayatAbsensi();
  });

  // back button
  const btnBack = document.getElementById("btnKembali");
  if (btnBack) btnBack.addEventListener("click", () => showSectionById("absensi-content"));

    // === SIMPAN ABSENSI PENGAJAR ===
    const btnSimpanPengajar = document.getElementById("simpanAbsenPengajar");
    if (btnSimpanPengajar) {
      btnSimpanPengajar.addEventListener("click", () => {
        console.log("👉 Tombol SIMPAN ABSEN PENGAJAR diklik");
        simpanAbsensiPengajar();
      });
    }
  
});


/* ======================================================
   Helper: show a section by id (hide others)
====================================================== */
function showSectionById(id) {
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

/* ======================================================
   INIT: run once on load
====================================================== */
(async function init() {
  try {
    clearPlaceholders();
    setTodayToDateInputs();
    await populateClassSelects();
    await loadPengajarData();
    await loadPengajarName();
    // default to dashboard (unless hash asks otherwise)
    const hash = location.hash.replace("#", "");
    if (hash === "jadwal") {
      document.querySelector("[data-content-id='jadwal-content']")?.click();
    } else if (hash === "absensi") {
      document.querySelector("[data-content-id='absensi-content']")?.click();
    } else {
      showSectionById("dashboard-content");
    }
    console.log("pengajar.js init done");
  } catch (err) {
    console.error("Init error:", err);
  }
})();


/* ======================================================
   INIT AWAL
====================================================== */
  loadPengajarData();


/* pengajar.js --- behavior untuk dashboard pengajar */
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM references ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const mainTitle = document.getElementById('main-title');
    const userNameEl = document.querySelector('.user-name');
  
    // modals & elements
    const catatanModal = document.getElementById('catatanModal');
    const saveNoteButton = document.getElementById('saveNoteButton');
    const classNoteInput = document.getElementById('classNoteInput');
    const btnTambahCatatan = document.querySelector('.btn-tambah-catatan');
  
    const fileInputModal = document.getElementById('fileInputModal');
    const linkTextInput = document.getElementById('linkTextInput');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const customFileUploadButton = document.getElementById('customFileUploadButton');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const simpanFileInputButton = document.getElementById('simpanFileInputButton');
    const closeFileInputModal = document.getElementById('closeFileInputModal');
  
    const konfirmasiModal = document.getElementById('konfirmasiModal');
    const simpanAbsenBtn = document.getElementById('btnSimpanAbsensi');
    const lanjutkanSimpanButton = document.getElementById('lanjutkanSimpanButton');
    const batalSimpanButton = document.getElementById('batalSimpanButton');
    const closeKonfirmasiButton = document.getElementById('closeKonfirmasi');
  
    const btnViewRiwayat = document.getElementById('btnViewRiwayat');
    const riwayatBody = document.getElementById('riwayatBody');
  
    const absenPengajarSelect = document.getElementById('absenPengajarSelect');
    const simpanAbsenPengajarBtn = document.getElementById('simpanAbsenPengajar');
    const absenPengajarInfo = document.getElementById('absenPengajarInfo');
  
    const toast = document.getElementById('toastNotification');

    // helper: toast
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(()=> toast.classList.remove('show'), 2500);
    }
  
    // helper: sanitize URL
    function sanitizeURL(url){
      if(!url) return '#';
      if(url.startsWith('http') || url.startsWith('/')) return url;
      return 'http://' + url;
    }
  
    // load name from localStorage if set
    const namaUser = localStorage.getItem('namaUser');
    if(namaUser){
      userNameEl.textContent = namaUser;
    }
  
    // --- NAVIGATION ---
    navItems.forEach(item=>{
      item.addEventListener('click', e=>{
        e.preventDefault();
        const id = item.getAttribute('data-content-id');
        navItems.forEach(n=> n.classList.remove('active'));
        item.classList.add('active');
        sections.forEach(s=> s.classList.remove('active'));
        const target = document.getElementById(id);
        if(target){
          target.classList.add('active');
          mainTitle.textContent = item.querySelector('span').textContent;
        }
      });
    });
  
    // --- Toggle detail rows (ONLY for jadwal pages where Detail buttons exist) ---
    const detailToggles = document.querySelectorAll('.btn-toggle');
    detailToggles.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const targetClass = btn.getAttribute('data-target');
        const targetRow = document.querySelector(`.${targetClass}`);
        if(!targetRow) return;
        targetRow.classList.toggle('active');
        btn.textContent = targetRow.classList.contains('active') ? 'Tutup' : 'Detail';
      });
    });
  
    // --- file input modal logic (used for materi/absensi/tugas) ---
    let currentDetailCell = null;
    let currentSaveButton = null;
  
    // open custom file dialog
    if(customFileUploadButton){
      customFileUploadButton.addEventListener('click', ()=> {
        fileUploadInput.click();
      });
    }
  
    if(fileUploadInput){
      fileUploadInput.addEventListener('change', ()=>{
        if(fileUploadInput.files.length > 0){
          fileNameDisplay.textContent = fileUploadInput.files[0].name;
          fileNameDisplay.style.color = 'var(--dark-green)';
        } else {
          fileNameDisplay.textContent = 'Belum ada file dipilih.';
          fileNameDisplay.style.color = '#777';
        }
      });
    }
  
    // delegate clicks to link-text-trigger (open modal to edit)
    document.addEventListener('click', e=>{
      const el = e.target;
      // open file modal when clicking .link-text-trigger
      const trigger = el.closest('.link-text-trigger');
      if(trigger){
        e.preventDefault();
        currentDetailCell = trigger.closest('.detail-item');
        currentSaveButton = currentDetailCell.querySelector('.btn-materi, .btn-absensi, .btn-tugas');
  
        // load existing content
        const link = trigger.querySelector('a');
        if(link){
          linkTextInput.value = link.getAttribute('href') || link.textContent || '';
        } else {
          const txt = trigger.textContent.trim();
          linkTextInput.value = (txt.includes('Masukkan Link') ? '' : txt);
        }
        // reset file input UI
        fileUploadInput.value = '';
        fileNameDisplay.textContent = 'Belum ada file dipilih.';
        fileNameDisplay.style.color = '#777';
        // show modal
        fileInputModal.style.display = 'block';
      }
  
      // handle delete buttons in detail (status-hapus)
      if(el.matches('.btn-materi.status-hapus, .btn-absensi.status-hapus, .btn-tugas.status-hapus')){
        e.preventDefault();
        const detailItem = el.closest('.detail-item');
        const linkTrigger = detailItem.querySelector('.link-text-trigger');
        // reset
        linkTrigger.innerHTML = 'Masukkan Link/File Materi';
        el.textContent = 'kosong';
        el.classList.remove('status-hapus');
        el.classList.add('status-kosong');
        showToast('File berhasil dihapus.');
      }
    });
  
    // save file/link from modal
    if(simpanFileInputButton){
      simpanFileInputButton.addEventListener('click', ()=>{
        const textValue = linkTextInput.value.trim();
        const file = fileUploadInput.files.length ? fileUploadInput.files[0] : null;
  
        if(!currentDetailCell){
          showToast('Tidak ada target.');
          return;
        }
  
        let newContentHtml = '';
        if(file){
          const fname = file.name;
          // in real app you'd upload; here we simulate with a link to /materi/
          newContentHtml = `<a href="/materi/${fname}" download="${fname}" target="_blank">${fname}</a>`;
        } else if(textValue){
          const url = sanitizeURL(textValue);
          newContentHtml = `<a href="${url}" target="_blank">${textValue}</a>`;
        } else {
          showToast('Belum ada file atau link yang diisi.');
          return;
        }
  
        const linkTrigger = currentDetailCell.querySelector('.link-text-trigger');
        linkTrigger.innerHTML = newContentHtml;
  
        // change save button to Hapus
        if(currentSaveButton){
          currentSaveButton.textContent = 'Hapus';
          currentSaveButton.classList.remove('status-kosong');
          currentSaveButton.classList.add('status-hapus');
        }
  
        // close modal & reset
        fileInputModal.style.display = 'none';
        linkTextInput.value = '';
        if(fileUploadInput) fileUploadInput.value = '';
  
        showToast('Tersimpan');
      });
    }
  
    if(closeFileInputModal){
      closeFileInputModal.addEventListener('click', ()=> fileInputModal.style.display = 'none');
    }
  
    // close modals on click outside
    window.onclick = function(ev){
      if(ev.target === fileInputModal) fileInputModal.style.display = 'none';
      if(ev.target === catatanModal) {
        if(classNoteInput && classNoteInput.value.trim() !== ''){
          if(!confirm('Anda memiliki catatan yang belum disimpan. Tetap tutup?')) return;
        }
        catatanModal.style.display = 'none';
      }
      if(ev.target === konfirmasiModal) konfirmasiModal.style.display = 'none';
    };
  
    // --- Tambah catatan modal ---
    if(btnTambahCatatan){
      btnTambahCatatan.addEventListener('click', ()=> catatanModal.style.display = 'block');
    }
    if(saveNoteButton){
      saveNoteButton.addEventListener('click', ()=> {
        const note = classNoteInput.value.trim();
        if(!note){
          showToast('Isi catatan terlebih dahulu.');
          return;
        }
        // Simulasi simpan: gunakan localStorage 'catatanKelas'
        const today = new Date().toLocaleDateString('id-ID');
        const all = JSON.parse(localStorage.getItem('catatanKelas')||'[]');
        all.push({ tanggal: today, note });
        localStorage.setItem('catatanKelas', JSON.stringify(all));
        classNoteInput.value = '';
        catatanModal.style.display = 'none';
        showToast('Catatan tersimpan.');
      });
    }
  
    // --- Absensi Pengajar Hari Ini (panel) ---
    if(simpanAbsenPengajarBtn){
      simpanAbsenPengajarBtn.addEventListener('click', ()=>{
        const status = absenPengajarSelect.value;
        if(!status){
          showToast('Pilih status kehadiran pengajar.');
          return;
        }
        const today = new Date().toLocaleDateString('id-ID');
        const timeNow = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
        const record = { tanggal: today, jam: timeNow, status };
  
        // store single latest
        localStorage.setItem('kehadiranPengajar', JSON.stringify(record));
  
        // also store in per-jadwal history with key kehadiranPengajarPerJadwal when appropriate
        let per = JSON.parse(localStorage.getItem('kehadiranPengajarPerJadwal')||'[]');
        per.push(Object.assign({ jenis:'manual-panel' }, record));
        localStorage.setItem('kehadiranPengajarPerJadwal', JSON.stringify(per));
  
        absenPengajarInfo.textContent = `${status} (${today})`;
        showToast('Absensi pengajar tersimpan.');
      });
    }
  
    // show stored pengajar absen on load if any
    (function showStoredPengajar(){
      const d = JSON.parse(localStorage.getItem('kehadiranPengajar')||'null');
      if(d){
        absenPengajarInfo.textContent = `${d.status} (${d.tanggal})`;
      }
    })();
  
    // --- When teacher clicks "Simpan (Absen Pengajar)" inside a jadwal detail ---
    const btnAbsenPengajarList = document.querySelectorAll('.btn-absen-pengajar');
    btnAbsenPengajarList.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const jadwalID = btn.dataset.jadwal || 'unknown';
        const row = btn.closest('tr').previousElementSibling; // main row typically
        // jam: read from the main-row (if exists)
        let jam = '';
        const mainRow = btn.closest('tr').previousElementSibling;
        if(mainRow && mainRow.children.length>1){
          jam = mainRow.children[1].textContent || '';
        } else {
          jam = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
        }
        const today = new Date().toLocaleDateString('id-ID');
        const rec = { jadwalID, tanggal: today, jam, status: 'Hadir', by: 'pengajar' };
  
        // append to kehadiranPengajarPerJadwal
        let arr = JSON.parse(localStorage.getItem('kehadiranPengajarPerJadwal')||'[]');
        arr.push(rec);
        localStorage.setItem('kehadiranPengajarPerJadwal', JSON.stringify(arr));
  
        showToast('Kehadiran pengajar tersimpan untuk jadwal ini.');
      });
    });
  
    // --- Simpan Absensi Santri (global) ---
    if(simpanAbsenBtn){
      simpanAbsenBtn.addEventListener('click', ()=>{
        // open konfirmasi modal
        konfirmasiModal.style.display = 'block';
      });
    }
    if(lanjutkanSimpanButton){
      lanjutkanSimpanButton.addEventListener('click', ()=>{
        // gather absensi table data - basic simulation
        const rows = document.querySelectorAll('.absensi-harian-table tbody tr');
        const saved = [];
        rows.forEach((r,i)=>{
          const nama = r.children[1].textContent;
          const status = r.querySelector('.status-select').value;
          const catatan = r.querySelector('.input-catatan').value;
          saved.push({ no: i+1, nama, status, catatan, tanggal: new Date().toLocaleDateString('id-ID') });
        });
        // save to localStorage
        let all = JSON.parse(localStorage.getItem('absensiSantri')||'[]');
        all = all.concat(saved);
        localStorage.setItem('absensiSantri', JSON.stringify(all));
        konfirmasiModal.style.display = 'none';
        showToast('Absensi santri berhasil disimpan.');
      });
    }
    if(batalSimpanButton){
      batalSimpanButton.addEventListener('click', ()=>{
        konfirmasiModal.style.display = 'none';
        showToast('Penyimpanan dibatalkan.');
      });
    }
    if(closeKonfirmasiButton){
      closeKonfirmasiButton.addEventListener('click', ()=> konfirmasiModal.style.display = 'none');
    }
  
    // --- Lihat riwayat (button) ---
    if(btnViewRiwayat){
      btnViewRiwayat.addEventListener('click', ()=>{
        // switch to riwayat section
        document.querySelectorAll('.content-section').forEach(s=> s.classList.remove('active'));
        const rsec = document.getElementById('riwayat-kehadiran-content');
        if(rsec) rsec.classList.add('active');
        // update side nav active
        document.querySelectorAll('.nav-item').forEach(n=> n.classList.remove('active'));
        // highlight Absensi item (so the nav shows that riwayat comes from Absensi)
        const absNav = document.querySelector('[data-content-id="absensi-content"]');
        if(absNav) absNav.classList.add('active');
        // load riwayat
        loadRiwayat();
        mainTitle.textContent = 'Riwayat Kehadiran';
      });
    }
  
    // --- load riwayat to table ---
    function loadRiwayat(){
      const per = JSON.parse(localStorage.getItem('kehadiranPengajarPerJadwal')||'[]');
      const absensiSantri = JSON.parse(localStorage.getItem('absensiSantri')||'[]');
      riwayatBody.innerHTML = '';
  
      // show pengajar records first
      per.forEach((r, idx)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx+1}</td><td>${r.tanggal}</td><td>${r.jam||'-'}</td><td>${r.status||'-'}</td><td>${r.keterangan||'-'}</td>`;
        riwayatBody.appendChild(tr);
      });
  
      // then show a few santri absensi if any (optional)
      const startIdx = per.length;
      absensiSantri.forEach((r,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${startIdx + i +1}</td><td>${r.tanggal}</td><td>-</td><td>${r.status}</td><td>${r.nama}</td>`;
        riwayatBody.appendChild(tr);
      });
  
      if(per.length===0 && absensiSantri.length===0){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center;color:#666">Belum ada riwayat.</td>`;
        riwayatBody.appendChild(tr);
      }
    }
  
    // auto-load riwayat when opening riwayat section through nav (if clicked)
    document.querySelectorAll('[data-content-id="riwayat-kehadiran-content"]').forEach(n=>{
      n.addEventListener('click', ()=> loadRiwayat());
    });
  
    // --- ADDED: Kembali button handler (Riwayat -> Absensi) ---
    // ADDED
    const btnKembali = document.getElementById('btnKembali');
    if (btnKembali) {
      btnKembali.addEventListener('click', () => {
        // hide all sections
        sections.forEach(s => s.classList.remove('active'));
        // show absensi section
        const absensi = document.getElementById('absensi-content');
        if (absensi) absensi.classList.add('active');
        // update header/title
        mainTitle.textContent = 'Absensi';
        // update nav active to Absensi
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const absNav = document.querySelector('[data-content-id="absensi-content"]');
        if (absNav) absNav.classList.add('active');
      });
    }
  
    // done
  }); // DOMContentLoaded end