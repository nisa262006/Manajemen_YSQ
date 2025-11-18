const bcrypt = require("bcrypt");

async function hashPassword() {
  const hash = await bcrypt.hash("123456", 10);
  console.log(hash);
}

hashPassword();
