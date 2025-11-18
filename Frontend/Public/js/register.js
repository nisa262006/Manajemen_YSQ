async function submitRegister() {
    const nama = document.getElementById("nama").value;
    const email = document.getElementById("email").value;
    const no_wa = document.getElementById("no_wa").value;
    const tempat_lahir = document.getElementById("tempat_lahir").value;
    const tanggal_lahir = document.getElementById("tanggal_lahir").value;
  
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
    alert(data.message);
  
    if (res.ok) {
      window.location.href = "login.html";
    }
  }
  