document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://127.0.0.1:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password })   // <-- PERUBAHAN WAJIB
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById("error").innerText = data.message;
      return;
    }

    // simpan token
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);

    // redirect sesuai role
    if (data.role === "admin") {
      window.location.href = "/Frontend/Public/views/dashboardadmin.html";
    } else if (data.role === "pengajar") {
      window.location.href = "/Frontend/Public/views/dashboardpengajar.html";
    } else {
      window.location.href = "/Frontend/Public/views/dashboardsantri.html";
    }

  } catch (err) {
    document.getElementById("error").innerText = "Tidak dapat terhubung ke server";
  }
});
