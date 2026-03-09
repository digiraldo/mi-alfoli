import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getBills, createBill, updateBill, deleteBill, markPaid } from '../controllers/bills.controller';

export const billRoutes = Router();

billRoutes.use(authMiddleware);
billRoutes.get('/', getBills);
billRoutes.post('/', createBill);
billRoutes.put('/:id', updateBill);
billRoutes.delete('/:id', deleteBill);
billRoutes.post('/:id/mark-paid', markPaid);
