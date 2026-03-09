import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getCategories, createCategory, deleteCategory } from '../controllers/categories.controller';

export const categoryRoutes = Router();

categoryRoutes.use(authMiddleware);
categoryRoutes.get('/', getCategories);
categoryRoutes.post('/', createCategory);
categoryRoutes.delete('/:id', deleteCategory);
