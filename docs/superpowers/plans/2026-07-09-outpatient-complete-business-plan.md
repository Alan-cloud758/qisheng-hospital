# Outpatient Complete Business Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Expand Qisheng Hospital into a complete outpatient workflow with realistic seed data, backend services, web admin pages, and patient miniapp flows.

**Architecture:** Keep the existing backend/frontend/miniapp layout. Put status-changing outpatient business rules in backend service modules, expose role-oriented action APIs, then connect Element Plus admin pages and uni-app patient pages to those APIs. Seed data must be repeatable and broad enough for every module page.

**Tech Stack:** Express 5, TypeScript, Prisma 7, MySQL/MariaDB, Vitest, Supertest, Vue 3, Vite, Element Plus, Pinia, uni-app.

---

## File Structure

- Modify `backend/prisma/schema.prisma`: add encounter status, payment items, clinical orders, dictionary tables, and review timeline if needed.
- Replace `backend/prisma/seed.ts`: export seed plan arrays and generate broad idempotent outpatient data.
- Create `backend/src/services/outpatient-state.ts`: pure status transition rules.
- Create `backend/src/services/outpatient-workflow.ts`: transactional outpatient actions.
- Modify `backend/src/routes/admin.ts`, `backend/src/routes/mini.ts`, `backend/src/routes/public.ts`, `backend/src/routes/staff.ts`: expose complete APIs.
- Modify `frontend/src/api/hospital.ts`, `frontend/src/router/index.ts`, `frontend/src/layouts/AdminLayout.vue`: add full admin clients, routes, and menu.
- Create missing `frontend/src/pages/*.vue` module pages.
- Modify `miniapp/src/api/hospital.ts`, `miniapp/src/stores/patient.ts`, and `miniapp/src/pages/**/*.vue`: connect patient flow to real APIs.
- Update `README.md`: document the full outpatient demo flow and seeded accounts.

## Execution Notes

- Use the existing local MySQL and Redis services.
- Set `DATABASE_URL` before running Prisma database commands.
- Do not commit `backend/src/generated`, `node_modules`, `dist`, local cache folders, or real `.env` files.
- Follow TDD for new service behavior and route behavior.

### Task 1: Schema Expansion

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/prisma/schema-outpatient.test.ts`

- [ ] **Step 1: Write schema expectation test**

Create `backend/prisma/schema-outpatient.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const schema = readFileSync('prisma/schema.prisma', 'utf8')

