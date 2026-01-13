import { apiGet, apiPut } from "./apiService.js";

const $ = (id) => document.getElementById(id);

/* ============================================================
   DEV TOAST (HANYA UNTUK HALAMAN DEV)
============================================================ */
function getOrCreateDevToast() {
    let el = document.getElementById("dev-toast");
    if (!el) {
        el = document.createElement("div");
        el.id = "dev-toast";
        document.body.appendChild(el);
    }
    return el;
}

function showDevToast(msg) {
    const el = getOrCreateDevToast();
    el.innerText = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
}

/* ============================================================
   GLOBAL CACHE
============================================================ */
let CURRENT_PROFILE = null;
let CURRENT_ADMIN_ID = null;

/* ============================================================
   LOAD PROFILE
============================================================ */
async function loadProfile() {
    try {
        const me = await apiGet("/me");
        if (!me?.profile?.id_admin) return;

        CURRENT_ADMIN_ID = me.profile.id_admin;

        const res = await apiGet(`/admin/profile/${CURRENT_ADMIN_ID}`);
        const p = res?.data ?? res;
        if (!p) return;

        CURRENT_PROFILE = p;

        // ===== POPUP SETTING =====
        if ($("profile-name-input")) $("profile-name-input").value = p.nama || "";
        if ($("profile-email-input")) $("profile-email-input").value = p.email || "";
        if ($("profile-phone-input")) $("profile-phone-input").value = p.no_wa || "";

        // ===== MINI PROFILE =====
        if ($("mini-card-name")) $("mini-card-name").innerText = p.nama || "-";
        if ($("mini-card-email")) $("mini-card-email").innerText = p.email || "-";
        if ($("mini-card-phone")) $("mini-card-phone").innerText = p.no_wa || "-";

        document.querySelectorAll(".profile-avatar-mini, .profile-avatar-large")
            .forEach(el => el.innerText = (p.nama || "A")[0].toUpperCase());

    } catch (err) {
        console.error("Load profile gagal:", err);
    }
}

/* ============================================================
   OPEN / CLOSE POPUP SETTING
============================================================ */
document.addEventListener("click", (e) => {
    const btnSetting = e.target.closest(".setting");
    if (!btnSetting) return;

    const popup = $("popup-profile-setting");
    if (!popup) return;

    popup.style.display = "flex";
    loadProfile();
});

["btn-close-profil-x", "btn-cancel-profil"].forEach((id) => {
    const el = $(id);
    if (el) {
        el.onclick = () => {
            $("popup-profile-setting").style.display = "none";
        };
    }
});

/* ============================================================
   SAVE PROFILE (TANPA NOTIF)
============================================================ */
if ($("btn-simpan-profil")) {
    $("btn-simpan-profil").onclick = async () => {
        try {
            if (!CURRENT_ADMIN_ID) return;

            const payload = {
                nama: $("profile-name-input").value,
                email: $("profile-email-input").value,
                no_wa: $("profile-phone-input").value
            };

            await apiPut(`/admin/profile/${CURRENT_ADMIN_ID}`, payload);

            // Update cache & UI
            CURRENT_PROFILE = { ...CURRENT_PROFILE, ...payload };

            if ($("mini-card-name")) $("mini-card-name").innerText = payload.nama;
            if ($("mini-card-email")) $("mini-card-email").innerText = payload.email;
            if ($("mini-card-phone")) $("mini-card-phone").innerText = payload.no_wa;

            document.querySelectorAll(".profile-avatar-mini, .profile-avatar-large")
                .forEach(el => el.innerText = payload.nama[0].toUpperCase());

            $("popup-profile-setting").style.display = "none";

        } catch (err) {
            console.error("Update profile gagal:", err);
        }
    };
}

/* ============================================================
   POPUP MINI PROFILE
============================================================ */
document.addEventListener("click", (e) => {
    const icon = e.target.closest("#dashboard-admin-icon");
    const popup = $("popup-profile-mini");

    if (!popup) return;

    if (icon) {
        popup.classList.toggle("show");
        return;
    }

    if (!popup.contains(e.target)) {
        popup.classList.remove("show");
    }
});

