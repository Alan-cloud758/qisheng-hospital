# Qisheng Hospital Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working vertical slice of the Qisheng Hospital platform: repo skeleton, Express/Prisma backend, Vue admin shell, uni-app patient shell, seed data, and tests for the appointment registration flow.

**Architecture:** Create a clean new repository that mirrors the structure and tooling style of `美贸商城`: separate `backend`, `frontend`, and `miniapp` packages with root-level command aggregation. The first slice keeps business logic focused on auth, hospital organization, doctor schedules, appointment slots, registrations, and simulated payments.

**Tech Stack:** Express 5, TypeScript, Prisma, MySQL/MariaDB, Redis-ready config, Zod, Vitest, Supertest, Vue 3, Vite, Element Plus, Pinia, Vue Router, uni-app.

---

## File Structure

Create these top-level files:

- `README.md`: project overview, setup steps, commands, remote information.
- `package.json`: root command aggregator, no npm workspace.
- `.gitignore`: Node, env, build, database, editor, and OS ignores.
- `.prettierrc.json`: shared formatting baseline.
- `.prettierignore`: generated and dependency ignores.
- `deploy/README.md`: deployment and environment notes.

Create backend files:

- `backend/package.json`: backend scripts and dependencies.
- `backend/tsconfig.json`: TypeScript build config.
- `backend/vitest.config.ts`: Vitest config.
- `backend/vitest.setup.ts`: test environment setup.
- `backend/.env.example`: backend environment variables.
- `backend/prisma/schema.prisma`: first-slice Prisma schema.
- `backend/prisma/seed.ts`: deterministic demo data.
- `backend/src/app.ts`: Express app factory and route registration.
- `backend/src/server.ts`: HTTP server startup and graceful shutdown.
- `backend/src/config/env.ts`: environment parsing.
- `backend/src/lib/prisma.ts`: Prisma client singleton.
- `backend/src/lib/password.ts`: password hashing helpers.
- `backend/src/middleware/auth.ts`: bearer-token authentication and role checks.
- `backend/src/routes/auth.ts`: login and current-user routes.
- `backend/src/routes/admin.ts`: admin dashboard and master data routes.
- `backend/src/routes/public.ts`: public department and doctor routes.
- `backend/src/routes/mini.ts`: patient miniapp flow routes.
- `backend/src/routes/staff.ts`: staff workbench routes.
- `backend/src/services/appointments.ts`: appointment booking rules.
- `backend/src/types/auth.ts`: auth payload types.
- `backend/src/app.test.ts`: health and readiness tests.
- `backend/src/routes/auth.test.ts`: auth tests.
- `backend/src/routes/mini.appointments.test.ts`: appointment flow tests.

Create frontend files:

- `frontend/package.json`: frontend scripts and dependencies.
- `frontend/index.html`: Vite entry HTML.
- `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`: TypeScript configs.
- `frontend/vite.config.ts`: Vite/Vitest config.
- `frontend/.env.example`: frontend API base URL.
- `frontend/src/main.ts`: Vue bootstrap.
- `frontend/src/App.vue`: root shell.
- `frontend/src/router/index.ts`: route table and guard.
- `frontend/src/stores/auth.ts`: auth store.
- `frontend/src/api/client.ts`: Axios client.
- `frontend/src/api/hospital.ts`: hospital API calls.
- `frontend/src/layouts/AdminLayout.vue`: admin layout.
- `frontend/src/pages/LoginPage.vue`: login page.
- `frontend/src/pages/DashboardPage.vue`: dashboard page.
- `frontend/src/pages/DepartmentsPage.vue`: organization page.
- `frontend/src/pages/SchedulesPage.vue`: schedule and slot page.
- `frontend/src/pages/RegistrationsPage.vue`: appointment list page.
- `frontend/src/pages/DoctorWorkbenchPage.vue`: doctor workbench.
- `frontend/src/pages/CashierWorkbenchPage.vue`: cashier workbench.
- `frontend/src/test/setup.ts`: test setup.
- `frontend/src/router/router.spec.ts`: route guard test.
- `frontend/src/pages/DashboardPage.spec.ts`: dashboard render test.

