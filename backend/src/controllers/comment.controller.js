import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { ROLES } from '../config/constants.js';

/**
 * Create a comment on a post
 * POST /api/comments/:postId
 */
export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = await Comment.create({
    author: req.user._id,
    post: postId,
    content
  });

  // Increment post's comment count
  post.commentCount += 1;
  await post.save();

  await comment.populate('author', 'username profileImage');

  res.status(201).json({
    success: true,
    message: 'Comment added',
    data: {
      comment: comment.toResponse(req.user._id.toString())
    }
  });
});

/**
 * Update a comment
 * PATCH /api/comments/:commentId
 */
export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // Check ownership
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to edit this comment', 403);
  }

  comment.content = content;
  comment.isEdited = true;
  await comment.save();

  await comment.populate('author', 'username profileImage');

  res.json({
    success: true,
    message: 'Comment updated',
    data: {
      comment: comment.toResponse(req.user._id.toString())
    }
  });
});

/**
 * Delete a comment
 * DELETE /api/comments/:commentId
 */
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // Check ownership or admin
  const isOwner = comment.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new AppError('Not authorized to delete this comment', 403);
  }

  // Decrement post's comment count
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

  // Delete comment
  await Comment.findByIdAndDelete(commentId);

  res.json({
    success: true,
    message: 'Comment deleted'
  });
});
