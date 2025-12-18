document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const nama = document.getElementById("nama_lengkap").value;
    const email = document.getElementById("email").value;
    const no_wa = document.getElementById("nomor_telepon").value;
    const tempat_lahir = document.getElementById("tempat_lahir").value;
    const tanggal_lahir = document.getElementById("tanggal_lahir").value;
    const alamat = document.getElementById("alamat").value; // ✅ FIX
  
    const res = await fetch("http://localhost:5000/pendaftar/daftar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama,
        email,
        alamat,        // ✅ TERKIRIM
        no_wa,
        tempat_lahir,
        tanggal_lahir
      })
    });
  
    const data = await res.json();
    if (!res.ok) return alert(data.message);
  
    window.location.href = "./berhasil.html";
  });
  