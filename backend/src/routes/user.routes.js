import { Router } from 'express';
import {
  getUserProfile,
  getUserPosts,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount
} from '../controllers/user.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { upload, processProfileImage } from '../middleware/upload.middleware.js';
import {
  updateProfileValidation,
  updateEmailValidation,
  updatePasswordValidation,
  paginationValidation
} from '../middleware/validation.middleware.js';

const router = Router();

// Protected routes - must come before :username route
router.patch('/profile', authenticate, upload.single('profileImage'), processProfileImage, updateProfileValidation, updateProfile);
router.patch('/email', authenticate, updateEmailValidation, updateEmail);
router.patch('/password', authenticate, updatePasswordValidation, updatePassword);
router.delete('/account', authenticate, deleteAccount);

// Public/semi-public routes
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/posts', optionalAuth, paginationValidation, getUserPosts);

export default router;
