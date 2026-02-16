import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { deleteImage } from '../middleware/upload.middleware.js';
import { PAGINATION, ACCOUNT_STATUS } from '../config/constants.js';

/**
 * Get system metrics
 * GET /api/admin/metrics
 */
export const getMetrics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPosts,
    totalComments,
    totalLikes,
    activeUsers,
    suspendedUsers,
    recentUsers,
    recentPosts
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Comment.countDocuments(),
    Like.countDocuments(),
    User.countDocuments({ status: ACCOUNT_STATUS.ACTIVE }),
    User.countDocuments({ status: ACCOUNT_STATUS.SUSPENDED }),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    Post.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
  ]);

  res.json({
    success: true,
    data: {
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          newLast24h: recentUsers
        },
        posts: {
          total: totalPosts,
          newLast24h: recentPosts
        },
        comments: {
          total: totalComments
        },
        likes: {
          total: totalLikes
        }
      }
    }
  });
});

/**
 * Get all users (admin)
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const status = req.query.status;

  let query = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
    query.status = status;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      users: users.map(u => u.toOwnProfile()),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * Get user details (admin)
 * GET /api/admin/users/:userId
 */
export const getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [postCount, commentCount, likeCount] = await Promise.all([
    Post.countDocuments({ author: userId }),
    Comment.countDocuments({ author: userId }),
    Like.countDocuments({ user: userId })
  ]);

  res.json({
    success: true,
    data: {
      user: {
        ...user.toOwnProfile(),
        stats: {
          posts: postCount,
          comments: commentCount,
          likesGiven: likeCount
        }
      }
    }
  });
});

/**
 * Update user (admin)
 * PATCH /api/admin/users/:userId
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, role } = req.body;
  const updates = {};

  if (status && Object.values(ACCOUNT_STATUS).includes(status)) {
    updates.status = status;
  }

  if (role && ['admin', 'user'].includes(role)) {
    updates.role = role;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: user.toOwnProfile()
    }
  });
});

/**
 * Delete user (admin)
 * DELETE /api/admin/users/:userId
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (userId === req.user._id.toString()) {
    throw new AppError('Cannot delete your own account through admin panel', 400);
  }

  // Delete user's posts and their images
  const userPosts = await Post.find({ author: userId });
  for (const post of userPosts) {
    await deleteImage(post.image);
  }
  await Post.deleteMany({ author: userId });

  // Delete user's comments and likes
  await Comment.deleteMany({ author: userId });
  await Like.deleteMany({ user: userId });

  // Delete profile image
  if (user.profileImage) {
    await deleteImage(user.profileImage);
  }

  // Delete user
  await User.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Delete any post (admin)
 * DELETE /api/admin/posts/:postId
 */
export const adminDeletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Delete image file
  await deleteImage(post.image);

  // Delete associated likes and comments
  await Promise.all([
    Like.deleteMany({ post: postId }),
    Comment.deleteMany({ post: postId })
  ]);

  // Decrement user's post count
  await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });

  // Delete post
  await Post.findByIdAndDelete(postId);

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

/**
 * Delete any comment (admin)
 * DELETE /api/admin/comments/:commentId
 */
export const adminDeleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  // Decrement post's comment count
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

  // Delete comment
  await Comment.findByIdAndDelete(commentId);

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});
