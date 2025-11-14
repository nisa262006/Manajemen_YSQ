const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "passwordkamu",
  database: "ysq_db",
  port: 5432
});

module.exports = pool;
