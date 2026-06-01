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
  max: process.env.NODE_ENV === "test" ? 5 : 20,
  idleTimeoutMillis: process.env.NODE_ENV === "test" ? 500 : 30000,
  connectionTimeoutMillis: 10000,
});

// Hanya tes koneksi saat bukan di-mock (test unit memakai jest.mock)
if (process.env.NODE_ENV !== "test") {
  pool.connect()
    .then(client => { console.log("✅ PostgreSQL connected"); client.release(); })
    .catch(err => console.error("❌ PostgreSQL error:", err.message));
} else {
  pool.query('SELECT 1')
    .then(() => console.log("✅ PostgreSQL connected"))
    .catch(err => console.error("❌ PostgreSQL error:", err.message));
}

module.exports = pool;
