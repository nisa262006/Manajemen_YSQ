const multer = require("multer");
const path = require("path");
const fs = require("fs");

// SEKARANG RELATIF: Mengarah ke Sahabat-Quran-Web/Backend/public/uploads
// __dirname adalah lokasi file upload.js ini berada (biasanya di folder middleware atau utils)
const baseUploadDir = path.join(__dirname, "../public/uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subFolder = "";

    if (req.originalUrl.includes("/materi")) {
      subFolder = "materi";
    } else if (req.originalUrl.includes("/tugas") && !req.originalUrl.includes("/submit")) {
      subFolder = "tugas";
    } else if (req.originalUrl.includes("/submit")) {
      subFolder = "submit";
    }

    const finalDir = path.join(baseUploadDir, subFolder);

    // Otomatis buat folder jika belum ada, sangat membantu untuk anggota tim baru
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;