require('dotenv').config();

// DEBUGGING LINE: Cek apakah variabel sudah masuk ke proses Node.js
console.log("JWT Secret Status:", process.env.JWT_SECRET ? "SUCCESSFULLY LOADED" : "FAILED TO LOAD");
console.log("PORT Status:", process.env.PORT);

const express = require("express");
const cors = require("cors");
const app = express();

// Izinkan semua origin (paling aman untuk development)
app.use(cors());

// Log request
app.use((req, res, next) => {
  console.log("REQUEST MASUK:", req.method, req.url);
  next();
});

// Middleware JSON
app.use(express.json());

// Import Router
const authRoutes = require("./routes/authroutes");
const registerRoutes = require("./routes/registerroutes");

// Mount Router
app.use("/auth", authRoutes);
app.use("/pendaftar", registerRoutes);


// Default route
app.get("/", (req, res) => {
  res.send("API Sahabat Quran berjalan");
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
