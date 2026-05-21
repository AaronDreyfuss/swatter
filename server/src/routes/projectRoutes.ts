import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
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

router.post(
  '/',
  projectController.createProject,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

export default router;
