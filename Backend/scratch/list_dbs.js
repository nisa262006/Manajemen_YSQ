const { Client } = require("pg");

async function listDatabases() {
    const client = new Client({
        host: "localhost",
        user: "postgres",
        password: "12345",
        port: 5432,
        database: "postgres" // Connect to default postgres DB
    });
    try {
        await client.connect();
        const res = await client.query("SELECT datname FROM pg_database");
        console.log("DATABASES:", res.rows.map(r => r.datname));
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

listDatabases();
