import { Router } from 'express';
import { Role } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import projectController from '../controllers/projectController';
import respond from '../lib/respond';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  projectController.getProjects,
  respond
);

router.get(
  '/:projectId',
  projectController.getProject,
  respond
);

router.get(
  '/:projectId/members',
  projectController.getMembers,
  respond
);

router.post(
  '/join',
  projectController.joinProject,
  respond
);

router.post(
  '/',
  projectController.createProject,
  respond
);

router.delete(
  '/:projectId/members/:userId',
  roleMiddleware(Role.ADMIN),
  projectController.removeMember,
  respond
);

router.patch(
  '/:projectId/members/:userId/role',
  roleMiddleware(Role.ADMIN),
  projectController.changeMemberRole,
  respond
);

export default router;
