import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post must have an author'],
    index: true
  },
  image: {
    type: String,
    required: [true, 'Post must have an image']
  },
  caption: {
    type: String,
    maxlength: [500, 'Caption cannot exceed 500 characters'],
    default: ''
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
postSchema.index({ createdAt: -1 });
postSchema.index({ likeCount: -1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

// Don't return deleted posts in normal queries
postSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Virtual for likes (populated separately)
postSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post'
});

// Virtual for comments (populated separately)
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

// Instance method to format post for response
postSchema.methods.toResponse = function(userId = null) {
  return {
    id: this._id,
    author: this.author,
    image: this.image,
    caption: this.caption,
    likeCount: this.likeCount,
    commentCount: this.commentCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    isOwner: userId ? this.author._id?.toString() === userId || this.author.toString() === userId : false
  };
};

const Post = mongoose.model('Post', postSchema);

export default Post;