Create miniapp files:

- `miniapp/package.json`: miniapp scripts and dependencies.
- `miniapp/tsconfig.json`: TypeScript config.
- `miniapp/vite.config.ts`: uni-app Vite config.
- `miniapp/src/main.ts`: app bootstrap.
- `miniapp/src/App.vue`: app root.
- `miniapp/src/pages.json`: page registry.
- `miniapp/src/api/client.ts`: request wrapper.
- `miniapp/src/api/hospital.ts`: patient flow API calls.
- `miniapp/src/stores/session.ts`: patient session state.
- `miniapp/src/pages/home/index.vue`: patient home.
- `miniapp/src/pages/departments/index.vue`: department list.
- `miniapp/src/pages/doctors/index.vue`: doctor list.
- `miniapp/src/pages/appointments/confirm.vue`: appointment confirmation.
- `miniapp/src/pages/mine/index.vue`: mine page.
- `miniapp/src/utils/appointment.ts`: appointment formatting helpers.
- `miniapp/src/utils/appointment.spec.ts`: helper tests.

## Task 1: Repository Metadata

**Files:**
- Create: `README.md`
- Create: `package.json`
- Create: `.gitignore`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `deploy/README.md`

- [ ] **Step 1: Create repository metadata**

Write `package.json`:

```json
{
  "name": "qisheng-hospital",
  "private": true,
  "version": "0.1.0",
  "description": "启胜医院多端医疗平台",
  "scripts": {
    "backend:dev": "npm --prefix backend run dev",
    "backend:build": "npm --prefix backend run build",
    "backend:test": "npm --prefix backend run test",
    "backend:lint": "npm --prefix backend run lint",
    "frontend:dev": "npm --prefix frontend run dev",
    "frontend:build": "npm --prefix frontend run build",
    "frontend:test": "npm --prefix frontend run test",
    "frontend:lint": "npm --prefix frontend run lint",
    "miniapp:dev:h5": "npm --prefix miniapp run dev:h5",
    "miniapp:dev:mp-weixin": "npm --prefix miniapp run dev:mp-weixin",
    "miniapp:build:h5": "npm --prefix miniapp run build:h5",
    "miniapp:build:mp-weixin": "npm --prefix miniapp run build:mp-weixin",
    "miniapp:typecheck": "npm --prefix miniapp run typecheck",
    "test": "npm run backend:test && npm run frontend:test",
    "lint": "npm run backend:lint && npm run frontend:lint",
    "build": "npm run backend:build && npm run frontend:build && npm run miniapp:typecheck"
  }
}
```

Write `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
.idea/
.vscode/
.npm-cache/
.npm-cache-codex/
backend/src/generated/
frontend/auto-imports.d.ts
frontend/components.d.ts
miniapp/unpackage/
```

Write `.prettierrc.json`:

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 120,
  "trailingComma": "all"
}
```

Write `.prettierignore`:

```gitignore
node_modules/
dist/
coverage/
backend/src/generated/
miniapp/unpackage/
package-lock.json
```

Write `README.md` with the project overview, technology stack, setup commands, and remote URLs from the approved design.

Write `deploy/README.md` with required services: Node.js, MySQL/MariaDB, optional Redis, backend `.env`, and static frontend/miniapp build outputs.

- [ ] **Step 2: Verify metadata**

Run: `npm run`

Expected: npm lists the root scripts without reporting JSON parse errors.

- [ ] **Step 3: Commit**

```bash
git add README.md package.json .gitignore .prettierrc.json .prettierignore deploy/README.md
git commit -m "chore: add project metadata"
```

## Task 2: Backend Skeleton And Health Checks

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/vitest.config.ts`
- Create: `backend/vitest.setup.ts`
- Create: `backend/.env.example`
- Create: `backend/src/config/env.ts`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/app.test.ts`

- [ ] **Step 1: Write failing health tests**

Write `backend/src/app.test.ts`:

```typescript
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('app health checks', () => {
  it('returns process health', async () => {
    const response = await request(createApp()).get('/healthz')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true, service: 'qisheng-hospital-backend' })
  })

  it('returns readiness shape', async () => {
    const response = await request(createApp()).get('/readyz')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ ok: true, database: 'configured' })
  })
})
```

- [ ] **Step 2: Add backend package config**

Write `backend/package.json`:

```json
{
  "name": "qisheng-hospital-backend",
  "version": "0.1.0",
  "private": true,
  "main": "dist/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run --config vitest.config.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/adapter-mariadb": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.5.2",
    "helmet": "^8.2.0",
    "mysql2": "^3.15.2",
    "redis": "^5.12.1",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "^25.6.0",
    "@types/supertest": "^6.0.3",
    "eslint": "^9.39.1",
    "eslint-config-prettier": "^10.1.8",
    "prettier": "^3.6.2",
    "prisma": "^7.8.0",
    "supertest": "^7.1.4",
    "tsx": "^4.21.0",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.46.2",
    "vitest": "^4.0.7"
  }
}
```

Write `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

