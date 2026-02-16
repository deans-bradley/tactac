# TacTac

A dynamic photo sharing application built with React, Node.js, Express, and MongoDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js->=22.14.0-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/deans-bradley/project-tools)

## Features

### User Roles & Access Control
- **Admin**: Full access to manage users, posts, comments, and system metrics
- **User**: Create posts, like, comment, and manage own profile

### User Account Management
- Registration with email, username, and password validation
- Login with email or username
- JWT-based session management
- Profile update (username, bio, profile image)
- Account deletion with cascade

### Posts
- Create posts with image upload (JPEG, PNG, GIF, WebP)
- Cloud-based image storage and optimization with Cloudinary
- Caption support (max 500 characters)
- Edit and delete own posts

### Social Features
- Like/unlike posts
- Comment on posts
- Edit and delete own comments

### Feed
- Recent posts (reverse chronological)
- Trending posts (most liked in last 7 days)
- Pagination support

### Admin Dashboard
- System metrics (users, posts, comments, likes)
- User management (view, suspend, activate, delete)
- Content moderation (delete any post/comment)

## Tech Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for cloud image storage and transformations
- **Multer** for file upload handling
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **Helmet** for security headers

### Frontend
- **React 18** with React Router v6
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **date-fns** for date formatting

## Getting Started

### Prerequisites
- Node.js 22+
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/tactac
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   FRONTEND_URL=http://localhost:3000
   ```

   > **Cloudinary Setup**: Sign up at [cloudinary.com](https://cloudinary.com) and get your credentials from the dashboard.

5. Start the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/posts` - Get user's posts
- `PATCH /api/users/profile` - Update own profile
- `PATCH /api/users/email` - Update email
- `PATCH /api/users/password` - Update password
- `DELETE /api/users/account` - Delete account

### Posts
- `GET /api/posts` - Get feed posts (with filter: recent/trending)
- `GET /api/posts/:postId` - Get single post
- `POST /api/posts` - Create post
- `PATCH /api/posts/:postId` - Update post caption
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like post
- `DELETE /api/posts/:postId/like` - Unlike post
- `GET /api/posts/:postId/comments` - Get post comments

### Comments
- `POST /api/comments/:postId` - Create comment
- `PATCH /api/comments/:commentId` - Update comment
- `DELETE /api/comments/:commentId` - Delete comment

### Admin
- `GET /api/admin/metrics` - Get system metrics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PATCH /api/admin/users/:userId` - Update user (status/role)
- `DELETE /api/admin/users/:userId` - Delete user
- `DELETE /api/admin/posts/:postId` - Delete any post
- `DELETE /api/admin/comments/:commentId` - Delete any comment

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Input validation and sanitization
- XSS prevention
- Helmet security headers
- CORS configuration
- File type and size validation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Bradley Deans**
- GitHub: [@deans-bradley](https://github.com/deans-bradley)