import mongoose from 'mongoose';
import { COMMENT_LIMITS } from '../config/constants.js';

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment must have an author'],
    index: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Comment must reference a post'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [COMMENT_LIMITS.MAX_LENGTH, `Comment cannot exceed ${COMMENT_LIMITS.MAX_LENGTH} characters`],
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

// Don't return deleted comments in normal queries
commentSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Instance method to format comment for response
commentSchema.methods.toResponse = function(userId = null) {
  return {
    id: this._id,
    author: this.author,
    post: this.post,
    content: this.content,
    isEdited: this.isEdited,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    isOwner: userId ? this.author._id?.toString() === userId || this.author.toString() === userId : false
  };
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
