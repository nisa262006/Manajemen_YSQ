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
        const profilRes = await fetch("http://localhost:5000/kelas/santri/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!profilRes.ok) throw new Error("Gagal mengambil profil santri");

        const profilData = await profilRes.json();

        if (!Array.isArray(profilData) || profilData.length === 0) {
            throw new Error("Data profil tidak sesuai");
        }

        const santri = profilData[0];

        // ISI DATA PROFIL
        document.getElementById("nama-santri").textContent = santri.nama_santri ?? "-";
        document.getElementById("nis-santri").textContent = santri.nis ?? "-";
        document.getElementById("kategori-santri").textContent = santri.kategori ?? "-";
        document.getElementById("kelas-santri").textContent = santri.nama_kelas ?? "-";

        // ============================
        // 2. AMBIL JADWAL SANTRI
        // ============================
        const jadwalRes = await fetch("http://localhost:5000/jadwal/santri/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!jadwalRes.ok) throw new Error("Gagal mengambil jadwal santri");

        const jadwal = await jadwalRes.json();

        const tbody = document.getElementById("jadwal-body");
        tbody.innerHTML = "";

        if (Array.isArray(jadwal)) {
            // Gabungkan hari ke tampilan info
            const hariList = jadwal.map(j => j.hari).join(", ");
            document.getElementById("jadwal-santri").textContent = hariList;

            // Tampilkan tabel jadwal
            jadwal.forEach((item, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}.</td>
                        <td>${item.mapel ?? "Tahsin"}</td>
                        <td>${item.hari ?? "-"}</td>
                        <td>${item.jam_mulai ?? "-"} - ${item.jam_selesai ?? "-"}</td>
                        <td>${item.pengajar ?? "-"}</td>
                        <td><i class='bx bx-file'></i></td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        console.error("ERROR:", err.message);
        alert("Gagal memuat data santri. Cek console.");
    }
}
