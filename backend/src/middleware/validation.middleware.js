import { body, param, query, validationResult } from 'express-validator';
import { PASSWORD_REQUIREMENTS, POST_LIMITS, COMMENT_LIMITS } from '../config/constants.js';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validate password strength
 */
const passwordValidator = (value) => {
  const { MIN_LENGTH, REQUIRE_UPPERCASE, REQUIRE_LOWERCASE, REQUIRE_NUMBER } = PASSWORD_REQUIREMENTS;
  
  if (value.length < MIN_LENGTH) {
    throw new Error(`Password must be at least ${MIN_LENGTH} characters`);
  }
  if (REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (REQUIRE_LOWERCASE && !/[a-z]/.test(value)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (REQUIRE_NUMBER && !/\d/.test(value)) {
    throw new Error('Password must contain at least one number');
  }
  return true;
};

/**
 * Sanitize input to prevent XSS
 */
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

// ==================== AUTH VALIDATORS ====================

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer(sanitizeInput),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .custom(passwordValidator),
  handleValidationErrors
];

export const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// ==================== USER VALIDATORS ====================

export const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .customSanitizer(sanitizeInput),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

export const updateEmailValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  handleValidationErrors
];

export const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .custom(passwordValidator),
  handleValidationErrors
];

// ==================== POST VALIDATORS ====================

export const createPostValidation = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: POST_LIMITS.MAX_CAPTION_LENGTH })
    .withMessage(`Caption cannot exceed ${POST_LIMITS.MAX_CAPTION_LENGTH} characters`)
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

export const updatePostValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID'),
  body('caption')
    .optional()
    .trim()
    .isLength({ max: POST_LIMITS.MAX_CAPTION_LENGTH })
    .withMessage(`Caption cannot exceed ${POST_LIMITS.MAX_CAPTION_LENGTH} characters`)
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

// ==================== COMMENT VALIDATORS ====================

export const createCommentValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: COMMENT_LIMITS.MAX_LENGTH })
    .withMessage(`Comment cannot exceed ${COMMENT_LIMITS.MAX_LENGTH} characters`)
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

export const updateCommentValidation = [
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: COMMENT_LIMITS.MAX_LENGTH })
    .withMessage(`Comment cannot exceed ${COMMENT_LIMITS.MAX_LENGTH} characters`)
    .customSanitizer(sanitizeInput),
  handleValidationErrors
];

// ==================== PAGINATION VALIDATORS ====================

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  handleValidationErrors
];

// ==================== ID VALIDATORS ====================

export const mongoIdValidation = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];
