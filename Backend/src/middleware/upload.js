const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Menentukan lokasi folder public/uploads secara absolut
const uploadDir = path.join(__dirname, "../../public/uploads");

// Logika untuk membuat folder otomatis jika belum ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // File akan masuk ke Backend/public/uploads
    },
    filename: (req, file, cb) => {
        // Menamai file: timestamp-namafileasli.ext
        cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = upload;