import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server';
import prisma from '../../src/lib/prisma';
import { resetDb } from '../helpers/setupDb';
import { createTestUser, createTestProject } from '../helpers/factories';

vi.mock('../../src/lib/resend', () => ({
  default: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

const BASE = '/api/projects';

beforeEach(async () => {
  await resetDb();
});

async function createUserWithToken(overrides: { email?: string } = {}) {
  const user = await createTestUser(overrides);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: 'password123' });
  return { user, token: res.body.token as string };
}

describe('POST /api/projects', () => {
  it('creates a project and returns 201', async () => {
    const { token } = await createUserWithToken();

    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Project' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('My Project');
    expect(res.body.inviteCode).toHaveLength(8);
  });

  it('adds the creator as Admin in ProjectMember', async () => {
    const { user, token } = await createUserWithToken();

    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Project' });

    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId: res.body.id } },
    });

    expect(member?.role).toBe('ADMIN');
  });
});

describe('GET /api/projects', () => {
  it('returns only projects the user belongs to', async () => {
    const { user: user1, token: token1 } = await createUserWithToken();
    const { user: user2 } = await createUserWithToken({ email: `user2-${Date.now()}@example.com` });

    await createTestProject(user1.id, { name: 'User1 Project' });
    await createTestProject(user2.id, { name: 'User2 Project' });

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('User1 Project');
  });
});

describe('GET /api/projects/:projectId', () => {
  it('returns the project with the requesting user role', async () => {
    const { user, token } = await createUserWithToken();
    const project = await createTestProject(user.id);

    const res = await request(app)
      .get(`${BASE}/${project.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(res.body.role).toBe('ADMIN');
  });

  it('includes invite code for Admin', async () => {
    const { user, token } = await createUserWithToken();
    const project = await createTestProject(user.id);

    const res = await request(app)
      .get(`${BASE}/${project.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.inviteCode).toBeTruthy();
  });

  it('excludes invite code for Member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    await request(app)
      .post(`${BASE}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .get(`${BASE}/${project.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.body.inviteCode).toBeUndefined();
  });
});

describe('GET /api/projects/:projectId/members', () => {
  it('returns all members with userId, email, and role', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    await request(app)
      .post(`${BASE}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .get(`${BASE}/${project.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const adminEntry = res.body.find((m: { email: string }) => m.email === admin.email);
    const memberEntry = res.body.find((m: { email: string }) => m.email === member.email);

    expect(adminEntry.role).toBe('ADMIN');
    expect(adminEntry.userId).toBe(admin.id);
    expect(memberEntry.role).toBe('MEMBER');
    expect(memberEntry.userId).toBe(member.id);
  });

  it('returns 403 for a non-member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: outsiderToken } = await createUserWithToken({ email: `outsider-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .get(`${BASE}/${project.id}/members`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/projects/join', () => {
  it('adds the user as Member with a valid invite code', async () => {
    const { user: admin } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .post(`${BASE}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: project.inviteCode });

    expect(res.status).toBe(200);

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: member.id, projectId: project.id } },
    });
    expect(membership?.role).toBe('MEMBER');
  });

  it('returns 404 with an invalid invite code', async () => {
    const { token } = await createUserWithToken();

    const res = await request(app)
      .post(`${BASE}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode: 'INVALID1' });

    expect(res.status).toBe(404);
  });

  it('returns 409 when already a member', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .post(`${BASE}/join`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ inviteCode: project.inviteCode });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/projects/:projectId/members/:userId', () => {
  it('Admin can remove a member', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    await request(app)
      .post(`${BASE}/join`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .delete(`${BASE}/${project.id}/members/${member.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: member.id, projectId: project.id } },
    });
    expect(membership).toBeNull();
  });

  it('returns 403 for a Member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: member1Token } = await createUserWithToken({ email: `m1-${Date.now()}@example.com` });
    const { user: member2, token: member2Token } = await createUserWithToken({ email: `m2-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    await request(app).post(`${BASE}/join`).set('Authorization', `Bearer ${member1Token}`).send({ inviteCode: project.inviteCode });
    await request(app).post(`${BASE}/join`).set('Authorization', `Bearer ${member2Token}`).send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .delete(`${BASE}/${project.id}/members/${member2.id}`)
      .set('Authorization', `Bearer ${member1Token}`);

    expect(res.status).toBe(403);
  });

  it('returns 400 when removing the last admin', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .delete(`${BASE}/${project.id}/members/${admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/projects/:projectId/members/:userId/role', () => {
  it('Admin can change a member role', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const { user: member, token: memberToken } = await createUserWithToken({ email: `member-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    await request(app).post(`${BASE}/join`).set('Authorization', `Bearer ${memberToken}`).send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .patch(`${BASE}/${project.id}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ADMIN');
  });

  it('returns 403 for a Member', async () => {
    const { user: admin } = await createUserWithToken();
    const { token: member1Token } = await createUserWithToken({ email: `m1-${Date.now()}@example.com` });
    const { user: member2, token: member2Token } = await createUserWithToken({ email: `m2-${Date.now()}@example.com` });
    const project = await createTestProject(admin.id);

    await request(app).post(`${BASE}/join`).set('Authorization', `Bearer ${member1Token}`).send({ inviteCode: project.inviteCode });
    await request(app).post(`${BASE}/join`).set('Authorization', `Bearer ${member2Token}`).send({ inviteCode: project.inviteCode });

    const res = await request(app)
      .patch(`${BASE}/${project.id}/members/${member2.id}/role`)
      .set('Authorization', `Bearer ${member1Token}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
  });

  it('returns 400 when demoting the last admin', async () => {
    const { user: admin, token: adminToken } = await createUserWithToken();
    const project = await createTestProject(admin.id);

    const res = await request(app)
      .patch(`${BASE}/${project.id}/members/${admin.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MEMBER' });

    expect(res.status).toBe(400);
  });
});
