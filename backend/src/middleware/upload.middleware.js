import multer from 'multer';
import { POST_LIMITS } from '../config/constants.js';
import { 
  uploadToCloudinary, 
  deleteFromCloudinary, 
  getPublicIdFromUrl 
} from '../config/cloudinary.js';

// Configure multer storage (memory for Cloudinary upload)
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
 * Process and upload image to Cloudinary
 */
export const processImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image is required'
    });
  }

  try {
    // Upload to Cloudinary with transformations
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'tactac/posts',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    req.processedImage = {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height
    };

    next();
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading image'
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
    // Upload to Cloudinary with profile-specific transformations
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'tactac/profiles',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    req.processedImage = {
      publicId: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height
    };

    next();
  } catch (error) {
    console.error('Cloudinary profile upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading profile image'
    });
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - The Cloudinary URL of the image to delete
 */
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};
