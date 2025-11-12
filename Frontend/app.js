const express = require('express');
const path = require('path');
const app = express();

// Pastikan baris ini ada ↓
app.use(express.static(path.join(__dirname, 'public')));

// contoh route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'index.html'));
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
