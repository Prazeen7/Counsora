const multer = require("multer");

module.exports = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const valid = /\.(xlsx|xls)$/i.test(file.originalname);
        cb(valid ? null : new Error("Only .xlsx and .xls files are allowed"), valid);
    },
});
