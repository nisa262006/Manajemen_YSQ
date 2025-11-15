const jwt = require("jsonwebtoken");

// Fungsi untuk membuat token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, // Ambil secret dari file .env
    {
      expiresIn: "7d", // Token berlaku 7 hari
    }
  );
};

module.exports = generateToken;