Write `backend/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'prisma/**/*.test.ts'],
  },
})
```

Write `backend/vitest.setup.ts`:

```typescript
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? 'test-secret-at-least-32-characters-long'
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mysql://root:password@localhost:3306/qisheng_hospital_test'
```

Write `backend/.env.example`:

```dotenv
NODE_ENV=development
PORT=3000
AUTH_SECRET=replace-with-at-least-32-characters
DATABASE_URL=mysql://root:password@localhost:3306/qisheng_hospital
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npm install && npm run test -- src/app.test.ts`

Expected: FAIL because `src/app.ts` does not exist.

- [ ] **Step 4: Implement app skeleton**

Write `backend/src/config/env.ts`:

```typescript
import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  AUTH_SECRET: z.string().min(32).default('development-secret-at-least-32-characters'),
  DATABASE_URL: z.string().min(1),
  REDIS_ENABLED: z.coerce.boolean().default(false),
  REDIS_URL: z.string().default('redis://localhost:6379'),
})

export const env = envSchema.parse(process.env)
```

Write `backend/src/app.ts`:

```typescript
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, service: 'qisheng-hospital-backend' })
  })

  app.get('/readyz', (_req, res) => {
    res.json({ ok: true, database: process.env.DATABASE_URL ? 'configured' : 'missing' })
  })

  return app
}
```

Write `backend/src/server.ts`:

```typescript
import type { Server } from 'node:http'
import { createApp } from './app'
import { env } from './config/env'

function setupGracefulShutdown(server: Server) {
  let shuttingDown = false

  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`Received ${signal}, shutting down gracefully...`)
    server.close((error) => {
      if (error) {
        console.error('HTTP server close failed:', error)
        process.exit(1)
      }
      process.exit(0)
    })
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

const server = createApp().listen(env.PORT, () => {
  console.log(`Qisheng Hospital backend listening on ${env.PORT}`)
})

setupGracefulShutdown(server)
```

- [ ] **Step 5: Run backend health tests**

Run: `cd backend && npm run test -- src/app.test.ts`

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit**

```bash
git add backend
git commit -m "feat: add backend health skeleton"
```

## Task 3: Prisma Schema And Seed Data

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/seed.ts`
- Create: `backend/src/lib/prisma.ts`

- [ ] **Step 1: Add Prisma schema**

Write `backend/prisma/schema.prisma` with these models: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `HospitalCampus`, `Department`, `ClinicRoom`, `DoctorProfile`, `PatientProfile`, `VisitMember`, `DoctorSchedule`, `AppointmentSlot`, `Registration`, `Encounter`, `MedicalRecord`, `Diagnosis`, `FeeItem`, `PaymentOrder`, `DrugCatalog`, `Prescription`, `PrescriptionItem`, `Announcement`, `AuditLog`.

Use string IDs with `@default(cuid())`, timestamps with `createdAt` and `updatedAt`, and enums for `UserStatus`, `AppointmentSlotStatus`, `RegistrationStatus`, `PaymentStatus`, `PrescriptionStatus`, and `AuditAction`.

Key enum values:

```prisma
enum AppointmentSlotStatus {
  AVAILABLE
  LOCKED
  BOOKED
  CANCELLED
}

