import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Like must have a user'],
    index: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Like must reference a post'],
    index: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only like a post once
likeSchema.index({ user: 1, post: 1 }, { unique: true });

// Static method to check if user has liked a post
likeSchema.statics.hasUserLiked = async function(userId, postId) {
  const like = await this.findOne({ user: userId, post: postId });
  return !!like;
};

// Static method to get like status for multiple posts
likeSchema.statics.getLikeStatusForPosts = async function(userId, postIds) {
  const likes = await this.find({
    user: userId,
    post: { $in: postIds }
  }).select('post');
  
  const likedPostIds = new Set(likes.map(like => like.post.toString()));
  return postIds.reduce((acc, postId) => {
    acc[postId.toString()] = likedPostIds.has(postId.toString());
    return acc;
  }, {});
};

const Like = mongoose.model('Like', likeSchema);

export default Like;
