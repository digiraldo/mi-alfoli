import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  updateBalance,
  getAccountStats,
  setDefaultAccount,
} from '../controllers/accounts.controller';

export const accountRoutes = Router();

accountRoutes.use(authMiddleware);
accountRoutes.get('/', getAccounts);
accountRoutes.post('/', createAccount);
accountRoutes.put('/:id', updateAccount);
accountRoutes.delete('/:id', deleteAccount);
accountRoutes.patch('/:id/balance', updateBalance);
accountRoutes.patch('/:id/default', setDefaultAccount);
accountRoutes.get('/:id/stats', getAccountStats);
