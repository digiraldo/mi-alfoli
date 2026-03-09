import { Router } from 'express';
import { register, login, googleLogin, refreshToken, logout, me, updateProfile, changePassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/google', googleLogin);
authRoutes.post('/refresh-token', refreshToken);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authMiddleware, me);
authRoutes.put('/profile', authMiddleware, updateProfile);
authRoutes.put('/profile/password', authMiddleware, changePassword);
