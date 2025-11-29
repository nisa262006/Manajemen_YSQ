document.addEventListener("DOMContentLoaded", () => {
    loadSantriDashboard();
});

async function loadSantriDashboard() {
    const token = localStorage.getItem("token");

    if (!token) {
        return (window.location.href = "../login.html");
    }

    try {

        // ============================
        // 1. AMBIL PROFIL SANTRI
        // ============================
        const profilRes = await fetch("http://localhost:5000/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const profilJson = await profilRes.json();
        const profil = profilJson.profile;

        document.getElementById("namaSantri").textContent = profil.nama;
        document.getElementById("nisSantri").textContent = profil.nis;


        // ============================
        // 2. AMBIL KELAS SANTRI
        // ============================
        const kelasRes = await fetch("http://localhost:5000/kelas/santri/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const kelasData = await kelasRes.json();
        const kelas = kelasData[0] ?? {};

        document.getElementById("kategori-santri").textContent = kelas.kategori ?? "-";
        document.getElementById("kelas-santri").textContent = kelas.nama_kelas ?? "-";

        // ============================
        // 3. AMBIL JADWAL SANTRI
        // ============================
        const jadwalRes = await fetch("http://localhost:5000/jadwal/santri/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const jadwal = await jadwalRes.json();

        const tbody = document.getElementById("jadwal-body");
        tbody.innerHTML = "";

        if (Array.isArray(jadwal) && jadwal.length > 0) {
            // Gabungkan hari
            const hariList = jadwal.map(j => j.hari).join(", ");
            document.getElementById("jadwal-santri").textContent = hariList;

            jadwal.forEach((item, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}.</td>
                        <td>${item.kelas ?? "Tahsin"}</td>
                        <td>${item.hari ?? "-"}</td>
                        <td>${item.jam_mulai ?? "-"} - ${item.jam_selesai ?? "-"}</td>
                        <td>${item.nama_pengajar}</td>
                        <td><i class='bx bx-file'></i></td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        console.error("ERROR:", err);
        alert("Gagal memuat dashboard. Lihat console.");
    }
}
