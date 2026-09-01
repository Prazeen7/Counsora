const multer = require('multer');

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// Institution avatar formats supported by Cloudinary and the frontend picker.
const allowedImageTypes = new Set(['image/png', 'image/jpeg']);

const fileFilter = (req, file, cb) => {
    if (allowedImageTypes.has(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Only PNG, JPG, and JPEG images are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

module.exports = upload;
