import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { deleteImage } from '../middleware/upload.middleware.js';
import { PAGINATION, TRENDING, ROLES } from '../config/constants.js';

/**
 * Create a new post
 * POST /api/posts
 */
export const createPost = asyncHandler(async (req, res) => {
  const { caption } = req.body;

  const post = await Post.create({
    author: req.user._id,
    image: req.processedImage.url,
    caption: caption || ''
  });

  // Increment user's post count
  await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: 1 } });

  await post.populate('author', 'username profileImage');

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: {
      post: {
        ...post.toResponse(req.user._id.toString()),
        hasLiked: false
      }
    }
  });
});

/**
 * Get feed posts (recent or trending)
 * GET /api/posts
 */
export const getFeedPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filter = req.query.filter || 'recent';

  let query = {};
  let sort = { createdAt: -1 };

  if (filter === 'trending') {
    // Trending: posts with most likes in the last X hours
    const timeWindow = new Date();
    timeWindow.setHours(timeWindow.getHours() - TRENDING.TIME_WINDOW_HOURS);

    query = {
      createdAt: { $gte: timeWindow },
      likeCount: { $gte: TRENDING.MIN_LIKES_FOR_TRENDING }
    };
    sort = { likeCount: -1, createdAt: -1 };
  }

  const [posts, total] = await Promise.all([
    Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profileImage'),
    Post.countDocuments(query)
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
      filter,
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
 * Get single post
 * GET /api/posts/:postId
 */
export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId)
    .populate('author', 'username profileImage');

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  let hasLiked = false;
  if (req.user) {
    hasLiked = await Like.hasUserLiked(req.user._id, postId);
  }

  res.json({
    success: true,
    data: {
      post: {
        ...post.toResponse(req.user?._id?.toString()),
        hasLiked
      }
    }
  });
});

/**
 * Update post caption
 * PATCH /api/posts/:postId
 */
export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { caption } = req.body;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check ownership
  if (post.author.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to edit this post', 403);
  }

  post.caption = caption !== undefined ? caption : post.caption;
  await post.save();

  await post.populate('author', 'username profileImage');

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: {
      post: post.toResponse(req.user._id.toString())
    }
  });
});

/**
 * Delete post
 * DELETE /api/posts/:postId
 */
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check ownership or admin
  const isOwner = post.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new AppError('Not authorized to delete this post', 403);
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
 * Like a post
 * POST /api/posts/:postId/like
 */
export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Check if already liked
  const existingLike = await Like.findOne({
    user: req.user._id,
    post: postId
  });

  if (existingLike) {
    throw new AppError('You have already liked this post', 400);
  }

  // Create like
  await Like.create({
    user: req.user._id,
    post: postId
  });

  // Increment like count
  post.likeCount += 1;
  await post.save();

  // Increment author's total likes received
  await User.findByIdAndUpdate(post.author, { $inc: { totalLikesReceived: 1 } });

  res.json({
    success: true,
    message: 'Post liked',
    data: {
      likeCount: post.likeCount,
      hasLiked: true
    }
  });
});

/**
 * Unlike a post
 * DELETE /api/posts/:postId/like
 */
export const unlikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  // Find and delete like
  const like = await Like.findOneAndDelete({
    user: req.user._id,
    post: postId
  });

  if (!like) {
    throw new AppError('You have not liked this post', 400);
  }

  // Decrement like count
  post.likeCount = Math.max(0, post.likeCount - 1);
  await post.save();

  // Decrement author's total likes received
  await User.findByIdAndUpdate(post.author, { $inc: { totalLikesReceived: -1 } });

  res.json({
    success: true,
    message: 'Like removed',
    data: {
      likeCount: post.likeCount,
      hasLiked: false
    }
  });
});

/**
 * Get post comments
 * GET /api/posts/:postId/comments
 */
export const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profileImage'),
    Comment.countDocuments({ post: postId })
  ]);

  const commentsFormatted = comments.map(c => c.toResponse(req.user?._id?.toString()));

  res.json({
    success: true,
    data: {
      comments: commentsFormatted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});
