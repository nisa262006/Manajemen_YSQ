const multer = require("multer");
const path = require("path");
const fs = require("fs");

// PATH ABSOLUT WINDOWS
const baseUploadDir = "D:/TUGAS KULIAH/aplikasi - YSQ/storage_external/uploads";

const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    let subFolder = "";

    // Logika penentuan folder berdasarkan URL Route
    if (req.originalUrl.includes("/materi")) {
      subFolder = "materi";
    } else if (req.originalUrl.includes("/tugas") && !req.originalUrl.includes("/submit")) {
      subFolder = "tugas";
    } else if (req.originalUrl.includes("/submit")) {
      subFolder = "submit";
    }

    const finalDir = path.join(baseUploadDir, subFolder);

    // Buat folder jika belum ada (misal folder 'materi' belum ada)
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    cb(null, finalDir);
  },
  filename: (req, file, cb) => {
    // Membersihkan nama file dari spasi
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;