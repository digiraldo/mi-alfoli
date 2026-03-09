import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions.controller';

export const transactionRoutes = Router();

transactionRoutes.use(authMiddleware);
transactionRoutes.get('/', getTransactions);
transactionRoutes.post('/', createTransaction);
transactionRoutes.put('/:id', updateTransaction);
transactionRoutes.delete('/:id', deleteTransaction);
