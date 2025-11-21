// app.js (D:\TUGAS KULIAH\aplikasi - YSQ\Sahabat-Quran-Web\backend\src\app.js)
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

// --- Import dan Mount Router ---

// Import Router
const authRoutes = require("./routes/authroutes");
const registerRoutes = require("./routes/registerroutes");
// Tambahkan router lain di sini jika ada

// Mount Router
app.use("/auth", authRoutes);
app.use("/pendaftar", registerRoutes);


// Default route
app.get("/", (req, res) => {
  res.send("API Sahabat Quran berjalan");
});

// --- Start Server ---

// Mengambil port dari .env atau default 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});