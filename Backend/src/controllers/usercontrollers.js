const pool = require("../config/db");

exports.getProfile = async (req, res) => {
  try {
    const user = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [req.user]);
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
