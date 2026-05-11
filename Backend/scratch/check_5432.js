const { Pool } = require("pg");

async function checkPort5432() {
    const pool = new Pool({
        host: "localhost",
        user: "postgres",
        password: "12345",
        port: 5432,
        database: "manajemen_db"
    });
    try {
        const res = await pool.query("SELECT current_database()");
        console.log("CONNECTED TO:", res.rows[0]);
        const users = await pool.query("SELECT username FROM users");
        console.log("USERS:", users.rows);
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

checkPort5432();
