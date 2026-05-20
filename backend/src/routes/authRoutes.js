import express from 'express';
import { register, login, getMe, refreshToken, changePassword, createUser } from '../controllers/authController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (require authentication)
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

// Admin-only routes
router.post('/admin/create-user', authenticate, authorizeRole('ADMIN'), createUser);

export default router;
