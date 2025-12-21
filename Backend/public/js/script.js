const registerBtn = document.querySelectorAll('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const registerForm = document.querySelector('.form-box.register');
const loginForm = document.querySelector('.form-box.login');

registerBtn.forEach(btn => {
  btn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });
});

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });
}

/* ===== KEY LOCALSTORAGE ===== */
const LS = {
  PROFILE: 'ysq_profile',
  KELAS: 'ysq_kelas',
  PENGAJAR: 'ysq_pengajar'
};


function read(k) { return JSON.parse(localStorage.getItem(k) || "[]"); }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

/* ================================
    RENDER SIDEBAR PROFILE
================================ */
function renderSidebarProfile(){
  let p = JSON.parse(localStorage.getItem(LS.PROFILE) || '{}');
  document.getElementById('sidebarName').innerText = p.name || "Admin";
  document.getElementById('sidebarEmail').innerText = p.email || "";
  document.getElementById('sidebarPhone').innerText = p.phone || "";

  if(p.name){
    let avatar = p.name.split(" ").map(n=>n[0]).join("").toUpperCase();
    document.getElementById('sidebarAvatar').innerText = avatar;
  }
}

/* ================================
    RENDER TANGGAL
================================ */
function renderDate(){
  let d = new Date();
  let opt = { day:"numeric", month:"long", year:"numeric" };
  document.getElementById("todayDate").innerText = d.toLocaleDateString("id-ID", opt);
}

/* ================================
    RENDER LIST PENGAJAR KE SELECT
================================ */
function fillPengajarDropdown(){
  let list = read(LS.PENGAJAR);
  let sel = document.getElementById("k_pengajar");
  sel.innerHTML = "";

  list.forEach(p => {
    let opt = document.createElement("option");
    opt.value = p.name;
    opt.innerText = p.name;
    sel.appendChild(opt);
  });
}

/* ================================
    RENDER KELAS TABLE
================================ */
function renderKelas(){
  let kelas = read(LS.KELAS);
  let filter = document.getElementById("filterKelas").value;
  let tbody = document.querySelector("#kelasTable tbody");
  tbody.innerHTML = "";

  let nomor = 1;

  kelas.forEach(k => {
    if(filter !== "all" && k.name !== filter) return;

    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${nomor++}</td>
      <td>${k.name}</td>
      <td>${k.kapasitas}</td>
      <td>${k.kategori}</td>
      <td>${k.pengajar}</td>
      <td style="text-align:center">
        <span class="action-icon action-add" onclick="alert('Tambah siswa ke kelas belum dibuat')">➕</span>
        <span class="action-icon action-delete" onclick="deleteKelas('${k.id}')">🗑️</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ================================
    MODAL HANDLING
================================ */
function openAddKelasModal(){
  fillPengajarDropdown();
  document.getElementById("kelasModalBackdrop").style.display = "flex";
}

function closeKelasModal(){
  document.getElementById("kelasModalBackdrop").style.display = "none";
}

/* ================================
    SAVE KELAS
================================ */
function saveKelas(){
  let nama = document.getElementById("k_nama").value.trim();
  let kapasitas = document.getElementById("k_kapasitas").value.trim();
  let kategori = document.getElementById("k_kategori").value.trim();
  let awal = document.getElementById("k_awal").value.trim();
  let akhir = document.getElementById("k_akhir").value.trim();
  let pengajar = document.getElementById("k_pengajar").value;

  if(!nama){ alert("Isi nama kelas"); return; }

  let kelas = read(LS.KELAS);
  kelas.push({
    id: "k_" + Math.random().toString(36).substr(2,9),
    name: nama,
    kapasitas: kapasitas,
    kategori: kategori,
    pengajar: pengajar,
    awal: awal,
    akhir: akhir
  });

  write(LS.KELAS, kelas);

  closeKelasModal();
  renderKelas();
  fillFilterDropdown();
}

/* ================================
    DELETE KELAS
================================ */
function deleteKelas(id){
  let kelas = read(LS.KELAS).filter(k => k.id !== id);
  write(LS.KELAS, kelas);
  renderKelas();
  fillFilterDropdown();
}

/* ================================
    FILTER DROPDOWN
================================ */
function fillFilterDropdown(){
  let kelas = read(LS.KELAS);
  let sel = document.getElementById("filterKelas");

  sel.innerHTML = `<option value="all">Semua</option>`;

  kelas.forEach(k => {
    let opt = document.createElement("option");
    opt.value = k.name;
    opt.innerText = k.name;
    sel.appendChild(opt);
  });
}

/* ================================
    PROFILE MODAL
================================ */
function openProfile(){
  let p = JSON.parse(localStorage.getItem(LS.PROFILE));
  document.getElementById("profileEmail").value = p.email;
  document.getElementById("profileNama").value = p.name;
  document.getElementById("profilePhone").value = p.phone;
  document.getElementById("profileAlamat").value = p.alamat;
  document.getElementById("profileBackdrop").style.display = "flex";
}
function closeProfile(){ document.getElementById("profileBackdrop").style.display = "none"; }

function saveProfile(){
  let p = {
    email: document.getElementById("profileEmail").value,
    name: document.getElementById("profileNama").value,
    phone: document.getElementById("profilePhone").value,
    alamat: document.getElementById("profileAlamat").value
  };
  localStorage.setItem(LS.PROFILE, JSON.stringify(p));
  closeProfile();
  renderSidebarProfile();
}

/* ================================
    LOGOUT
================================ */
function logout() {
  // hapus session login (kalau ada)
  localStorage.removeItem('role');
  localStorage.removeItem('ysq_profile_active'); // jika kamu pakai penyimpanan admin aktif

  // arahkan langsung ke halaman login
  window.location.href = '../login.html';
}

/* ================================
    INIT PAGE
================================ */
window.onload = () => {
  renderSidebarProfile();
  renderDate();
  fillFilterDropdown();
  renderKelas();
};
