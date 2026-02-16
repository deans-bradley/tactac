import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { registerValidation, loginValidation } from '../middleware/validation.middleware.js';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
