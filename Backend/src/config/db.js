const { Pool } = require("pg");
const path = require("path");

// Saat test, load .env.test agar terhubung ke Postgres localhost:5433
if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env.test") });
} else {
  require("dotenv").config();
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Maksimal 20 koneksi simultan
  idleTimeoutMillis: 30000, // Tutup koneksi nganggur setelah 30 detik
  connectionTimeoutMillis: 10000, // Naikkan timeout untuk test environment
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
});

module.exports = pool;
