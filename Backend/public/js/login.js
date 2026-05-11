document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("error");

  errorBox.innerText = "";

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 404) {
        // Kasus: Akun tidak ada
        errorBox.style.color = "#ef4444";
        errorBox.innerText = "❌ Akun tidak ditemukan. Silakan daftar terlebih dahulu.";
      } 
      else if (res.status === 403) {
        // Kasus: Status akun bermasalah (Pending atau Non Aktif)
        // Kita cek kata kunci di dalam message dari backend
        if (data.message.toLowerCase().includes("belum dikonfirmasi") || data.statusAcc === "pending") {
          errorBox.style.color = "#f59e0b"; // Oranye
          errorBox.innerText = "⏳ Pendaftaran Anda belum diterima oleh Admin. Mohon tunggu konfirmasi.";
        } else {
          errorBox.style.color = "#ef4444"; // Merah
          errorBox.innerText = "❌ Akun Anda tidak aktif. Hubungi admin.";
        }
      } 
      else {
        // Kasus: Password salah atau error lainnya
        errorBox.style.color = "#ef4444";
        errorBox.innerText = data?.message || "Login gagal";
      }
      return;
    }

    // SIMPAN TOKEN & REDIRECT (Berhasil)
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("id_users", data.userId);

    const roleRedirects = {
      'admin': "/dashboard/Admin",
      'pengajar': "/dashboard/pengajar",
      'santri': "/dashboard/santri"
    };

    window.location.href = roleRedirects[data.role] || "/dashboard/santri";

  } catch (err) {
    console.error(err);
    errorBox.innerText = "Tidak dapat terhubung ke server";
  }
});




