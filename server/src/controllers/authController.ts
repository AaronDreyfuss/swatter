import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import resend from '../lib/resend';
import { JwtPayload } from '../middleware/authMiddleware';
import { registerSchema, verifySchema, resendCodeSchema, loginSchema } from '../schemas/authSchemas';

const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ err: 'Email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      // crypto.randomInt is cryptographically secure unlike Math.random
      const code = crypto.randomInt(10000, 100000).toString();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          verificationCode: code,
          verificationExpiry: expiry,
        },
      });

      if (process.env.NODE_ENV !== 'test') {
        if (process.env.NODE_ENV === 'production') {
          const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: 'Your Swatter verification code',
            html: `<p>Your verification code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
          });
          if (error) console.error('Resend error:', error);
        } else {
          const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS },
          });
          await transporter.sendMail({
            from: 'Swatter <noreply@swatter.com>',
            to: email,
            subject: 'Your Swatter verification code',
            html: `<p>Your verification code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
          });
        }
      }

      res.locals.data = { email: user.email };
      res.locals.status = 201;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  verify: async (req: Request, res: Response, next: NextFunction) => {
    const result = verifySchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { email, code } = result.data;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ err: 'User not found' });
      }

      if (user.verificationCode !== code) {
        return res.status(400).json({ err: 'Invalid verification code' });
      }

      if (!user.verificationExpiry || user.verificationExpiry < new Date()) {
        return res.status(400).json({ err: 'Verification code has expired' });
      }

      const updated = await prisma.user.update({
        where: { email },
        data: { isVerified: true, verificationCode: null, verificationExpiry: null },
      });

      const payload: JwtPayload = { id: updated.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

      res.locals.data = { token, user: { id: updated.id, email: updated.email } };
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  resendCode: async (req: Request, res: Response, next: NextFunction) => {
    const result = resendCodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { email } = result.data;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ err: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ err: 'Account is already verified' });
      }

      const code = crypto.randomInt(10000, 100000).toString();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { email },
        data: { verificationCode: code, verificationExpiry: expiry },
      });

      if (process.env.NODE_ENV !== 'test') {
        if (process.env.NODE_ENV === 'production') {
          const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM!,
            to: email,
            subject: 'Your new Swatter verification code',
            html: `<p>Your new verification code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
          });
          if (error) console.error('Resend error:', error);
        } else {
          const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            auth: { user: process.env.MAILTRAP_USER, pass: process.env.MAILTRAP_PASS },
          });
          await transporter.sendMail({
            from: 'Swatter <noreply@swatter.com>',
            to: email,
            subject: 'Your new Swatter verification code',
            html: `<p>Your new verification code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
          });
        }
      }

      res.locals.data = { message: 'A new verification code has been sent to your email.' };
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ err: result.error.errors[0].message });
    }

    const { email, password } = result.data;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      // always run bcrypt even if user not found to avoid leaking timing information
      const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

      if (!user || !passwordMatch) {
        return res.status(401).json({ err: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res.status(403).json({ err: 'Account not verified' });
      }

      const payload: JwtPayload = { id: user.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });

      res.locals.data = { token, user: { id: user.id, email: user.email } };
      res.locals.status = 200;
      return next();
    } catch (err) {
      return next(err);
    }
  },
};

export default authController;