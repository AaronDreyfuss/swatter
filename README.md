# Swatter

A bug tracker for small teams.

---

## Features

**Auth**
- Register with email and password - account starts unverified
- 5-digit verification code sent to your email (expires after 15 minutes)
- Resend code if it expires
- JWT-based sessions, passwords hashed with bcrypt
- Rate limiting on register and login to prevent abuse

**Projects**
- Create a project and become its Admin
- Share a unique 8-character invite code for others to join
- Admins can remove members or promote them to Admin
- Invite code is only visible to Admins

**Bugs**
- Log bugs with title, description, expected vs. actual behavior, optional error/stack trace
- Set severity: Low, Medium, High, Critical
- Status moves from Open to In Progress to Resolved
- Filter the bug list by status or severity
- Admins can assign bugs to any project member
- Members can claim unassigned bugs or unassign themselves
- Only the bug creator or an Admin can edit or delete a bug

**Comments**
- Any member can comment on a bug
- Comments appear in chronological order
- Authors can edit their own comments; Admins can delete any comment

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express, Node.js, TypeScript (strict mode) |
| Database | PostgreSQL (Docker), Prisma ORM |
| Auth | JWT, bcrypt |
| Validation | Zod |
| Email (dev) | Nodemailer + Mailtrap SMTP sandbox |
| Email (prod) | Resend |
| Unit/Integration tests | Vitest, Supertest |
| E2E tests | Playwright |

---

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for PostgreSQL)

### 1. Clone the repo

```bash
git clone https://github.com/AaronDreyfuss/swatter.git
cd swatter
```

### 2. Install dependencies

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Start the databases

```bash
docker compose up -d
```

Two containers start - dev on port 5434, test on port 5435.

### 4. Create environment files

**`server/.env`**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/postgres"
JWT_SECRET="any-long-random-string"
NODE_ENV=development
MAILTRAP_USER="your_mailtrap_user"
MAILTRAP_PASS="your_mailtrap_pass"
RESEND_API_KEY="your_resend_api_key"
```

Mailtrap captures outgoing emails without hitting real inboxes. Create a free account at [mailtrap.io](https://mailtrap.io), then find your SMTP credentials under **Inboxes → your inbox → SMTP Settings**. `RESEND_API_KEY` is only needed for production.

**`server/.env.test`**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/postgres"
JWT_SECRET="test_secret"
NODE_ENV=test
```

### 5. Run database migrations

```bash
cd server && npx prisma migrate deploy && cd ..
```

This runs migrations against the development database. To also set up the test database:

```bash
cd server && DATABASE_URL="postgresql://postgres:postgres@localhost:5435/postgres" npx prisma migrate deploy && cd ..
```

### 6. Start the app

```bash
npm run dev
```

This starts the Express server on port 3000 and the Vite dev server on port 5173. Open [http://localhost:5173](http://localhost:5173).

---

## Testing

### Unit and integration tests (Vitest)

Runs 69 tests covering auth, projects, bugs, and comments.

```bash
npm test
```

### E2E tests (Playwright)

Runs 30 browser tests. Playwright starts both servers automatically - no manual setup needed.

```bash
npm run test:e2e
```

To view the Playwright test report after a run:

```bash
npm --prefix client exec -- playwright show-report
```

---

## Project Structure

```
swatter/
├── server/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── routes/          # Express routers
│       ├── middleware/       # Auth and role enforcement
│       ├── schemas/         # Zod validation schemas
│       ├── lib/             # Prisma client, Resend client
│       ├── server.ts        # Express app
│       └── start.ts         # Server entry point
└── client/
    └── src/
        ├── pages/           # React page components
        ├── components/      # Shared UI components
        ├── hooks/           # Data fetching and mutation hooks
        ├── context/         # Auth context
        ├── api/             # Axios instance
        └── types/           # Shared TypeScript interfaces
```
