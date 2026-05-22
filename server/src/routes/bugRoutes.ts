import { Router } from 'express';
import { Role } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import bugController from '../controllers/bugController';

const router = Router();

router.use(authMiddleware);

router.post(
  '/:projectId/bugs',
  roleMiddleware(Role.MEMBER),
  bugController.createBug,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

export default router;
