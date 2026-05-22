import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/lib/prisma';
import { resetDb } from '../helpers/setupDb';

vi.mock('../../src/lib/resend', () => ({
  default: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

const BASE = '/api/auth';

beforeEach(async () => {
  await resetDb();
});

describe('POST /api/auth/register', () => {
  it('creates an unverified account and returns 201', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    expect(user?.isVerified).toBe(false);
    expect(user?.verificationCode).toBeTruthy();
  });

  it('returns 409 with a duplicate email', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('returns 400 with a malformed email', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 with missing fields', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify', () => {
  it('verifies with correct code and returns a JWT', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });

    const res = await request(app)
      .post(`${BASE}/verify`)
      .send({ email: 'test@example.com', code: user!.verificationCode });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');

    const updated = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    expect(updated?.isVerified).toBe(true);
    expect(updated?.verificationCode).toBeNull();
  });

  it('returns 400 with a wrong code', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post(`${BASE}/verify`)
      .send({ email: 'test@example.com', code: '00000' });

    expect(res.status).toBe(400);
  });

  it('returns 400 with an expired code', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    await prisma.user.update({
      where: { email: 'test@example.com' },
      data: { verificationExpiry: new Date(Date.now() - 1000) },
    });

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });

    const res = await request(app)
      .post(`${BASE}/verify`)
      .send({ email: 'test@example.com', code: user!.verificationCode });

    expect(res.status).toBe(400);
  });

  it('returns 400 when account is already verified', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });

    await request(app)
      .post(`${BASE}/verify`)
      .send({ email: 'test@example.com', code: user!.verificationCode });

    // code is now null - second attempt should fail
    const res = await request(app)
      .post(`${BASE}/verify`)
      .send({ email: 'test@example.com', code: user!.verificationCode });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/resend-code', () => {
  it('generates a new code and returns 200', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const before = await prisma.user.findUnique({ where: { email: 'test@example.com' } });

    const res = await request(app)
      .post(`${BASE}/resend-code`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);

    const after = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    expect(after?.verificationCode).not.toBe(before?.verificationCode);
  });

  it('returns 400 for an already verified account', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });

    await request(app)
      .post(`${BASE}/verify`)
      .send({ email: 'test@example.com', code: user!.verificationCode });

    const res = await request(app)
      .post(`${BASE}/resend-code`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  async function registerAndVerify(email: string) {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: 'password123' });

    const user = await prisma.user.findUnique({ where: { email } });

    await request(app)
      .post(`${BASE}/verify`)
      .send({ email, code: user!.verificationCode });
  }

  it('returns a JWT for a verified account', async () => {
    await registerAndVerify('test@example.com');

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('returns 403 for an unverified account', async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(403);
  });

  it('returns 401 with wrong password', async () => {
    await registerAndVerify('test@example.com');

    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with a nonexistent email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});
