const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD_DIR } = require('../config/env');
const { error } = require('../utils/response');

// Ensure upload directory exists securely
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Magic bytes table for allowed produce image formats
const MAGIC_BYTES = {
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header; WEBP at bytes 8-11
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates actual binary signature (magic bytes) from buffer
 */
const validateMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 12) return false;

  // Check JPEG
  if (
    buffer[0] === MAGIC_BYTES.jpg[0] &&
    buffer[1] === MAGIC_BYTES.jpg[1] &&
    buffer[2] === MAGIC_BYTES.jpg[2]
  ) {
    return 'jpg';
  }

  // Check PNG
  if (
    buffer[0] === MAGIC_BYTES.png[0] &&
    buffer[1] === MAGIC_BYTES.png[1] &&
    buffer[2] === MAGIC_BYTES.png[2] &&
    buffer[3] === MAGIC_BYTES.png[3]
  ) {
    return 'png';
  }

  // Check WEBP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return false;
};

// Use memoryStorage first to inspect magic bytes before persisting to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG and WEBP image files are permitted.'));
    }
    cb(null, true);
  },
});

/**
 * Middleware to verify magic bytes and securely save the validated file with a random UUID
 */
const verifyAndSaveFile = async (req, res, next) => {
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  const files = req.files || [req.file];
  const savedFiles = [];

  try {
    for (const file of files) {
      const detectedExt = validateMagicBytes(file.buffer);

      if (!detectedExt) {
        return error(
          res,
          'File signature check failed. The uploaded file is corrupted or not a valid image.',
          'MALICIOUS_FILE_REJECTED',
          400
        );
      }

      // Generate server-side random filename to prevent path traversal & overwrite
      const serverFilename = `${crypto.randomUUID()}.${detectedExt}`;
      const targetPath = path.join(UPLOAD_DIR, serverFilename);

      await fs.promises.writeFile(targetPath, file.buffer);

      savedFiles.push({
        filename: serverFilename,
        originalName: path.basename(file.originalname),
        path: `/uploads/${serverFilename}`,
        size: file.size,
        mimeType: file.mimetype,
        format: detectedExt,
      });
    }

    if (req.file) {
      req.savedFile = savedFiles[0];
    }
    if (req.files) {
      req.savedFiles = savedFiles;
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upload,
  verifyAndSaveFile,
  validateMagicBytes,
};
