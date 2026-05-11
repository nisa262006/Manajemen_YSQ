const { Pool } = require("pg");

async function checkPort5432() {
    const pool = new Pool({
        host: "localhost",
        user: "postgres",
        password: "admin123",
        port: 5432,
        database: "manajemen_db"
    });
    try {
        const res = await pool.query("SELECT current_database()");
        console.log("CONNECTED TO:", res.rows[0]);
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

checkPort5432();
