import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import { Role } from '@prisma/client';
import projectController from '../controllers/projectController';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  projectController.getProjects,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.get(
  '/:projectId',
  projectController.getProject,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.post(
  '/join',
  projectController.joinProject,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.delete(
  '/:projectId/members/:userId',
  roleMiddleware(Role.ADMIN),
  projectController.removeMember,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.patch(
  '/:projectId/members/:userId/role',
  roleMiddleware(Role.ADMIN),
  projectController.changeMemberRole,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.post(
  '/',
  projectController.createProject,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

export default router;
