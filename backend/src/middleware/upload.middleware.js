import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';
import { POST_LIMITS } from '../config/constants.js';

// Ensure upload directory exists
const uploadDir = 'uploads';
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};
ensureUploadDir();

// Configure multer storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (POST_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'), false);
  }
};

// Multer upload configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: POST_LIMITS.MAX_FILE_SIZE
  },
  fileFilter
});

/**
 * Process and save uploaded image
 */
export const processImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image is required'
    });
  }

  try {
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Process image with sharp - resize and convert to webp
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    req.processedImage = {
      filename,
      path: filepath,
      url: `/uploads/${filename}`
    };

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing image'
    });
  }
};

/**
 * Process profile image with smaller dimensions
 */
export const processProfileImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename = `profile-${uuidv4()}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover'
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    req.processedImage = {
      filename,
      path: filepath,
      url: `/uploads/${filename}`
    };

    next();
  } catch (error) {
    console.error('Profile image processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing profile image'
    });
  }
};

/**
 * Delete image file
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    const filename = path.basename(imageUrl);
    const filepath = path.join(uploadDir, filename);
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
