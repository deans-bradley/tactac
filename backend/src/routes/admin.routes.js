import { Router } from 'express';
import {
  getMetrics,
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  adminDeletePost,
  adminDeleteComment
} from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { paginationValidation, mongoIdValidation } from '../middleware/validation.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Metrics
router.get('/metrics', getMetrics);

// User management
router.get('/users', paginationValidation, getAllUsers);
router.get('/users/:userId', ...mongoIdValidation('userId'), getUserDetails);
router.patch('/users/:userId', ...mongoIdValidation('userId'), updateUser);
router.delete('/users/:userId', ...mongoIdValidation('userId'), deleteUser);

// Content moderation
router.delete('/posts/:postId', ...mongoIdValidation('postId'), adminDeletePost);
router.delete('/comments/:commentId', ...mongoIdValidation('commentId'), adminDeleteComment);

export default router;
