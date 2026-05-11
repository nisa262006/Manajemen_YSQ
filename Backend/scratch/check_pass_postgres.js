const { Client } = require("pg");

async function checkPostgresPass() {
    const client = new Client({
        host: "localhost",
        user: "postgres",
        password: "postgres",
        port: 5432,
        database: "postgres"
    });
    try {
        await client.connect();
        console.log("CONNECTED WITH PASSWORD postgres");
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

checkPostgresPass();
