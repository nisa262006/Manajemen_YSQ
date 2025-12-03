const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

console.log("JWT Secret Status:", process.env.JWT_SECRET ? "LOADED" : "FAILED TO LOAD");
console.log("PORT Status:", process.env.PORT);

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

// Log request
app.use((req, res, next) => {
  console.log("REQUEST MASUK:", req.method, req.url);
  next();
});

// Middleware JSON
app.use(express.json());

// ======================= R O U T E S  ===========================
const authRoutes = require("./routes/authroutes");
const registerRoutes = require("./routes/registerroutes");
const kelasRoutes = require("./routes/kelasroutes");
const jadwalRouter = require("./routes/jadwalroutes");
const absensiRouter = require("./routes/absensiroutes");
const santriDashboardRoutes = require("./routes/santridashboardroutes");
const meRouter = require("./routes/meroutes");
const pengajarRouter = require("./routes/pengajarroutes");
const santriRouter = require("./routes/santriroutes");

app.use("/auth", authRoutes);
app.use("/pendaftar", registerRoutes);
app.use("/kelas", kelasRoutes);
app.use("/jadwal", jadwalRouter);
app.use("/absensi", absensiRouter);
app.use("/santri/dashboard", santriDashboardRoutes);
app.use("/me", meRouter);
app.use("/pengajar", pengajarRouter);
app.use("/santri", santriRouter);

// ======================= STATIC FILE (PINDAHKAN KE BAWAH) =======
app.use(express.static(path.join(__dirname, "../../Frontend/Public")));

app.get("/", (req, res) => {
  res.send("API Sahabat Quran berjalan");
});

// ======================= START SERVER ===========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
