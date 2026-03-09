import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  depositToGoal,
  withdrawFromGoal,
  getWithdrawals,
} from '../controllers/savings.controller';
import { authMiddleware } from '../middleware/auth';

export const savingsRoutes = Router();

savingsRoutes.get('/', authMiddleware, getGoals);
savingsRoutes.post('/', authMiddleware, createGoal);
savingsRoutes.put('/:id', authMiddleware, updateGoal);
savingsRoutes.delete('/:id', authMiddleware, deleteGoal);
savingsRoutes.post('/:id/deposit', authMiddleware, depositToGoal);
savingsRoutes.post('/:id/withdraw', authMiddleware, withdrawFromGoal);
savingsRoutes.get('/:id/withdrawals', authMiddleware, getWithdrawals);
