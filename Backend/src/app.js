const express = require("express");
const cors = require("cors");
const app = express();

// === CORS WAJIB DI ATAS ROUTER ===
app.use(cors({
  origin: "http://localhost:5000",   // alamat frontend kamu
  credentials: true                   // aktifkan jika pakai cookie/token
}));

// Middleware JSON
app.use(express.json());

// Import Router
const authRoutes = require("./routes/authroutes");

// Mount Router
app.use("/auth", authRoutes);

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
