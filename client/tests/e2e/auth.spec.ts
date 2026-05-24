import { test, expect, APIRequestContext } from '@playwright/test';

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

test('register redirects to Verify screen', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/verify');
});

test('entering correct code logs user in and lands on Projects', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/verify');

  const codeRes = await request.get(
    `/api/test/verification-code?email=${encodeURIComponent(email)}`
  );
  const { verificationCode: code } = await codeRes.json();

  await page.getByLabel('Verification code').fill(String(code));
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL('/projects');
});

test('entering wrong code shows an error message', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/verify');

  await page.getByLabel('Verification code').fill('00000');
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByText('Invalid verification code')).toBeVisible();
});

test('resend code button triggers a new code and shows a success message', async ({ page }) => {
  const email = `user${Date.now()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/verify');

  await page.getByRole('button', { name: 'Resend code' }).click();
  await expect(page.getByText('A new code has been sent to your email.')).toBeVisible();
});

test('login with verified account lands on Projects', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  await createVerifiedUser(request, email);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL('/projects');
});

test('login with unverified account shows an error message', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  await request.post('/api/auth/register', { data: { email, password } });

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Account not verified')).toBeVisible();
});

test('login with wrong password shows an error message', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  await createVerifiedUser(request, email);

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('wrongpassword');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Invalid credentials')).toBeVisible();
});

test('logged in user visiting /login is redirected to /projects', async ({ page, request }) => {
  const email = `user${Date.now()}@example.com`;
  const { token, user } = await createVerifiedUser(request, email);

  await page.goto('/');
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { token, user }
  );

  await page.goto('/login');
  await expect(page).toHaveURL('/projects');
});

test('logged out user visiting /projects is redirected to /', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL('/');
});
