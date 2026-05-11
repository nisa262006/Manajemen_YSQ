const db = require("../src/config/db");

async function checkUsers() {
    process.env.NODE_ENV = "test";
    try {
        const res = await db.query("SELECT username, role FROM users");
        console.log("USERS IN DATABASE:", res.rows);
    } catch (err) {
        console.error("ERROR CHECKING USERS:", err);
    } finally {
        process.exit();
    }
}

checkUsers();
