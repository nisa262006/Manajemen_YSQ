const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= LOG REQUEST =================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ================= STATIC FILES =================
// path ke folder public
app.use(express.static(path.join(__dirname, "../public")));
const publicPath = path.join(__dirname, "../public");
const viewsPath = path.join(publicPath, "views");

// serve css, js, images
app.use(express.static(publicPath));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// helper biar gak nulis sendFile panjang-panjang
const view = (file) => path.join(viewsPath, file);

// ================= HALAMAN UMUM =================
app.get("/", (_, res) => res.sendFile(view("index.html")));
app.get("/login", (_, res) => res.sendFile(view("login.html")));
app.get("/daftar", (_, res) => res.sendFile(view("daftar.html")));
app.get("/reset-password", (_, res) => res.sendFile(view("reset_password.html")));
app.get("/berhasil", (_, res) => res.sendFile(view("berhasil.html")));

// ================= DASHBOARD =================
app.get("/dashboard/admin", (_, res) => res.sendFile(view("Admin.html")));
app.get("/dashboard/pengajar", (_, res) => res.sendFile(view("dashboard-pengajar.html")));
app.get("/dashboard/santri", (_, res) => res.sendFile(view("dashboardsantri.html")));

app.get("/dashboard/riwayat-absensi", (_, res) =>
  res.sendFile(view("riwayat_absensi.html"))
);

app.get("/dashboard/riwayat-absensi-santri", (_, res) =>
  res.sendFile(view("riwayat_absensi_santri.html"))
);

app.get("/dashboard/daftar-kelas", (_, res) =>
  res.sendFile(view("daftar_kelas.html"))
);

app.get("/dashboard/tambah-kelas", (_, res) =>
  res.sendFile(view("tambah_kelas.html"))
);

app.get("/dashboard/daftar-pengajar", (_, res) =>
  res.sendFile(view("daftar_pengajar.html"))
);

app.get("/dashboard/tambah-pengajar", (_, res) =>
  res.sendFile(view("tambah_pengajar.html"))
);

app.get("/dashboard/daftar-santri", (_, res) =>
  res.sendFile(view("daftar_santri.html"))
);

app.get("/dashboard/tambah-siswa", (_, res) =>
  res.sendFile(view("tambah_siswa.html"))
);

app.get("/dashboard/daftar-jadwal", (_, res) =>
  res.sendFile(view("daftar_jadwal.html"))
);

app.get("/dashboard/detail-pengajar", (_, res) =>
  res.sendFile(view("detail_pengajar.html"))
);

app.get("/dashboard/detail-santri", (_, res) =>
  res.sendFile(view("detail_santri.html"))
);

app.get("/dashboard/absensi-siswa", (_, res) =>
  res.sendFile(view("absensisiswa.html"))
);

app.get("/dashboard/daftar-registrasi", (_, res) =>
  res.sendFile(view("daftar_registrasi.html"))
);

app.get("/dashboard/pengajar/jadwal", (_, res) => {
  res.sendFile(view("jadwal-kelas-pengajar.html"));
});

app.get("/dashboard/pengajar/absensi", (_, res) => {
  res.sendFile(view("absensi-pengajar.html"));
});

app.get("/dashboard/pengajar/riwayat-absensi", (_, res) => {
  res.sendFile(view("riwayat-absensi.html"));
});

app.get("/dashboard/pengajar/materi-ajar", (_, res) => {
  res.sendFile(view("materi-ajar.html"));
});

app.get("/dashboard/materi-santri", (_, res) => {
  res.sendFile(view("detail-materi-santri.html"));
});

// ================= API ROUTES =================
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/pendaftar", require("./routes/registerroutes"));
app.use("/api/kelas", require("./routes/kelasroutes"));
app.use("/api/jadwal", require("./routes/jadwalroutes"));
app.use("/api/absensi", require("./routes/absensiroutes"));
app.use("/api/santri", require("./routes/santriroutes"));
app.use("/api/pengajar", require("./routes/pengajarroutes"));
app.use("/api/admin", require("./routes/adminroutes"));
app.use("/api/me", require("./routes/meroutes"));
app.use("/api/santridashboard", require("./routes/santridashboardroutes"));
app.use("/api/tugas-media", require("./routes/tugasmateriajarroutes"));
app.use("/api/nilai-progres", require("./routes/nilaidanprogresroutes"));


// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

//================ UPLOAD =========================
const multer = require("multer");

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Ukuran file terlalu besar (maks 10MB)"
      });
    }
  }
  next(err);
});
