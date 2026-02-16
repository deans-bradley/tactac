import { Router } from 'express';
import {
  createComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createCommentValidation,
  updateCommentValidation,
  mongoIdValidation
} from '../middleware/validation.middleware.js';

const router = Router();

// Create comment on a post
router.post('/:postId', authenticate, createCommentValidation, createComment);

// Update comment
router.patch('/:commentId', authenticate, updateCommentValidation, updateComment);

// Delete comment
router.delete('/:commentId', authenticate, ...mongoIdValidation('commentId'), deleteComment);

export default router;
