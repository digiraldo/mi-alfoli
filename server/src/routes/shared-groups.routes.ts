import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { 
  getSharedGroups, 
  createSharedGroup, 
  getSharedGroupById, 
  joinSharedGroup,
  calculateBalances
} from '../controllers/shared-groups.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// CRUD Básico de los Grupos
router.get('/', getSharedGroups);
router.post('/', createSharedGroup);
router.get('/:id', getSharedGroupById);

// Funciones Avanzadas del Splitwise Local
router.post('/:groupId/join', joinSharedGroup);
router.get('/:id/balances', calculateBalances);

export default router;
