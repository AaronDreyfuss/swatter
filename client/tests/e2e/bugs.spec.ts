import { test, expect, APIRequestContext, Page } from '@playwright/test';

const password = 'password123';

async function createVerifiedUser(
  request: APIRequestContext,
  email: string
): Promise<{ token: string; user: { id: string; email: string } }> {
  await request.post('/api/auth/register', { data: { email, password } });
  const codeRes = await request.get(
    `/api/test/verification-code?email=${encodeURIComponent(email)}`
  );
  const { verificationCode: code } = await codeRes.json();
  const verifyRes = await request.post('/api/auth/verify', { data: { email, code } });
  return verifyRes.json();
}

async function createProject(
  request: APIRequestContext,
  token: string,
  name: string
): Promise<{ id: string; name: string; inviteCode: string }> {
  const res = await request.post('/api/projects', {
    data: { name },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function joinProject(
  request: APIRequestContext,
  token: string,
  inviteCode: string
): Promise<void> {
  await request.post('/api/projects/join', {
    data: { inviteCode },
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createBug(
  request: APIRequestContext,
  token: string,
  projectId: string,
  title: string,
  overrides: { severity?: string } = {}
): Promise<{ id: string; title: string; status: string; severity: string }> {
  const res = await request.post(`/api/projects/${projectId}/bugs`, {
    data: {
      title,
      description: 'Test description',
      expectedBehavior: 'It works',
      actualBehavior: 'It does not work',
      severity: overrides.severity ?? 'MEDIUM',
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function updateBug(
  request: APIRequestContext,
  token: string,
  projectId: string,
  bugId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await request.patch(`/api/projects/${projectId}/bugs/${bugId}`, {
    data: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function loginAs(
  page: Page,
  token: string,
  user: { id: string; email: string }
): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user }
  );
}

test('log a bug and see it appear in the list', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Bug Log Project');
  await loginAs(page, token, user);

  await page.goto(`/projects/${project.id}`);
  await page.getByRole('button', { name: 'Log a bug' }).click();

  await page.locator('[name="title"]').fill('Login page crashes');
  await page.locator('[name="description"]').fill('The login page crashes on submit');
  await page.locator('[name="expectedBehavior"]').fill('User is logged in');
  await page.locator('[name="actualBehavior"]').fill('Page crashes');
  await page.getByRole('button', { name: 'Log bug' }).click();

  await expect(page.getByRole('button', { name: 'Login page crashes' })).toBeVisible();
});

test('filter bugs by status and see correct results', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Status Filter Project');

  const openBug = await createBug(request, token, project.id, 'Open bug');
  const progressBug = await createBug(request, token, project.id, 'In progress bug');
  await updateBug(request, token, project.id, progressBug.id, { status: 'IN_PROGRESS' });

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}`);

  await page.locator('[name="statusFilter"]').selectOption('IN_PROGRESS');
  await expect(page.getByRole('button', { name: 'In progress bug' })).toBeVisible();
  await expect(page.getByRole('button', { name: openBug.title })).not.toBeVisible();

  await page.locator('[name="statusFilter"]').selectOption('OPEN');
  await expect(page.getByRole('button', { name: openBug.title })).toBeVisible();
  await expect(page.getByRole('button', { name: 'In progress bug' })).not.toBeVisible();
});

test('filter bugs by severity and see correct results', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Severity Filter Project');

  await createBug(request, token, project.id, 'Low severity bug', { severity: 'LOW' });
  await createBug(request, token, project.id, 'High severity bug', { severity: 'HIGH' });

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}`);

  await page.locator('[name="severityFilter"]').selectOption('HIGH');
  await expect(page.getByRole('button', { name: 'High severity bug' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Low severity bug' })).not.toBeVisible();

  await page.locator('[name="severityFilter"]').selectOption('LOW');
  await expect(page.getByRole('button', { name: 'Low severity bug' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'High severity bug' })).not.toBeVisible();
});

test('edit a bug via the modal and see the changes reflected', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Edit Bug Project');
  await createBug(request, token, project.id, 'Original title');

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}`);

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Original title' })
    .getByRole('button', { name: 'Edit' })
    .click();

  await page.locator('[name="title"]').fill('Updated title');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByRole('button', { name: 'Updated title' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Original title' })).not.toBeVisible();
});

test('mark a bug as resolved and see the status update', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Resolve Bug Project');
  await createBug(request, token, project.id, 'Bug to resolve');

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}`);

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Bug to resolve' })
    .getByRole('button', { name: 'Edit' })
    .click();

  await page.locator('[name="status"]').selectOption('RESOLVED');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(
    page.getByRole('listitem').filter({ hasText: 'Bug to resolve' }).getByText('RESOLVED')
  ).toBeVisible();
});

test('clicking a bug navigates to BugDetail', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Navigate Bug Project');
  const bug = await createBug(request, token, project.id, 'Clickable bug');

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}`);
  await page.getByRole('button', { name: 'Clickable bug' }).click();

  await expect(page).toHaveURL(`/projects/${project.id}/bugs/${bug.id}`);
});

test('Admin sees the invite code on ProjectDetail', async ({ page, request }) => {
  const email = `admin${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);
  const project = await createProject(request, token, 'Admin Invite Project');

  await loginAs(page, token, user);
  await page.goto(`/projects/${project.id}`);

  await expect(page.getByText('Invite code:', { exact: false })).toBeVisible();
});

test('Admin assigns a bug to a member and the assignee name appears', async ({ page, request }) => {
  const adminEmail = `admin${Date.now()}@example.com`;
  const memberEmail = `member${Date.now()}@example.com`;

  const { token: adminToken, user: adminUser } = await createVerifiedUser(request, adminEmail);
  const { token: memberToken } = await createVerifiedUser(request, memberEmail);
  const project = await createProject(request, adminToken, 'Assign Bug Project');
  await joinProject(request, memberToken, project.inviteCode);
  const bug = await createBug(request, adminToken, project.id, 'Assignable bug');

  await loginAs(page, adminToken, adminUser);
  await page.goto(`/projects/${project.id}/bugs/${bug.id}`);

  // scope to span to avoid matching the <option value="">Unassigned</option> in the dropdown
  await expect(page.locator('span', { hasText: 'Unassigned' })).toBeVisible();
  await page.getByRole('combobox').selectOption({ label: memberEmail });

  await expect(page.locator('span', { hasText: 'Unassigned' })).not.toBeVisible();
  // admin email != member email, so the member email only appears in the badge
  await expect(page.locator('span', { hasText: memberEmail })).toBeVisible();
});

test('Member can claim an unassigned bug and sees themselves as assignee', async ({ page, request }) => {
  const adminEmail = `admin${Date.now()}@example.com`;
  const memberEmail = `member${Date.now()}@example.com`;

  const { token: adminToken } = await createVerifiedUser(request, adminEmail);
  const { token: memberToken, user: memberUser } = await createVerifiedUser(request, memberEmail);
  const project = await createProject(request, adminToken, 'Claim Bug Project');
  await joinProject(request, memberToken, project.inviteCode);
  const bug = await createBug(request, adminToken, project.id, 'Claimable bug');

  await loginAs(page, memberToken, memberUser);
  await page.goto(`/projects/${project.id}/bugs/${bug.id}`);

  await expect(page.getByText('Unassigned')).toBeVisible();
  await page.getByRole('button', { name: 'Claim' }).click();

  // after claiming the Unassign button appears - that confirms the assignment went through
  await expect(page.locator('span', { hasText: 'Unassigned' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Unassign' })).toBeVisible();
});

test('Member does not see the invite code on ProjectDetail', async ({ page, request }) => {
  const adminEmail = `admin${Date.now()}@example.com`;
  const memberEmail = `member${Date.now()}@example.com`;

  const { token: adminToken } = await createVerifiedUser(request, adminEmail);
  const project = await createProject(request, adminToken, 'Member Invite Project');

  const { token: memberToken, user: memberUser } = await createVerifiedUser(
    request,
    memberEmail
  );
  await joinProject(request, memberToken, project.inviteCode);

  await loginAs(page, memberToken, memberUser);
  await page.goto(`/projects/${project.id}`);

  await expect(page.getByText('Invite code:', { exact: false })).not.toBeVisible();
});
