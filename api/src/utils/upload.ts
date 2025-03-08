import multer from 'multer';
import path from 'path';

// Define constants
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.tiff'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_FILE_SIZE = 1; // 1 byte minimum

// Configure multer
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Only these file types are allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    if (file.originalname.length > 255) {
      return cb(new Error('Filename is too long (max 255 characters)'));
    }
    cb(null, true);
  }
});
