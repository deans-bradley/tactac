import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;

/**
 * Upload image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'tactac',
      resource_type: 'image',
      ...options
    };

    // Use upload_stream for buffer uploads
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Write buffer to stream
    uploadStream.end(buffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) return null;

    // Get everything after 'upload' and version (v1234567890)
    const pathAfterUpload = urlParts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    const pathWithoutVersion = pathAfterUpload[0]?.match(/^v\d+$/) 
      ? pathAfterUpload.slice(1) 
      : pathAfterUpload;

    // Join remaining parts and remove file extension
    const publicIdWithExt = pathWithoutVersion.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized URL
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};
