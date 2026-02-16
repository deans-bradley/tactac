import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { deleteImage } from '../middleware/upload.middleware.js';
import { PAGINATION } from '../config/constants.js';

/**
 * Get user profile by username
 * GET /api/users/:username
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ usernameLower: username.toLowerCase() });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isOwner = req.user && req.user._id.toString() === user._id.toString();

  res.json({
    success: true,
    data: {
      user: isOwner ? user.toOwnProfile() : user.toPublicProfile(),
      isOwner
    }
  });
});

/**
 * Get user's posts
 * GET /api/users/:username/posts
 */
export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const user = await User.findOne({ usernameLower: username.toLowerCase() });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [posts, total] = await Promise.all([
    Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profileImage'),
    Post.countDocuments({ author: user._id })
  ]);

  // Get like status if user is authenticated
  let likeStatus = {};
  if (req.user && posts.length > 0) {
    const postIds = posts.map(p => p._id);
    likeStatus = await Like.getLikeStatusForPosts(req.user._id, postIds);
  }

  const postsWithLikeStatus = posts.map(post => ({
    ...post.toResponse(req.user?._id?.toString()),
    hasLiked: likeStatus[post._id.toString()] || false
  }));

  res.json({
    success: true,
    data: {
      posts: postsWithLikeStatus,
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
 * Update own profile
 * PATCH /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, bio } = req.body;
  const updates = {};

  if (username !== undefined) {
    // Check username uniqueness
    const existing = await User.findOne({
      usernameLower: username.toLowerCase(),
      _id: { $ne: req.user._id }
    });

    if (existing) {
      throw new AppError('Username already taken', 400);
    }

    updates.username = username;
  }

  if (bio !== undefined) {
    updates.bio = bio;
  }

  // Handle profile image upload
  if (req.processedImage) {
    // Delete old profile image if exists
    if (req.user.profileImage) {
      await deleteImage(req.user.profileImage);
    }
    updates.profileImage = req.processedImage.url;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toOwnProfile()
    }
  });
});

/**
 * Update email
 * PATCH /api/users/email
 */
export const updateEmail = asyncHandler(async (req, res) => {
  const { email, currentPassword } = req.body;

  // Verify current password
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Check email uniqueness
  const existing = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: req.user._id }
  });

  if (existing) {
    throw new AppError('Email already in use', 400);
  }

  user.email = email;
  await user.save();

  res.json({
    success: true,
    message: 'Email updated successfully',
    data: {
      user: user.toOwnProfile()
    }
  });
});

/**
 * Update password
 * PATCH /api/users/password
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

/**
 * Delete own account
 * DELETE /api/users/account
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError('Password is incorrect', 401);
  }

  // Delete user's posts and their images
  const userPosts = await Post.find({ author: req.user._id });
  for (const post of userPosts) {
    await deleteImage(post.image);
  }
  await Post.deleteMany({ author: req.user._id });

  // Delete user's comments
  await Comment.deleteMany({ author: req.user._id });

  // Delete user's likes
  await Like.deleteMany({ user: req.user._id });

  // Recalculate like counts for posts that user liked
  // (This is a simplification - in production, you might do this asynchronously)

  // Delete profile image
  if (user.profileImage) {
    await deleteImage(user.profileImage);
  }

  // Delete user
  await User.findByIdAndDelete(req.user._id);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});
