// check_pendaftar_cols.js
require('dotenv').config({ path: '.env.test' });
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  const client = await pool.connect();
  try {
    const descRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pendaftar'
    `);
    console.log(`Table "pendaftar" columns:`);
    descRes.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type}`));
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