describe('outpatient schema expansion', () => {
  it('defines outpatient status and billing support models', () => {
    expect(schema).toContain('enum EncounterStatus')
    expect(schema).toContain('model MedicalOrder')
    expect(schema).toContain('model PaymentOrderItem')
    expect(schema).toContain('model DictionaryCategory')
    expect(schema).toContain('model DictionaryItem')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- prisma/schema-outpatient.test.ts`

Expected: FAIL because the new schema entries are absent.

- [ ] **Step 3: Update Prisma schema**

Add `EncounterStatus`, change `Encounter.status` from `String` to `EncounterStatus`, add `Encounter.medicalOrders`, and add these models: `MedicalOrder`, `PaymentOrderItem`, `DictionaryCategory`, `DictionaryItem`. Add `PaymentOrder.items` relation. Keep names exactly as the test expects.

- [ ] **Step 4: Verify schema and client generation**

Run: `npm --prefix backend run prisma:generate`

Expected: Prisma Client generated successfully.

Run: `npm --prefix backend run test -- prisma/schema-outpatient.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/prisma/schema-outpatient.test.ts
git commit -m "feat: expand outpatient schema"
```

### Task 2: Seed Expansion

**Files:**
- Modify: `backend/prisma/seed.ts`
- Test: `backend/prisma/seed-outpatient.test.ts`

- [ ] **Step 1: Write seed data count test**

Create `backend/prisma/seed-outpatient.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { outpatientSeedPlan } from './seed'

describe('outpatient seed plan', () => {
  it('contains enough sample records for full outpatient demos', () => {
    expect(outpatientSeedPlan.campuses.length).toBeGreaterThanOrEqual(2)
    expect(outpatientSeedPlan.departments.length).toBeGreaterThanOrEqual(12)
    expect(outpatientSeedPlan.doctors.length).toBeGreaterThanOrEqual(20)
    expect(outpatientSeedPlan.patientUsers.length).toBeGreaterThanOrEqual(15)
    expect(outpatientSeedPlan.drugs.length).toBeGreaterThanOrEqual(30)
    expect(outpatientSeedPlan.feeItems.length).toBeGreaterThanOrEqual(15)
    expect(outpatientSeedPlan.announcements.length).toBeGreaterThanOrEqual(10)
    expect(outpatientSeedPlan.dictionaryCategories.length).toBeGreaterThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- prisma/seed-outpatient.test.ts`

Expected: FAIL because `outpatientSeedPlan` is not exported.

- [ ] **Step 3: Export seed plan arrays**

Modify `backend/prisma/seed.ts` to export `outpatientSeedPlan` with arrays for campuses, departments, doctors, patientUsers, drugs, feeItems, announcements, dictionaryCategories. The minimum counts must match the test. Use stable `code`, `username`, `employeeNo`, `patientNo`, and `id` values for idempotent upserts.

- [ ] **Step 4: Implement linked seed writes**

Generate at least 7 future days of schedules for 12 or more doctors, at least 300 slots, 30 registrations, 15 encounters, 15 medical records, 15 diagnoses, 15 medical orders, 30 payment orders with items, 20 prescriptions with items, and 30 audit logs. Run seed twice to prove idempotency.

- [ ] **Step 5: Verify seed**

Run: `npm --prefix backend run test -- prisma/seed-outpatient.test.ts`

Expected: PASS.

Run with `DATABASE_URL` set: `npm --prefix backend run db:push`

Expected: database sync succeeds.

Run with `DATABASE_URL` set: `npm --prefix backend run db:seed`

Expected: seed reports outpatient sample data counts. Run it a second time; expected no unique constraint failure.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/prisma/seed.ts backend/prisma/seed-outpatient.test.ts
git commit -m "feat: expand outpatient seed data"
```

### Task 3: Outpatient State Service

**Files:**
- Create: `backend/src/services/outpatient-state.ts`
- Test: `backend/src/services/outpatient-state.test.ts`

- [ ] **Step 1: Write failing state transition tests**

Create `backend/src/services/outpatient-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  assertCanCancelRegistration,
  assertCanCheckInRegistration,
  assertCanCompleteEncounter,
  assertCanDispensePrescription,
  assertCanPayOrder,
  assertCanReviewPrescription,
  assertCanStartEncounter,
} from './outpatient-state'

describe('outpatient state transitions', () => {
  it('allows legal outpatient transitions and rejects illegal ones', () => {
    expect(() => assertCanCancelRegistration('BOOKED')).not.toThrow()
    expect(() => assertCanCheckInRegistration('BOOKED')).not.toThrow()
    expect(() => assertCanStartEncounter('CHECKED_IN')).not.toThrow()
    expect(() => assertCanCompleteEncounter('OPEN')).not.toThrow()
    expect(() => assertCanPayOrder('PENDING')).not.toThrow()
    expect(() => assertCanReviewPrescription('SUBMITTED')).not.toThrow()
    expect(() => assertCanDispensePrescription('REVIEWED')).not.toThrow()
    expect(() => assertCanCancelRegistration('COMPLETED')).toThrow('Only booked registrations can be cancelled')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/services/outpatient-state.test.ts`

Expected: FAIL because `outpatient-state` does not exist.

- [ ] **Step 3: Implement state helpers**

Create `backend/src/services/outpatient-state.ts` exporting `assertCanCancelRegistration`, `assertCanCheckInRegistration`, `assertCanStartEncounter`, `assertCanCompleteEncounter`, `assertCanPayOrder`, `assertCanReviewPrescription`, and `assertCanDispensePrescription`. Each function should throw the exact message asserted by tests for illegal states.

- [ ] **Step 4: Run test**

Run: `npm --prefix backend run test -- src/services/outpatient-state.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/src/services/outpatient-state.ts backend/src/services/outpatient-state.test.ts
git commit -m "feat: add outpatient state rules"
```

### Task 4: Backend Workflow Services

**Files:**
- Create: `backend/src/services/outpatient-workflow.ts`
- Test: `backend/src/services/outpatient-workflow.test.ts`

- [ ] **Step 1: Write workflow service tests**

Create `backend/src/services/outpatient-workflow.test.ts` with dependency-injected repository tests:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createOutpatientWorkflowService } from './outpatient-workflow'

function createRepo(overrides = {}) {
  return {
    findRegistration: vi.fn().mockResolvedValue({ id: 'reg-1', status: 'BOOKED' }),
    updateRegistration: vi.fn().mockResolvedValue({ id: 'reg-1', status: 'CHECKED_IN' }),
    findPaymentOrder: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PENDING' }),
    updatePaymentOrder: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PAID' }),
    findPrescription: vi.fn().mockResolvedValue({ id: 'rx-1', status: 'SUBMITTED' }),
    updatePrescription: vi.fn().mockResolvedValue({ id: 'rx-1', status: 'REVIEWED' }),
    findEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', status: 'OPEN' }),
    createEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', status: 'OPEN' }),
    updateEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', status: 'COMPLETED' }),
    ...overrides,
  }
}

describe('outpatient workflow service', () => {
  it('checks in booked registration', async () => {
    const repo = createRepo()
    const service = createOutpatientWorkflowService(repo)
    const result = await service.checkInRegistration('reg-1')
    expect(result.status).toBe('CHECKED_IN')
  })

  it('marks pending payment as paid', async () => {
    const repo = createRepo()
    const service = createOutpatientWorkflowService(repo)
    const result = await service.payOrder('pay-1')
    expect(result.status).toBe('PAID')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/services/outpatient-workflow.test.ts`

Expected: FAIL because `createOutpatientWorkflowService` does not exist.

- [ ] **Step 3: Implement injected service**

Create `backend/src/services/outpatient-workflow.ts`. Export repository interface and `createOutpatientWorkflowService(repo)`. Implement `checkInRegistration`, `payOrder`, `reviewPrescription`, `dispensePrescription`, `cancelRegistration`, `startEncounter`, `saveRecord`, `addDiagnosis`, `addMedicalOrder`, `submitPrescription`, and `completeEncounter`. Use `outpatient-state` assertions before writes.

- [ ] **Step 4: Run workflow tests**

Run: `npm --prefix backend run test -- src/services/outpatient-workflow.test.ts src/services/outpatient-state.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/src/services/outpatient-workflow.ts backend/src/services/outpatient-workflow.test.ts
git commit -m "feat: add outpatient workflow service"
```

### Task 5: Backend Admin and Staff Routes

**Files:**
- Modify: `backend/src/routes/admin.ts`
- Modify: `backend/src/routes/staff.ts`
- Create: `backend/src/routes/outpatient.workflow.test.ts`
- Modify: `backend/src/app.ts` if route mounting changes are needed

- [ ] **Step 1: Write route tests**

Create `backend/src/routes/outpatient.workflow.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('outpatient workflow routes', () => {
  it('requires auth for admin check-in', async () => {
    const response = await request(createApp()).post('/api/admin/registrations/reg-demo/check-in')
    expect(response.status).toBe(401)
  })

  it('requires auth for cashier payment', async () => {
    const response = await request(createApp()).post('/api/staff/cashier/payment-orders/pay-demo/pay')
    expect(response.status).toBe(401)
  })

  it('requires auth for pharmacy review', async () => {
    const response = await request(createApp()).post('/api/staff/pharmacy/prescriptions/rx-demo/review')
    expect(response.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run route tests**

Run: `npm --prefix backend run test -- src/routes/outpatient.workflow.test.ts`

Expected: PASS if auth middleware protects these paths, or FAIL with 404 if routes are absent. If it passes only through auth, continue and add authenticated tests after implementation if practical.

- [ ] **Step 3: Implement admin routes**

In `backend/src/routes/admin.ts`, add list endpoints for dashboard, accounts, roles, menus, audit logs, campuses, departments, clinic rooms, doctors, patients, visit members, registrations, encounters, schedules, slots, fee items, drugs, announcements, and dictionaries. Add action `POST /registrations/:id/check-in`.

- [ ] **Step 4: Implement staff routes**

In `backend/src/routes/staff.ts`, add doctor, cashier, and pharmacy route groups:

- `GET /doctor/queue`
- `POST /doctor/encounters/:id/start`
- `PUT /doctor/encounters/:id/record`
- `POST /doctor/encounters/:id/diagnoses`
- `POST /doctor/encounters/:id/orders`
- `POST /doctor/encounters/:id/prescriptions`
- `POST /doctor/encounters/:id/complete`
- `GET /cashier/payment-orders`
- `POST /cashier/payment-orders/:id/pay`
- `GET /pharmacy/prescriptions`
- `POST /pharmacy/prescriptions/:id/review`
- `POST /pharmacy/prescriptions/:id/dispense`

- [ ] **Step 5: Verify backend**

Run: `npm --prefix backend run test -- src/routes/outpatient.workflow.test.ts src/routes/mini.appointments.test.ts src/routes/auth.test.ts`

Expected: PASS.

Run: `npm --prefix backend run build`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/src/routes/admin.ts backend/src/routes/staff.ts backend/src/routes/outpatient.workflow.test.ts backend/src/app.ts
git commit -m "feat: add outpatient workflow routes"
```

### Task 6: Patient Miniapp APIs

**Files:**
- Modify: `backend/src/routes/mini.ts`
- Modify: `backend/src/routes/public.ts`
- Test: `backend/src/routes/mini.outpatient.test.ts`

- [ ] **Step 1: Write public and miniapp route tests**

Create `backend/src/routes/mini.outpatient.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('mini outpatient APIs', () => {
  it('lists public announcements', async () => {
    const response = await request(createApp()).get('/api/public/announcements')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it('requires auth for visit members', async () => {
    const response = await request(createApp()).get('/api/mini/visit-members')
    expect(response.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm --prefix backend run test -- src/routes/mini.outpatient.test.ts`

Expected: FAIL for missing public announcements, or PASS for auth protection if route already exists.

- [ ] **Step 3: Implement public patient data routes**

In `backend/src/routes/public.ts`, add `GET /announcements`, `GET /departments/:id`, `GET /doctors`, `GET /doctors/:id`, and `GET /doctors/:id/slots`.

- [ ] **Step 4: Implement mini patient routes**

In `backend/src/routes/mini.ts`, add `GET /visit-members`, `POST /visit-members`, `PUT /visit-members/:id`, `POST /visit-members/:id/default`, `GET /registrations`, `POST /registrations/:id/cancel`, and `GET /visit-records`.

- [ ] **Step 5: Verify backend routes**

Run: `npm --prefix backend run test -- src/routes/mini.outpatient.test.ts src/routes/mini.appointments.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/src/routes/mini.ts backend/src/routes/public.ts backend/src/routes/mini.outpatient.test.ts
git commit -m "feat: expand patient outpatient APIs"
```

### Task 7: Web Admin API Clients and Routes

**Files:**
- Modify: `frontend/src/api/hospital.ts`
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/layouts/AdminLayout.vue`
- Test: `frontend/src/router/router.spec.ts`

- [ ] **Step 1: Expand router test**

Modify `frontend/src/router/router.spec.ts` so it asserts the route tree contains `patients`, `pharmacy`, `audit`, and `dictionaries`.

- [ ] **Step 2: Run frontend route test to verify failure**

Run: `npm --prefix frontend run test -- src/router/router.spec.ts`

Expected: FAIL until full module routes are added.

- [ ] **Step 3: Add API client methods**

Modify `frontend/src/api/hospital.ts` to export clients for dashboard, accounts, roles, audit logs, campuses, clinic rooms, doctors, patients, visit members, registrations, check-in, schedules, slots, doctor queue, encounter actions, payment orders, payment action, prescriptions, pharmacy actions, drugs, announcements, and dictionaries.

- [ ] **Step 4: Add routes and menu items**

Add route groups and menu groups: System, Hospital, Patients, Scheduling, Doctor, Cashier, Pharmacy, Operations.

- [ ] **Step 5: Verify route test**

Run: `npm --prefix frontend run test -- src/router/router.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add frontend/src/api/hospital.ts frontend/src/router/index.ts frontend/src/layouts/AdminLayout.vue frontend/src/router/router.spec.ts
git commit -m "feat: add outpatient admin routes and clients"
```

### Task 8: Web Admin Pages

**Files:**
- Create and modify: `frontend/src/pages/*.vue`
- Test: `frontend/src/pages/OutpatientPages.spec.ts`

- [ ] **Step 1: Write page rendering test**

Create `frontend/src/pages/OutpatientPages.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PatientsPage from './PatientsPage.vue'
import PharmacyWorkbenchPage from './PharmacyWorkbenchPage.vue'

describe('outpatient admin pages', () => {
  it('renders patient center page', () => {
    const wrapper = mount(PatientsPage)
    expect(wrapper.text()).toContain('患者中心')
  })

  it('renders pharmacy workspace page', () => {
    const wrapper = mount(PharmacyWorkbenchPage)
    expect(wrapper.text()).toContain('药房工作台')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix frontend run test -- src/pages/OutpatientPages.spec.ts`

Expected: FAIL because these pages do not exist.

- [ ] **Step 3: Implement missing pages**

Create Element Plus pages that load API data on mount, show loading state, render table data, and expose key action buttons. Minimum pages: `AccountsPage.vue`, `RolesPage.vue`, `AuditLogsPage.vue`, `CampusesPage.vue`, `ClinicRoomsPage.vue`, `DoctorsPage.vue`, `PatientsPage.vue`, `VisitMembersPage.vue`, `EncounterHistoryPage.vue`, `SlotsPage.vue`, `EncounterDetailPage.vue`, `PharmacyWorkbenchPage.vue`, `DrugCatalogPage.vue`, `PaymentHistoryPage.vue`, `FeeItemsPage.vue`, `AnnouncementsPage.vue`, `DictionariesPage.vue`.

- [ ] **Step 4: Enhance existing pages**

Update `DashboardPage.vue`, `DepartmentsPage.vue`, `RegistrationsPage.vue`, `SchedulesPage.vue`, `DoctorWorkbenchPage.vue`, and `CashierWorkbenchPage.vue` to use real API clients and action buttons.

- [ ] **Step 5: Verify frontend**

Run: `npm --prefix frontend run test`

Expected: PASS.

Run: `npm --prefix frontend run build`

Expected: PASS. Chunk size warning is acceptable if the command exits 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add frontend/src
git commit -m "feat: complete outpatient admin pages"
```

### Task 9: Miniapp Real Data Flow

**Files:**
- Modify: `miniapp/src/api/hospital.ts`
- Modify: `miniapp/src/stores/patient.ts`
- Modify: `miniapp/src/pages/**/*.vue`
- Create: `miniapp/src/utils/status.ts`
- Test: `miniapp/src/utils/status.spec.ts`

- [ ] **Step 1: Write status utility test**

Create `miniapp/src/utils/status.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { prescriptionStatusText, registrationStatusText } from './status'

describe('patient status labels', () => {
  it('maps registration and prescription statuses', () => {
    expect(registrationStatusText('CHECKED_IN')).toBe('已签到')
    expect(prescriptionStatusText('DISPENSED')).toBe('已发药')
  })
})
```

- [ ] **Step 2: Run miniapp test to verify failure**

Run: `npm --prefix miniapp run test -- src/utils/status.spec.ts`

Expected: FAIL because `status.ts` does not exist.

- [ ] **Step 3: Implement status utility**

Create `miniapp/src/utils/status.ts` with `registrationStatusText` and `prescriptionStatusText`. Include mappings for BOOKED, CANCELLED, CHECKED_IN, IN_VISIT, COMPLETED, NO_SHOW, DRAFT, SUBMITTED, REVIEWED, DISPENSED.

- [ ] **Step 4: Expand miniapp API and store**

Add API methods for announcements, department detail, doctors, doctor detail, visit members, create/update member, set default member, create registration, cancel registration, my registrations, and visit records. Update patient store to hold announcements, departments, doctors, visitMembers, registrations, visitRecords, and selectedSlot.

- [ ] **Step 5: Update miniapp pages**

Connect pages to real store/API data. Home loads announcements and department shortcuts. Departments loads public departments. Doctors loads doctors and slots. Appointment uses selected slot and default visit member. Appointments shows real registrations and cancel button. Members lists and edits visit members. Payment result shows created registration/payment state. Add visit records page and pages.json entry.

- [ ] **Step 6: Verify miniapp**

Run: `npm --prefix miniapp run test`

Expected: PASS.

Run: `npm --prefix miniapp run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add miniapp/src
git commit -m "feat: complete patient miniapp outpatient flow"
```

### Task 10: Final Verification and Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-09-outpatient-complete-business-design.md` only if verification notes are needed

- [ ] **Step 1: Update README with complete outpatient demo flow**

Add demo steps: seed database, login as `patient_demo` to create appointment, login as `admin` to check in, login as `doctor_chen` to start and complete encounter, login as `cashier_lin` to pay, login as `pharmacy_wu` to review and dispense.

- [ ] **Step 2: Run full verification**

Run with `DATABASE_URL` set:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run db:push
npm --prefix backend run db:seed
npm run lint
npm run backend:test
npm run frontend:test
npm --prefix miniapp run test
npm run build
```

Expected: all commands exit 0. Frontend chunk-size and uni-app deprecation warnings are acceptable if commands exit 0.

- [ ] **Step 3: Check repository status**

Run: `git status --short --ignored`

Expected: only ignored cache, generated, dependency, or dist directories remain.

- [ ] **Step 4: Commit docs**

Run:

```bash
git add README.md docs/superpowers/specs/2026-07-09-outpatient-complete-business-design.md
git commit -m "docs: document outpatient demo workflow"
```

## Self-Review

- Spec coverage: schema, seed, backend workflows, web pages, miniapp flow, tests, verification, and docs are covered by Tasks 1-10.
- Scope control: inpatient, insurance, LIS/PACS, real payment, EMR quality control, and third-party integrations are excluded.
- Type consistency: status names match existing RegistrationStatus, PaymentStatus, PrescriptionStatus, and planned EncounterStatus.
- Task order: modules referenced by later tasks are created by earlier tasks.
