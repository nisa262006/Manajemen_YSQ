document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama_lengkap").value;
  const email = document.getElementById("email").value;
  const no_wa = document.getElementById("nomor_telepon").value;
  const tempat_lahir = document.getElementById("tempat_lahir").value;
  const tanggal_lahir = document.getElementById("tanggal_lahir").value;

  try {
      const res = await fetch("http://localhost:5000/pendaftar/daftar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              nama,
              email,
              no_wa,
              tempat_lahir,
              tanggal_lahir
          })
      });

      const data = await res.json();

      if (!res.ok) {
          alert(data.message || "Pendaftaran gagal!");
          return;
      }

      // Jika sukses → ke halaman pemberitahuan
      window.location.href = "./berhasil.html";

  } catch (err) {
      alert("Tidak dapat terhubung ke server");
  }
});
