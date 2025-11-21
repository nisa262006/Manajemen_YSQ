const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("TEST OK"));

app.listen(5000, () => console.log("TEST SERVER RUNNING ON 5000"));
app.listen(5050, () => console.log("TEST SERVER RUNNING ON 5050"));

