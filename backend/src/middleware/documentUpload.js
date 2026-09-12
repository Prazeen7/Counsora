const multer = require("multer");
const path = require("path");

const formats = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf" };
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 10, fieldSize: 100000 },
    fileFilter(_req, file, cb) {
        const expected = formats[path.extname(file.originalname).toLowerCase()];
        cb(expected && expected === file.mimetype ? null : new Error("Choose a JPG, JPEG, PNG, or PDF file."), Boolean(expected && expected === file.mimetype));
    },
}).array("previews", 5);

function validSignature(file) {
    const bytes = file.buffer;
    if (file.mimetype === "application/pdf") return bytes.subarray(0, 5).toString() === "%PDF-";
    if (file.mimetype === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    return file.mimetype === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
}

module.exports = (req, res, next) => upload(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Preview files must be 5 MB or smaller." : error.message });
    if ((req.files || []).some((file) => !validSignature(file))) return res.status(400).json({ error: "A file does not match its image or PDF format." });
    next();
});
