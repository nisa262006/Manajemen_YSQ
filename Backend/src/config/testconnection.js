const db = require("./db");

async function test() {
  try {
    const result = await db.query("SELECT NOW()");
    console.log("Database Connected ✔ | Time:", result.rows[0]);
  } catch (err) {
    console.error("Database Error ❌:", err);
  }
}

test();
