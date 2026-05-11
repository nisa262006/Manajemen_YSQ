/**
 * server.js - Entry point untuk menjalankan server
 * Hanya bertugas memanggil app.listen()
 */
const app = require('./app');

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
