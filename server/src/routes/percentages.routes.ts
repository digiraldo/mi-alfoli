import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getRules, createRule, updateRule, deleteRule, getExecution } from '../controllers/percentages.controller';

export const percentageRoutes = Router();

percentageRoutes.use(authMiddleware);
percentageRoutes.get('/', getRules);
percentageRoutes.post('/', createRule);
percentageRoutes.put('/:id', updateRule);
percentageRoutes.delete('/:id', deleteRule);
percentageRoutes.get('/execution', getExecution);