enum RegistrationStatus {
  BOOKED
  CANCELLED
  CHECKED_IN
  IN_VISIT
  COMPLETED
  NO_SHOW
}

enum PaymentStatus {
  PENDING
  PAID
  CANCELLED
  REFUNDED
}
```

- [ ] **Step 2: Add Prisma client singleton**

Write `backend/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

declare global {
  var __qishengPrisma: PrismaClient | undefined
}

export const prisma = globalThis.__qishengPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__qishengPrisma = prisma
}
```

- [ ] **Step 3: Add deterministic seed data**

Write `backend/prisma/seed.ts` to upsert:

- Roles: `ADMIN`, `DOCTOR`, `CASHIER`, `PHARMACY`, `PATIENT`
- Users: `admin`, `doctor_chen`, `cashier_lin`, `pharmacy_wu`, `patient_demo`
- One campus: `启胜医院主院区`
- Departments: `内科`, `儿科`, `骨科`
- One clinic room per department
- Doctor profile for `doctor_chen`
- Patient profile and visit member for `patient_demo`
- Seven days of doctor schedules and at least three slots per day
- Fee item `普通门诊挂号费`
- Announcement `启胜医院线上预约开放`

Use idempotent `upsert` calls so repeated `npm run db:seed` succeeds.

- [ ] **Step 4: Generate Prisma client**

Run: `cd backend && npm run prisma:generate`

Expected: Prisma client generation succeeds.

- [ ] **Step 5: Push schema and seed**

Run: `cd backend && npm run db:push && npm run db:seed`

Expected: schema push succeeds and seed script prints a summary with created demo accounts and slot count.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma backend/src/lib/prisma.ts
git commit -m "feat: add hospital data schema and seed"
```

## Task 4: Auth And Role Middleware

**Files:**
- Create: `backend/src/lib/password.ts`
- Create: `backend/src/types/auth.ts`
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/routes/auth.test.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Write auth tests**

Write `backend/src/routes/auth.test.ts`:

```typescript
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('auth routes', () => {
  it('rejects invalid credentials', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      username: 'missing',
      password: 'wrong',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('用户名或密码错误')
  })

  it('requires bearer token for current user', async () => {
    const response = await request(createApp()).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('请先登录')
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd backend && npm run test -- src/routes/auth.test.ts`

Expected: FAIL because `/api/auth/login` and `/api/auth/me` are not registered.

- [ ] **Step 3: Implement password helpers and auth types**

Write `backend/src/lib/password.ts`:

```typescript
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const actual = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
}
```

Write `backend/src/types/auth.ts`:

```typescript
export interface AuthUser {
  id: string
  username: string
  displayName: string
  roles: string[]
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}
```

- [ ] **Step 4: Implement middleware and routes**

Write `backend/src/middleware/auth.ts`:

```typescript
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import type { AuthUser } from '../types/auth'

const tokenStore = new Map<string, AuthUser>()

export function createToken(user: AuthUser) {
  const token = Buffer.from(`${user.id}:${Date.now()}:${Math.random()}`).toString('base64url')
  tokenStore.set(token, user)
  return token
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  const user = tokenStore.get(token)

  if (!user) {
    res.status(401).json({ message: '请先登录' })
    return
  }

  req.user = user
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roles.some((role) => roles.includes(role))) {
      res.status(403).json({ message: '没有权限访问该资源' })
      return
    }
    next()
  }
}

export async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  })

  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: user.roles.map((item) => item.role.code),
  }
}
```

Write `backend/src/routes/auth.ts` with `POST /login` and `GET /me`. Validate login body with Zod, query user by username, verify password, return `{ token, user }`, and return 401 with `{ message: '用户名或密码错误' }` for invalid credentials.

Modify `backend/src/app.ts` to register `app.use('/api/auth', authRouter)`.

- [ ] **Step 5: Run auth tests**

Run: `cd backend && npm run test -- src/routes/auth.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat: add auth routes and role middleware"
```

## Task 5: Appointment API Vertical Slice

