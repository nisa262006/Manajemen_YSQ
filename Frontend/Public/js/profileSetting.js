import { apiGet, apiPut } from "./apiService.js";

const $ = (id) => document.getElementById(id);

// ===============
// Load Profile
// ===============
async function loadProfile() {
    try {
        // Ambil user login
        const me = await apiGet("/me");

        if (!me.success || !me.profile) return;

        const idAdmin = me.profile.id_admin;
        window._currentAdminId = idAdmin;

        // Ambil data admin
        const profile = await apiGet(`/admin/profile/${idAdmin}`);

        if (!profile.data) return;

        const p = profile.data;

        // Isi popup
        if ($("profile-name-input")) $("profile-name-input").value = p.nama || "";
        if ($("profile-email-input")) $("profile-email-input").value = p.email || "";
        if ($("profile-phone-input")) $("profile-phone-input").value = p.no_wa || "";

    } catch (err) {
        console.error("Gagal load profile:", err);
    }
}


// ===============
// OPEN / CLOSE POPUP
// ===============

// Open ketika tombol settings ditekan
document.addEventListener("click", (e) => {
    if (e.target.closest(".setting")) {
        $("popup-profile-setting").style.display = "flex";
        loadProfile();
    }
});

// Close popup
["btn-close-profil-x", "btn-cancel-profil"].forEach((id) => {
    if ($(id)) {
        $(id).onclick = () => {
            $("popup-profile-setting").style.display = "none";
        };
    }
});


// ===============
// SIMPAN PERUBAHAN
// ===============
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

            alert("Profil berhasil diperbarui");

            $("popup-profile-setting").style.display = "none";

        } catch (err) {
            console.error(err);
            alert("Gagal memperbarui profil");
        }
    };
}


// ===============
// INIT
// ===============
document.addEventListener("DOMContentLoaded", () => {
    loadProfile(); // auto-load saat halaman dibuka
});
