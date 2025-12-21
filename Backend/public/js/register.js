document.getElementById("registrationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama_lengkap").value.trim();
  const email = document.getElementById("email").value.trim();
  const no_wa = document.getElementById("nomor_telepon").value.trim();
  const tempat_lahir = document.getElementById("tempat_lahir").value.trim();
  const tanggal_lahir = document.getElementById("tanggal_lahir").value;
  const alamat = document.getElementById("alamat").value.trim();

  // Validasi sederhana
  if (!nama || !email || !no_wa || !tempat_lahir || !tanggal_lahir || !alamat) {
    alert("Semua field wajib diisi!");
    return;
  }

  try {
    const res = await fetch("/api/pendaftar/daftar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nama,
        email,
        alamat,
        no_wa,
        tempat_lahir,
        tanggal_lahir
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Pendaftaran gagal");
      console.error("ERROR RESPONSE:", data);
      return;
    }

    // Redirect ke halaman sukses
    window.location.href = "/berhasil";

  } catch (err) {
    alert("Server tidak merespons");
    console.error("ERROR FETCH:", err);
  }
});