**Files:**
- Create: `backend/src/services/appointments.ts`
- Create: `backend/src/routes/public.ts`
- Create: `backend/src/routes/mini.ts`
- Create: `backend/src/routes/admin.ts`
- Create: `backend/src/routes/staff.ts`
- Create: `backend/src/routes/mini.appointments.test.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Write appointment flow tests**

Write `backend/src/routes/mini.appointments.test.ts`:

```typescript
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('mini appointment flow', () => {
  it('lists public departments', async () => {
    const response = await request(createApp()).get('/api/public/departments')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it('requires login before creating registration', async () => {
    const response = await request(createApp()).post('/api/mini/registrations').send({
      slotId: 'slot_demo',
      visitMemberId: 'member_demo',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('请先登录')
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd backend && npm run test -- src/routes/mini.appointments.test.ts`

Expected: FAIL because public and mini routes are not registered.

- [ ] **Step 3: Implement appointment service**

Write `backend/src/services/appointments.ts`:

```typescript
import { AppointmentSlotStatus, PaymentStatus, RegistrationStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function bookAppointment(input: { userId: string; visitMemberId: string; slotId: string }) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.appointmentSlot.findUnique({
      where: { id: input.slotId },
      include: { schedule: { include: { doctor: true, department: true } } },
    })

    if (!slot || slot.status !== AppointmentSlotStatus.AVAILABLE) {
      throw new Error('号源不可预约')
    }

    const visitMember = await tx.visitMember.findFirst({
      where: { id: input.visitMemberId, patient: { userId: input.userId } },
    })

    if (!visitMember) {
      throw new Error('就诊人不存在')
    }

    await tx.appointmentSlot.update({
      where: { id: slot.id },
      data: { status: AppointmentSlotStatus.BOOKED },
    })

    const payment = await tx.paymentOrder.create({
      data: {
        orderNo: `PAY${Date.now()}`,
        title: '普通门诊挂号费',
        amount: slot.fee,
        status: PaymentStatus.PENDING,
        userId: input.userId,
      },
    })

    return tx.registration.create({
      data: {
        registrationNo: `REG${Date.now()}`,
        status: RegistrationStatus.BOOKED,
        userId: input.userId,
        visitMemberId: input.visitMemberId,
        departmentId: slot.schedule.departmentId,
        doctorId: slot.schedule.doctorId,
        slotId: slot.id,
        paymentOrderId: payment.id,
      },
      include: {
        department: true,
        doctor: true,
        slot: true,
        paymentOrder: true,
        visitMember: true,
      },
    })
  })
}
```

- [ ] **Step 4: Implement public, mini, admin, and staff routes**

Write `backend/src/routes/public.ts` to expose:

- `GET /departments`: active department list.
- `GET /departments/:id/doctors`: active doctors for a department.
- `GET /doctors/:id/slots`: available slots grouped by date.
- `GET /announcements`: active announcements.

Write `backend/src/routes/mini.ts` to expose authenticated patient routes:

- `GET /visit-members`
- `POST /visit-members`
- `GET /registrations`
- `POST /registrations`
- `POST /payments/:id/mock-pay`

Write `backend/src/routes/admin.ts` to expose authenticated admin routes:

- `GET /dashboard`
- `GET /departments`
- `GET /doctors`
- `GET /registrations`

Write `backend/src/routes/staff.ts` to expose authenticated staff routes:

- `GET /doctor/registrations`
- `GET /cashier/payment-orders`

Modify `backend/src/app.ts` to register:

```typescript
app.use('/api/public', publicRouter)
app.use('/api/mini', miniRouter)
app.use('/api/admin', adminRouter)
app.use('/api/staff', staffRouter)
```

- [ ] **Step 5: Run backend route tests**

Run: `cd backend && npm run test -- src/routes/mini.appointments.test.ts src/routes/auth.test.ts src/app.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat: add appointment api slice"
```

## Task 6: Frontend Admin Shell

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/.env.example`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/hospital.ts`
- Create: `frontend/src/stores/auth.ts`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/layouts/AdminLayout.vue`
- Create: `frontend/src/pages/LoginPage.vue`
- Create: `frontend/src/pages/DashboardPage.vue`
- Create: `frontend/src/pages/DepartmentsPage.vue`
- Create: `frontend/src/pages/SchedulesPage.vue`
- Create: `frontend/src/pages/RegistrationsPage.vue`
- Create: `frontend/src/pages/DoctorWorkbenchPage.vue`
- Create: `frontend/src/pages/CashierWorkbenchPage.vue`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/router/router.spec.ts`
- Create: `frontend/src/pages/DashboardPage.spec.ts`

- [ ] **Step 1: Write frontend tests**

Write `frontend/src/router/router.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { routes } from './index'

describe('admin routes', () => {
  it('contains login and dashboard routes', () => {
    expect(routes.some((route) => route.path === '/login')).toBe(true)
    expect(routes.some((route) => route.path === '/')).toBe(true)
  })
})
```

Write `frontend/src/pages/DashboardPage.spec.ts`:

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardPage from './DashboardPage.vue'

describe('DashboardPage', () => {
  it('renders hospital dashboard title', () => {
    const wrapper = mount(DashboardPage)
    expect(wrapper.text()).toContain('启胜医院平台总览')
  })
})
```

- [ ] **Step 2: Add frontend package and config**

Write `frontend/package.json` with Vue 3, Vite, Element Plus, Axios, Pinia, Vue Router, Vitest, Vue Test Utils, jsdom, TypeScript, vue-tsc, ESLint and Prettier dependencies matching the approved stack.

Write Vite and TypeScript config files equivalent to the `美贸商城` frontend conventions.

Write `frontend/.env.example`:

```dotenv
VITE_API_BASE_URL=/api
```

- [ ] **Step 3: Run tests to verify failure**

Run: `cd frontend && npm install && npm run test -- src/router/router.spec.ts src/pages/DashboardPage.spec.ts`

Expected: FAIL because frontend source files are not implemented.

- [ ] **Step 4: Implement admin shell**

Implement:

- `main.ts`: create Vue app, install Pinia, router, Element Plus.
- `App.vue`: `<RouterView />`.
- `api/client.ts`: Axios instance using `VITE_API_BASE_URL`.
- `api/hospital.ts`: functions for login, dashboard, departments, doctors, registrations.
- `stores/auth.ts`: token/user state, login, logout.
- `router/index.ts`: export `routes`, create router, add auth guard.
- `AdminLayout.vue`: left navigation and main content.
- Pages listed above with real headings, table placeholders, and API-ready loading states.

Use these route paths:

```typescript
export const routes = [
  { path: '/login', component: LoginPage },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', component: DashboardPage },
      { path: 'departments', component: DepartmentsPage },
      { path: 'schedules', component: SchedulesPage },
      { path: 'registrations', component: RegistrationsPage },
      { path: 'doctor', component: DoctorWorkbenchPage },
      { path: 'cashier', component: CashierWorkbenchPage },
    ],
  },
]
```

- [ ] **Step 5: Run frontend tests**

Run: `cd frontend && npm run test -- src/router/router.spec.ts src/pages/DashboardPage.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend
git commit -m "feat: add admin frontend shell"
```

## Task 7: Miniapp Patient Shell

**Files:**
- Create: `miniapp/package.json`
- Create: `miniapp/tsconfig.json`
- Create: `miniapp/vite.config.ts`
- Create: `miniapp/src/main.ts`
- Create: `miniapp/src/App.vue`
- Create: `miniapp/src/pages.json`
- Create: `miniapp/src/api/client.ts`
- Create: `miniapp/src/api/hospital.ts`
- Create: `miniapp/src/stores/session.ts`
- Create: `miniapp/src/pages/home/index.vue`
- Create: `miniapp/src/pages/departments/index.vue`
- Create: `miniapp/src/pages/doctors/index.vue`
- Create: `miniapp/src/pages/appointments/confirm.vue`
- Create: `miniapp/src/pages/mine/index.vue`
- Create: `miniapp/src/utils/appointment.ts`
- Create: `miniapp/src/utils/appointment.spec.ts`

- [ ] **Step 1: Write miniapp helper test**

Write `miniapp/src/utils/appointment.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { formatSlotLabel } from './appointment'

describe('formatSlotLabel', () => {
  it('formats date and time range', () => {
    expect(formatSlotLabel({ date: '2026-07-10', startTime: '09:00', endTime: '09:15' })).toBe(
      '2026-07-10 09:00-09:15',
    )
  })
})
```

- [ ] **Step 2: Add miniapp package and config**

Write `miniapp/package.json` with uni-app, Vue, Pinia, TypeScript, Vite, Vitest, happy-dom, and vue-tsc dependencies matching the approved stack.

Write `miniapp/tsconfig.json` and `miniapp/vite.config.ts` for uni-app.

- [ ] **Step 3: Run test to verify failure**

Run: `cd miniapp && npm install && npx vitest run src/utils/appointment.spec.ts`

Expected: FAIL because `formatSlotLabel` is not implemented.

- [ ] **Step 4: Implement miniapp shell**

Write `miniapp/src/utils/appointment.ts`:

```typescript
export interface SlotLabelInput {
  date: string
  startTime: string
  endTime: string
}

export function formatSlotLabel(slot: SlotLabelInput) {
  return `${slot.date} ${slot.startTime}-${slot.endTime}`
}
```

Implement:

- `main.ts`: create Vue app and Pinia.
- `App.vue`: root style.
- `pages.json`: home, departments, doctors, appointment confirm, mine.
- `api/client.ts`: `uni.request` wrapper.
- `api/hospital.ts`: departments, doctors, slots, registrations.
- `stores/session.ts`: token and selected visit member.
- Page components with patient-first UI and real calls wired through the API module.

- [ ] **Step 5: Run miniapp typecheck and helper test**

Run: `cd miniapp && npx vitest run src/utils/appointment.spec.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add miniapp
git commit -m "feat: add patient miniapp shell"
```

## Task 8: Final Verification And Documentation

**Files:**
- Modify: `README.md`
- Modify: `deploy/README.md`

- [ ] **Step 1: Update docs with actual commands**

Update `README.md` with:

- root install note explaining each package installs separately
- backend setup using `.env.example`
- database push and seed commands
- web dev command
- miniapp H5 and WeChat dev commands
- demo accounts from seed data

Update `deploy/README.md` with:

- backend environment variables
- database migration command
- seed command
- build command
- static artifact locations

- [ ] **Step 2: Run full verification**

Run:

```bash
npm run backend:test
npm run frontend:test
npm run miniapp:typecheck
npm run build
```

Expected: all commands pass. If MySQL is unavailable, document that `db:push` and seed verification were skipped because the local database service was not running, but keep unit tests passing.

- [ ] **Step 3: Check Git status**

Run: `git status --short`

Expected: no untracked or modified files after final commit.

- [ ] **Step 4: Commit**

```bash
git add README.md deploy/README.md
git commit -m "docs: document hospital platform setup"
```

## Self-Review

Spec coverage:

- Repository shape, technology stack, and dual remote setup are covered by Task 1.
- Backend health, env, Prisma schema, seed data, auth, public routes, mini routes, admin routes, staff routes, and appointment flow are covered by Tasks 2 through 5.
- Web admin shell, routes, menu destinations, dashboard, organization, registration, doctor, and cashier workbench pages are covered by Task 6.
- Patient miniapp shell, department/doctor/appointment/mine pages, API wrapper, and appointment formatting are covered by Task 7.
- Test and verification commands are covered by each task and final verification in Task 8.

Gaps intentionally deferred from the approved spec:

- Real payment channels,医保,住院,LIS,PACS, electronic medical record quality control, and full prescription flow remain future modules, as the design explicitly excludes them from the first phase.

Placeholder scan:

- The plan contains no placeholder markers or undefined task references.
- Phrases that describe larger file contents are constrained to implementation instructions for files whose public behavior, paths, routes, commands, and expected tests are specified.

Type consistency:

- Appointment status values match the approved design.
- API route prefixes match the approved design.
- Frontend route paths match the shell pages listed in Task 6.
- Miniapp page responsibilities match the patient flow listed in Task 7.
