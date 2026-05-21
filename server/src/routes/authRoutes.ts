import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV === 'test', // prevent test suite from hitting rate limit
});

router.post(
  '/register',
  authLimiter,
  authController.register,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.post(
  '/login',
  authLimiter,
  authController.login,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.post(
  '/verify',
  authController.verify,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

router.post(
  '/resend-code',
  authController.resendCode,
  (_req, res) => res.status(res.locals.status as number).json(res.locals.data)
);

export default router;
