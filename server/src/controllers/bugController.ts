import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createBugSchema, getBugsQuerySchema } from '../schemas/bugSchemas';

const bugController = {
  createBug: async (req: Request, res: Response, next: NextFunction) => {
    const result = createBugSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { title, description, expectedBehavior, actualBehavior, errorMessage, severity } = result.data;
    const { projectId } = req.params;
    const creatorId = req.user!.id;

    try {
      const bug = await prisma.bug.create({
        data: {
          title,
          description,
          expectedBehavior,
          actualBehavior,
          errorMessage,
          severity,
          projectId,
          creatorId,
          assignedToId: null,
        },
      });

      res.locals.data = bug;
      res.locals.status = 201;
      return next();
    } catch (err) {
      return next(err);
    }
  },
  getBug: async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, bugId } = req.params;

    try {
      const bug = await prisma.bug.findFirst({
        where: { id: bugId, projectId },
        include: {
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, email: true } },
            },
          },
        },
      });

      if (!bug) {
        return res.status(404).json({ err: 'Bug not found' });
      }

      res.locals.data = bug;
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  getBugs: async (req: Request, res: Response, next: NextFunction) => {
    const queryResult = getBugsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({ err: queryResult.error.errors[0].message });
    }

    const { projectId } = req.params;
    const { status, severity } = queryResult.data;

    try {
      const bugs = await prisma.bug.findMany({
        where: {
          projectId,
          ...(status ? { status } : {}),
          ...(severity ? { severity } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      res.locals.data = bugs;
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },
};

export default bugController;
