import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { createProjectSchema } from '../schemas/projectSchemas';
import { generateInviteCode } from '../lib/inviteCode';

const projectController = {
  createProject: async (req: Request, res: Response, next: NextFunction) => {
    const result = createProjectSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { name } = result.data;
    const userId = req.user!.id;

    try {
      // transaction ensures the project and its admin membership are created together
      const project = await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: { name, inviteCode: generateInviteCode() },
        });

        await tx.projectMember.create({
          data: { userId, projectId: created.id, role: Role.ADMIN },
        });

        return created;
      });

      res.locals.data = project;
      res.locals.status = 201;
      return next();
    } catch (err) {
      return next(err);
    }
  },
  getProjects: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user!.id;

    try {
      const memberships = await prisma.projectMember.findMany({
        where: { userId },
        include: { project: true },
      });

      const projects = memberships.map(({ project, role }) => ({ ...project, role }));

      res.locals.data = projects;
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },
};

export default projectController;
