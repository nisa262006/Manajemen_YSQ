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
