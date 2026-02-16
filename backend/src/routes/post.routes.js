import { Router } from 'express';
import {
  createPost,
  getFeedPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostComments
} from '../controllers/post.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { upload, processImage } from '../middleware/upload.middleware.js';
import {
  createPostValidation,
  updatePostValidation,
  paginationValidation,
  mongoIdValidation
} from '../middleware/validation.middleware.js';

const router = Router();

// Feed (public with optional auth for like status)
router.get('/', optionalAuth, paginationValidation, getFeedPosts);

// Single post
router.get('/:postId', optionalAuth, ...mongoIdValidation('postId'), getPost);

// Create post (protected)
router.post('/', authenticate, upload.single('image'), processImage, createPostValidation, createPost);

// Update post (protected)
router.patch('/:postId', authenticate, updatePostValidation, updatePost);

// Delete post (protected)
router.delete('/:postId', authenticate, ...mongoIdValidation('postId'), deletePost);

// Like/unlike post (protected)
router.post('/:postId/like', authenticate, ...mongoIdValidation('postId'), likePost);
router.delete('/:postId/like', authenticate, ...mongoIdValidation('postId'), unlikePost);

// Get post comments
router.get('/:postId/comments', optionalAuth, ...mongoIdValidation('postId'), paginationValidation, getPostComments);

export default router;
