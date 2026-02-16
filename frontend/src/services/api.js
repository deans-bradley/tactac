import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    
    // Handle 401 (unauthorized) - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject({ ...error, message });
  }
);

export default api;

// Auth API
export const authApi = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// User API
export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  getUserPosts: (username, page = 1, limit = 20) => 
    api.get(`/users/${username}/posts?page=${page}&limit=${limit}`),
  updateProfile: (data) => {
    const formData = new FormData();
    if (data.username) formData.append('username', data.username);
    if (data.bio !== undefined) formData.append('bio', data.bio);
    if (data.profileImage) formData.append('profileImage', data.profileImage);
    return api.patch('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateEmail: (email, currentPassword) => 
    api.patch('/users/email', { email, currentPassword }),
  updatePassword: (currentPassword, newPassword) => 
    api.patch('/users/password', { currentPassword, newPassword }),
  deleteAccount: (password) => 
    api.delete('/users/account', { data: { password } })
};

// Post API
export const postApi = {
  getFeed: (page = 1, limit = 20, filter = 'recent') => 
    api.get(`/posts?page=${page}&limit=${limit}&filter=${filter}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  createPost: (image, caption) => {
    const formData = new FormData();
    formData.append('image', image);
    if (caption) formData.append('caption', caption);
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updatePost: (postId, caption) => api.patch(`/posts/${postId}`, { caption }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.delete(`/posts/${postId}/like`),
  getComments: (postId, page = 1, limit = 20) => 
    api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`)
};

// Comment API
export const commentApi = {
  createComment: (postId, content) => api.post(`/comments/${postId}`, { content }),
  updateComment: (commentId, content) => api.patch(`/comments/${commentId}`, { content }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`)
};

// Admin API
export const adminApi = {
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (page = 1, limit = 20, search = '', status = '') => 
    api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}&status=${status}`),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.patch(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  deleteComment: (commentId) => api.delete(`/admin/comments/${commentId}`)
};
