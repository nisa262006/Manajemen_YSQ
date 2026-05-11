const { Client } = require("pg");

async function checkNoPassword() {
    const client = new Client({
        host: "localhost",
        user: "postgres",
        port: 5432,
        database: "postgres"
    });
    try {
        await client.connect();
        console.log("CONNECTED WITH NO PASSWORD");
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

checkNoPassword();
