import { apiGet, apiPut } from "./apiService.js";

const $ = (id) => document.getElementById(id);

/* ============================================================
    AUTO CREATE DEV TOAST (agar tidak error di semua halaman)
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

    setTimeout(() => {
        el.classList.remove("show");
    }, 2200);
}

/* ============================================================
                        LOAD PROFILE ADMIN
============================================================ */
async function loadProfile() {
    try {
        const me = await apiGet("/me");

        if (!me.success || !me.profile) return;

        const idAdmin = me.profile.id_admin;
        window._currentAdminId = idAdmin;

        const profile = await apiGet(`/admin/profile/${idAdmin}`);
        const p = profile.data;
        if (!p) return;

        if ($("profile-name-input")) $("profile-name-input").value = p.nama || "";
        if ($("profile-email-input")) $("profile-email-input").value = p.email || "";
        if ($("profile-phone-input")) $("profile-phone-input").value = p.no_wa || "";

    } catch (err) {
        console.error("Gagal load profile:", err);
    }
}

/* ============================================================
                OPEN / CLOSE POPUP PROFILE
============================================================ */
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".setting");
    if (!btn) return;

    if ($("popup-profile-setting")) {
        $("popup-profile-setting").style.display = "flex";
        loadProfile();
    }
});

// Tombol cancel & close
["btn-close-profil-x", "btn-cancel-profil"].forEach((id) => {
    const el = $(id);
    if (el) {
        el.onclick = () => {
            if ($("popup-profile-setting")) {
                $("popup-profile-setting").style.display = "none";
            }
        };
    }
});

/* ============================================================
                 SIMPAN PERUBAHAN PROFIL
============================================================ */
if ($("btn-simpan-profil")) {
    $("btn-simpan-profil").onclick = async () => {
        try {
            const idAdmin = window._currentAdminId;

            const payload = {
                nama: $("profile-name-input").value,
                email: $("profile-email-input").value,
                no_wa: $("profile-phone-input").value
            };

            await apiPut(`/admin/profile/${idAdmin}`, payload);

        } catch (err) {
            console.error(err);
            showDevToast("Gagal memperbarui profil.");
        }
    };
}

/* ============================================================
            NOTIFIKASI UNTUK HALAMAN DALAM PENGEMBANGAN
============================================================ */
document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dev='true']");
    if (!btn) return;

    e.preventDefault();
    showDevToast("Halaman ini sedang dalam proses pengembangan.");
});

/* ============================================================
                            INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
});
