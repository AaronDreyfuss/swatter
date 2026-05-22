import { Router } from 'express';
import { Role } from '@prisma/client';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import commentController from '../controllers/commentController';
import respond from '../lib/respond';

const router = Router();

router.use(authMiddleware);

router.post(
  '/:projectId/bugs/:bugId/comments',
  roleMiddleware(Role.MEMBER),
  commentController.createComment,
  respond
);

router.patch(
  '/:projectId/bugs/:bugId/comments/:commentId',
  roleMiddleware(Role.MEMBER),
  commentController.updateComment,
  respond
);

export default router;
