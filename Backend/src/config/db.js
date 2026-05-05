const { Pool } = require("pg");
const path = require("path");

// Saat test, load .env.test agar terhubung ke Postgres localhost:5433
if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env.test") });
} else {
  require("dotenv").config();
}

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  port: process.env.DB_PORT || 5432,
  password: process.env.DB_PASSWORD || "12345",
  database: process.env.DB_NAME || "manajemen_db",
  max: 20, // Maksimal 20 koneksi simultan
  idleTimeoutMillis: 30000, // Tutup koneksi nganggur setelah 30 detik
  connectionTimeoutMillis: 10000, // Naikkan timeout untuk test environment
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => console.error("❌ PostgreSQL error:", err.message));

module.exports = pool;