/* ============================================================
   NOTIF HALAMAN BELUM TERSEDIA
============================================================ */
document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dev='true']");
    if (!btn) return;
    e.preventDefault();
    showDevToast("Halaman ini sedang dalam pengembangan");
});

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", loadProfile);

window.toggleMiniProfil = async () => {
  const card = document.getElementById("miniProfilCard");
  card.style.display = card.style.display === "block" ? "none" : "block";

  const me = await apiGet("/api/me");

  document.getElementById("mini-nama").innerText = me.nama;
  document.getElementById("mini-email").innerText = me.email;
  document.getElementById("mini-phone").innerText = me.no_hp;
};

window.handleSimpanProfil = async () => {
  const body = {
    nama: document.getElementById("input-nama").value,
    email: document.getElementById("input-email").value,
    no_hp: document.getElementById("input-wa").value,
  };

  await apiPut("/api/me", body);
  alert("Profil berhasil diperbarui");
};


/* ======================================================
    LOGIKA PROFIL (Header, Mini Profile & Pengaturan)
====================================================== */

// 1. Memuat Data Profil dari Server
async function loadProfileData() {
    try {
        // Panggil API /me (Hapus '/api' jika apiService sudah menambahkannya otomatis)
        const res = await apiGet("/me"); 
        const p = res.profile || res; // Sesuai struktur response backend

        // Update Nama di Header & Sidebar
        document.querySelectorAll(".user-name").forEach(el => {
            el.textContent = p.nama || "Pengajar";
        });

        // Update Popup Mini Profile
        if (document.getElementById("mini-nama")) {
            document.getElementById("mini-nama").textContent = p.nama || "-";
            document.getElementById("mini-email").innerHTML = `<i class="fas fa-envelope"></i> ${p.email || "-"}`;
            document.getElementById("mini-phone").innerHTML = `<i class="fab fa-whatsapp"></i> ${p.no_kontak || "-"}`;
            document.getElementById("mini-avatar-initials").textContent = (p.nama || "P").charAt(0).toUpperCase();
        }

        // Update Form di Modal Pengaturan
        if (document.getElementById("input-nama")) {
            document.getElementById("input-nama").value = p.nama || "";
            document.getElementById("input-email").value = p.email || "";
            document.getElementById("input-wa").value = p.no_kontak || "";
            document.getElementById("input-terdaftar").value = p.tanggal_terdaftar || "-";
            document.getElementById("profile-initials").textContent = (p.nama || "P").charAt(0).toUpperCase();
        }

    } catch (err) {
        console.error("Gagal memuat profil:", err);
    }
}

// 2. Toggle Popup Mini Profile
window.toggleMiniProfil = function() {
    const card = document.getElementById("miniProfilCard");
    if (card) {
        const isVisible = card.style.display === "block";
        card.style.display = isVisible ? "none" : "block";
    }
};

// 3. Membuka Modal Pengaturan
window.openProfil = function() {
    const modal = document.getElementById("profilOverlay");
    if (modal) {
        modal.style.display = "flex";
        loadProfileData(); // Refresh data saat modal dibuka
    }
};

// 4. Menutup Modal Pengaturan
window.closeModalProfil = function() {
    const modal = document.getElementById("profilOverlay");
    if (modal) modal.style.display = "none";
};

// 5. Simpan Perubahan Profil
window.handleSimpanProfil = async function() {
    const nama = document.getElementById("input-nama").value;
    const no_kontak = document.getElementById("input-wa").value;

    try {
        // Ganti URL sesuai endpoint backend Anda
        await apiPut("/update-profil-pengajar", { nama, no_kontak });
        
        alert("Profil berhasil diperbarui!");
        closeModalProfil();
        loadProfileData(); // Sync ulang data ke header dan popup
    } catch (err) {
        alert("Gagal menyimpan: " + (err.message || "Terjadi kesalahan"));
    }
};

// Jalankan saat halaman pertama kali dimuat
document.addEventListener("DOMContentLoaded", loadProfileData);
