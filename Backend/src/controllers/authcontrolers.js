const pool = require("../config/db");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *",
      [name, email, hashPassword]
    );

    res.json({ 
      message: "Register success", 
      user: newUser.rows[0],
      token: generateToken(newUser.rows[0].id)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    res.json({
      message: "Login success",
      user: user.rows[0],
      token: generateToken(user.rows[0].id),
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
