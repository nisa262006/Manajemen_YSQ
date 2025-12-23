document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorBox.innerText = data?.message || "Login gagal";
      return;
    }

    // SIMPAN TOKEN
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("id_users", data.userId);

    // REDIRECT SESUAI ROLE
    if (data.role === "admin") {
      window.location.href = "/dashboard/Admin";
    } else if (data.role === "pengajar") {
      window.location.href = "/dashboard/pengajar";
    } else {
      window.location.href = "/dashboard/santri";
    }

  } catch (err) {
    console.error(err);
    errorBox.innerText = "Tidak dapat terhubung ke server";
  }
});

document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.querySelector('input[type="email"]').value;
  const btnSubmit = document.querySelector('button');
  
  // Indikator loading
  btnSubmit.disabled = true;
  btnSubmit.innerText = "Mengirim...";

  try {
      // PASTIKAN URL PORT SESUAI (Ganti ke 8000 jika backend di 8000)
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: email })
      });

      const result = await response.json();

      if (response.ok) {
          // NOTIFIKASI BERHASIL
          alert("✅ Berhasil! Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.");
      } else {
          // NOTIFIKASI EMAIL TIDAK TERDAFTAR (Status 404 dari controller)
          if (response.status === 404) {
              alert("❌ Maaf, email tersebut tidak terdaftar di sistem kami sebagai Santri, Pengajar, atau Admin.");
          } else {
              alert("⚠️ Gagal: " + result.message);
          }
      }
  } catch (error) {
      console.error("Error:", error);
      // NOTIFIKASI SERVER MATI / CONNECTION REFUSED
      alert("🚫 Tidak dapat terhubung ke server. Pastikan server backend Anda sudah dijalankan.");
  } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = "Kirim Link Reset";
  }
});