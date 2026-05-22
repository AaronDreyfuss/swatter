import { NextFunction, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createBugSchema } from '../schemas/bugSchemas';

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
};

export default bugController;
