// Import library
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Inisialisasi aplikasi
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Tes endpoint (untuk cek backend hidup)
app.get("/", (req, res) => {
  res.send("YSQ Backend Running...");
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
