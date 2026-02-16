import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ACCOUNT_STATUS } from '../config/constants.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  usernameLower: {
    type: String,
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER
  },
  status: {
    type: String,
    enum: Object.values(ACCOUNT_STATUS),
    default: ACCOUNT_STATUS.ACTIVE
  },
  profileImage: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  postCount: {
    type: Number,
    default: 0
  },
  totalLikesReceived: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for case-insensitive username lookup
userSchema.index({ usernameLower: 1 });

// Pre-save middleware to hash password and set lowercase username
userSchema.pre('save', async function(next) {
  // Set lowercase username for case-insensitive uniqueness
  if (this.isModified('username')) {
    this.usernameLower = this.username.toLowerCase();
  }

  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
userSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    profileImage: this.profileImage,
    bio: this.bio,
    postCount: this.postCount,
    totalLikesReceived: this.totalLikesReceived,
    createdAt: this.createdAt
  };
};

// Instance method to get own profile (more details)
userSchema.methods.toOwnProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    status: this.status,
    profileImage: this.profileImage,
    bio: this.bio,
    postCount: this.postCount,
    totalLikesReceived: this.totalLikesReceived,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
