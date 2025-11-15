const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("../config/db");
// no explicit connect() because Pool handles connections; but you can test
db.query('SELECT 1').then(()=>console.log('✅ DB reachable')).catch(err=>console.error('DB not reachable', err));

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("../routes/authroutes"));
app.use("/api/santri", require("../routes/santriroutes"));
app.use("/api/kelas", require("../routes/kelasroutes"));
app.use("/api/jadwal", require("../routes/jadwalroutes"));
app.use("/api/absensi", require("../routes/absensiroutes"));

app.get("/", (req, res) => res.send("YSQ Backend Running"));

app.listen(5000, () => console.log("Server ON"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server berjalan di port ${PORT}`));
