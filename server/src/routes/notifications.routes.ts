import { Router } from 'express';
import { subscribe, unsubscribe, sendTest } from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth';

export const notificationRoutes = Router();

notificationRoutes.post('/subscribe', authMiddleware, subscribe);
notificationRoutes.delete('/subscribe', authMiddleware, unsubscribe);
notificationRoutes.post('/test', authMiddleware, sendTest);
