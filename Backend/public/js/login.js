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
