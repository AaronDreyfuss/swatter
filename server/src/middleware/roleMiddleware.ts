import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';

// Returns middleware that checks the user is a member of the project.
// Pass Role.ADMIN to require admin specifically - Role.MEMBER allows any member.
const roleMiddleware = (role: Role) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const { projectId } = req.params;

    try {
      const member = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
      });

      if (!member) {
        res.status(403).json({ err: 'Access denied' });
        return;
      }

      if (role === Role.ADMIN && member.role !== Role.ADMIN) {
        res.status(403).json({ err: 'Access denied' });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default roleMiddleware;
