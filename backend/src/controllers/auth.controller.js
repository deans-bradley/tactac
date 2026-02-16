import User from '../models/User.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { usernameLower: username.toLowerCase() }
    ]
  });

  if (existingUser) {
    if (existingUser.email === email.toLowerCase()) {
      throw new AppError('Email already registered', 400);
    }
    throw new AppError('Username already taken', 400);
  }

  // Create new user
  const user = await User.create({
    username,
    email,
    password
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: user.toOwnProfile(),
      token
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { usernameLower: identifier.toLowerCase() }
    ]
  }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check account status
  if (user.status !== 'active') {
    throw new AppError(`Account is ${user.status}. Please contact support.`, 403);
  }

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toOwnProfile(),
      token
    }
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toOwnProfile()
    }
  });
});

/**
 * Logout (client-side token removal, but we can log it)
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // This endpoint exists for logging/analytics purposes
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});
