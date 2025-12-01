document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const identifier = document.getElementById("identifier").value;
  const password = document.getElementById("password").value;
  const errorBox = document.getElementById("error");

  errorBox.innerText = ""; // reset error

  try {
      const res = await fetch("http://127.0.0.1:5000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();

      if (!res.ok) {
          errorBox.innerText = data.message || "Login gagal";
          return;
      }

      // SIMPAN TOKEN + ROLE + ID USERS
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("id_users", data.id_users);

      // REDIRECT SESUAI ROLE
      if (data.role === "admin") {
          window.location.href = "./Admin.html";
      } 
      else if (data.role === "pengajar") {
          window.location.href = "./dashboardpengajar.html";
      } 
      else {
          window.location.href = "./dashboardsantri.html";
      }

  } catch (err) {
      errorBox.innerText = "Tidak dapat terhubung ke server";
  }
});
