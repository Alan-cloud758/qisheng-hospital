# HIS Platform Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Qisheng Hospital from a complete outpatient demo into a staged HIS demo platform covering outpatient operations, inpatient care, mock insurance settlement, mock LIS, and mock PACS.

**Architecture:** Keep the existing `backend/`, `frontend/`, and `miniapp/` apps. Add shared backend service modules for state transitions, audit, pagination, provider adapters, and business workflows; expose role-oriented route groups; then connect Element Plus admin pages and uni-app patient pages. Every phase is delivered end to end with schema, seed data, APIs, UI, tests, and verification.

**Tech Stack:** Express 5, TypeScript, Prisma 7, MySQL/MariaDB, Vitest, Supertest, Vue 3, Vite, Element Plus, Pinia, uni-app.

---

## Scope and Execution Rules

This plan covers the full approved spec in `docs/superpowers/specs/2026-07-14-his-platform-expansion-design.md`.

Execute phases in order. Do not start a later phase until the previous phase passes its listed verification commands. Each phase should be committed separately. When a phase changes `backend/prisma/schema.prisma`, run Prisma generation and seed verification before moving on.

Do not edit generated Prisma files under `backend/src/generated/prisma` by hand. They are updated only by `npm --prefix backend run prisma:generate`.

Do not add real payment, real insurance, real LIS, real PACS, DICOM server, SMS, or WeChat template-message integrations. Use local mock provider interfaces only.

## File Structure Map

### Backend Shared Files

- Modify `backend/prisma/schema.prisma`: add enums and models for all phases.
- Modify `backend/prisma/seed.ts`: add idempotent demo data per phase.
- Create `backend/src/services/audit.ts`: central helper for writing `AuditLog`.
- Create `backend/src/services/pagination.ts`: parse `page`, `pageSize`, `keyword`, status, and date filters.
- Create `backend/src/services/admin-crud.ts`: shared admin list/create/update/enable/disable helpers for simple master data.
- Create `backend/src/services/scheduling.ts`: schedule template, slot lock, reschedule, no-show, and suspension rules.
- Create `backend/src/services/payment.ts`: order cancellation, mock payment, refund, and transaction rules.
- Create `backend/src/providers/payment-provider.ts`: `PaymentProvider` and `MockPaymentProvider`.
- Create `backend/src/services/pharmacy-inventory.ts`: stock batch, stock movement, dispensing, return, alert rules.
- Create `backend/src/services/clinical-quality.ts`: templates, common diagnosis/order/prescription, prescription validation.
- Create `backend/src/services/queue.ts`: notification, queue ticket, current call, and wait-estimate logic.
- Create `backend/src/services/dashboard.ts`: admin dashboard aggregation.
- Create `backend/src/services/inpatient.ts`: admission, bed, inpatient order, charge, discharge workflows.
- Create `backend/src/providers/insurance-provider.ts`: `InsuranceProvider` and `MockInsuranceProvider`.
- Create `backend/src/services/insurance.ts`: profile, catalog mapping, pre-settle, settle, reverse, refund offset.
- Create `backend/src/providers/lab-provider.ts`: `LabProvider` and `MockLabProvider`.
- Create `backend/src/services/lab.ts`: lab request, sample, result, report workflows.
- Create `backend/src/providers/pacs-provider.ts`: `PacsProvider` and `MockPacsProvider`.
- Create `backend/src/services/radiology.ts`: imaging request, appointment, study, report workflows.

### Backend Route Files

- Modify `backend/src/routes/admin.ts`: admin master data, dashboard, insurance config, inpatient config, lab/imaging item config.
- Modify `backend/src/routes/staff.ts`: doctor, cashier, pharmacy flows.
- Modify `backend/src/routes/mini.ts`: patient fees, notifications, queue, reports, inpatient info.
- Modify `backend/src/routes/public.ts`: public department, doctor, announcement, slot data.
- Create `backend/src/routes/nurse.ts`: inpatient admission, beds, discharge handling.
- Create `backend/src/routes/lab.ts`: lab workbench routes.
- Create `backend/src/routes/radiology.ts`: radiology workbench routes.
- Modify `backend/src/app.ts`: mount new route groups.

### Frontend Files

- Modify `frontend/src/api/hospital.ts`: add typed API client methods for all admin/staff modules.
- Modify `frontend/src/router/index.ts`: add routes for each phase.
- Modify `frontend/src/layouts/AdminLayout.vue`: add menus for operations, inpatient, insurance, lab, radiology.
- Modify or create pages under `frontend/src/pages/`: phase-specific pages listed in each task.
- Add tests under `frontend/src/pages/*.spec.ts` and extend `frontend/src/router/router.spec.ts`.

### Miniapp Files

- Modify `miniapp/src/api/hospital.ts`: add patient API methods.
- Modify `miniapp/src/stores/patient.ts`: add notifications, queue, fees, reports, inpatient state.
- Modify `miniapp/src/pages.json`: add pages for notifications, queue, fees, reports, inpatient.
- Create or modify pages under `miniapp/src/pages/`.
- Add utility tests under `miniapp/src/utils/*.spec.ts`.

---

## Task 1: Shared Backend Foundation

**Files:**
- Create: `backend/src/services/audit.ts`
- Create: `backend/src/services/pagination.ts`
- Create: `backend/src/services/service-error.ts`
- Test: `backend/src/services/pagination.test.ts`

- [ ] **Step 1: Write failing pagination test**

Create `backend/src/services/pagination.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parsePagination, parseDateRange } from './pagination'

describe('pagination helpers', () => {
  it('normalizes page and pageSize safely', () => {
    expect(parsePagination({ page: '2', pageSize: '20' })).toEqual({ page: 2, pageSize: 20, skip: 20, take: 20 })
    expect(parsePagination({ page: '-1', pageSize: '999' })).toEqual({ page: 1, pageSize: 100, skip: 0, take: 100 })
  })

  it('parses optional date ranges', () => {
    const range = parseDateRange({ startDate: '2026-07-01', endDate: '2026-07-14' })
    expect(range.gte?.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(range.lte?.toISOString().slice(0, 10)).toBe('2026-07-14')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- src/services/pagination.test.ts`

Expected: FAIL because `pagination.ts` is absent.

- [ ] **Step 3: Implement shared helpers**

Create `backend/src/services/pagination.ts`:

```ts
export function parsePagination(query: Record<string, unknown>) {
  const rawPage = Number(query.page ?? 1)
  const rawPageSize = Number(query.pageSize ?? 20)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(rawPageSize) ? Math.floor(rawPageSize) : 20))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function parseKeyword(query: Record<string, unknown>) {
  return typeof query.keyword === 'string' && query.keyword.trim() ? query.keyword.trim() : undefined
}

export function parseDateRange(query: Record<string, unknown>) {
  const gte = typeof query.startDate === 'string' ? new Date(query.startDate) : undefined
  const lte = typeof query.endDate === 'string' ? new Date(query.endDate) : undefined
  return {
    gte: gte && !Number.isNaN(gte.getTime()) ? gte : undefined,
    lte: lte && !Number.isNaN(lte.getTime()) ? lte : undefined,
  }
}
```

Create `backend/src/services/service-error.ts`:

```ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message)
  }
}
```

Create `backend/src/services/audit.ts`:

```ts
import { AuditAction } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'

export async function writeAuditLog(input: {
  userId?: string
  action: AuditAction
  resource: string
  resourceId?: string
  detail?: string
  ip?: string
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      detail: input.detail,
      ip: input.ip,
    },
  })
}
```

- [ ] **Step 4: Run foundation tests**

Run: `npm --prefix backend run test -- src/services/pagination.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/src/services/audit.ts backend/src/services/pagination.ts backend/src/services/pagination.test.ts backend/src/services/service-error.ts
git commit -m "feat: add shared backend service helpers"
```

---

## Task 2: Phase 1 - Admin Operability

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/routes/admin.ts`
- Create: `backend/src/services/admin-crud.ts`
- Modify: `frontend/src/api/hospital.ts`
- Modify: `frontend/src/pages/ModuleListPage.vue`
- Create: `frontend/src/pages/AdminResourcePage.vue`
- Test: `backend/src/routes/admin-crud.test.ts`
- Test: `frontend/src/pages/AdminResourcePage.spec.ts`

- [ ] **Step 1: Write backend CRUD route test**

Create `backend/src/routes/admin-crud.test.ts`:

```ts
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('admin operability routes', () => {
  it('requires auth for paginated department management', async () => {
    const response = await request(createApp()).get('/api/admin/departments?page=1&pageSize=10')
    expect(response.status).toBe(401)
  })

  it('requires auth for department create', async () => {
    const response = await request(createApp()).post('/api/admin/departments').send({ name: '测试科室', code: 'TEST' })
    expect(response.status).toBe(401)
  })
})
```

- [ ] **Step 2: Write frontend resource page test**

Create `frontend/src/pages/AdminResourcePage.spec.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminResourcePage from './AdminResourcePage.vue'

describe('AdminResourcePage', () => {
  it('renders search and create controls', () => {
    const wrapper = mount(AdminResourcePage, {
      props: {
        title: '科室管理',
        resource: 'departments',
        columns: [{ key: 'name', label: '名称' }],
        fields: [{ key: 'name', label: '名称', required: true }],
      },
    })

    expect(wrapper.text()).toContain('科室管理')
    expect(wrapper.text()).toContain('新增')
    expect(wrapper.text()).toContain('搜索')
  })
})
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm --prefix backend run test -- src/routes/admin-crud.test.ts`

Expected: PASS for auth protection or FAIL with missing routes. Continue until route implementation exists.

Run: `npm --prefix frontend run test -- src/pages/AdminResourcePage.spec.ts`

Expected: FAIL because `AdminResourcePage.vue` is absent.

- [ ] **Step 4: Add admin CRUD service**

Create `backend/src/services/admin-crud.ts` exporting:

```ts
export type AdminListResult<T> = {
  items: T[]
  pagination: { page: number; pageSize: number; total: number }
}

export function buildContainsFilter(keyword: string | undefined, fields: string[]) {
  if (!keyword) return undefined
  return {
    OR: fields.map((field) => ({ [field]: { contains: keyword } })),
  }
}

export function toPaginationResult<T>(items: T[], total: number, page: number, pageSize: number): AdminListResult<T> {
  return { items, pagination: { page, pageSize, total } }
}
```

- [ ] **Step 5: Implement paginated admin resources**

Modify `backend/src/routes/admin.ts` so these resources support `GET`, `POST`, `PUT /:id`, and `POST /:id/toggle-active` where the model has `isActive`: departments, campuses, clinic-rooms, doctors, fee-items, drugs, announcements, dictionaries, dictionary-items, accounts, roles, menus.

Use `{ items, pagination }` for list responses. Keep existing action routes like `POST /registrations/:id/check-in`.

- [ ] **Step 6: Implement admin resource frontend page**

Create `frontend/src/pages/AdminResourcePage.vue` with props:

```ts
type FieldConfig = { key: string; label: string; required?: boolean; type?: 'text' | 'number' | 'textarea' | 'select' }
type ColumnConfig = { key: string; label: string }
```

The page must render keyword input, search button, create button, paginated Element Plus table, edit button, enable/disable button, and an edit dialog.

- [ ] **Step 7: Connect API client and routes**

Modify `frontend/src/api/hospital.ts` to export:

```ts
export interface PaginatedItems<T = unknown> {
  items: T[]
  pagination: { page: number; pageSize: number; total: number }
}

export async function fetchAdminResource(resource: string, params: Record<string, unknown> = {}) {
  const response = await apiClient.get<PaginatedItems>(`/admin/${resource}`, { params })
  return response.data
}

export async function createAdminResource(resource: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/${resource}`, data)
  return response.data.item
}

export async function updateAdminResource(resource: string, id: string, data: Record<string, unknown>) {
  const response = await apiClient.put<{ item: unknown }>(`/admin/${resource}/${id}`, data)
  return response.data.item
}

export async function toggleAdminResource(resource: string, id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/${resource}/${id}/toggle-active`)
  return response.data.item
}
```

Modify `frontend/src/router/index.ts` so master-data routes use `AdminResourcePage` with field configs.

- [ ] **Step 8: Verify phase 1**

Run:

```bash
npm --prefix backend run test -- src/routes/admin-crud.test.ts
npm --prefix frontend run test -- src/pages/AdminResourcePage.spec.ts
npm --prefix backend run build
npm --prefix frontend run build
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/routes/admin.ts backend/src/services/admin-crud.ts backend/src/routes/admin-crud.test.ts frontend/src/api/hospital.ts frontend/src/pages frontend/src/router/index.ts
git commit -m "feat: make admin master data operable"
```

---

## Task 3: Phase 2 - Scheduling and Slots

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/scheduling.ts`
- Modify: `backend/src/routes/admin.ts`
- Modify: `backend/src/routes/mini.ts`
- Modify: `backend/src/routes/public.ts`
- Modify: `frontend/src/pages/SchedulesPage.vue`
- Modify: `frontend/src/pages/RegistrationsPage.vue`
- Modify: `miniapp/src/pages/appointment/index.vue`
- Modify: `miniapp/src/pages/appointments/index.vue`
- Test: `backend/src/services/scheduling.test.ts`
- Test: `miniapp/src/utils/appointment.spec.ts`

- [ ] **Step 1: Write scheduling service tests**

Create `backend/src/services/scheduling.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { assertCanReschedule, assertCanUseLockedSlot, computeSlotLockExpiry } from './scheduling'

describe('scheduling rules', () => {
  it('allows reschedule only before check-in', () => {
    expect(() => assertCanReschedule('BOOKED')).not.toThrow()
    expect(() => assertCanReschedule('CHECKED_IN')).toThrow('Only booked registrations can be rescheduled')
    expect(() => assertCanReschedule('COMPLETED')).toThrow('Only booked registrations can be rescheduled')
  })

  it('computes lock expiry from current time', () => {
    const now = new Date('2026-07-14T10:00:00.000Z')
    expect(computeSlotLockExpiry(now, 10).toISOString()).toBe('2026-07-14T10:10:00.000Z')
  })

  it('rejects expired slot locks', () => {
    expect(() => assertCanUseLockedSlot(new Date('2026-07-14T10:00:00.000Z'), new Date('2026-07-14T10:01:00.000Z'))).not.toThrow()
    expect(() => assertCanUseLockedSlot(new Date('2026-07-14T10:00:00.000Z'), new Date('2026-07-14T09:59:00.000Z'))).toThrow('Slot lock has expired')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/scheduling.test.ts`

Expected: FAIL because `scheduling.ts` is absent.

- [ ] **Step 3: Update schema**

Add models and fields:

- `ScheduleTemplate`
- `ScheduleTemplateRule`
- `ScheduleChangeLog`
- `RegistrationChangeLog`
- `AppointmentSlot.lockedUntil DateTime?`
- `Registration.noShowAt DateTime?`
- `Registration.noShowReason String?`

Run: `npm --prefix backend run prisma:generate`

Expected: Prisma generation succeeds.

- [ ] **Step 4: Implement scheduling service**

Create `backend/src/services/scheduling.ts` exporting:

- `assertCanReschedule(status: string)`
- `computeSlotLockExpiry(now: Date, minutes: number)`
- `assertCanUseLockedSlot(now: Date, lockedUntil?: Date | null)`
- `generateSchedulesFromTemplate(templateId: string, startDate: Date, endDate: Date, userId?: string)`
- `lockSlot(slotId: string, userId: string)`
- `releaseExpiredSlotLocks(now?: Date)`
- `rescheduleRegistration(registrationId: string, newSlotId: string, userId: string)`
- `markNoShow(registrationId: string, reason: string, userId?: string)`
- `suspendSchedule(scheduleId: string, reason: string, userId?: string)`

All write methods must use Prisma transactions and `writeAuditLog`.

- [ ] **Step 5: Add API routes**

Add admin routes:

- `GET /api/admin/schedule-templates`
- `POST /api/admin/schedule-templates`
- `PUT /api/admin/schedule-templates/:id`
- `POST /api/admin/schedule-templates/:id/generate`
- `POST /api/admin/schedules/:id/suspend`
- `POST /api/admin/registrations/:id/no-show`
- `GET /api/admin/slot-stats`

Add mini routes:

- `POST /api/mini/slots/:id/lock`
- `POST /api/mini/registrations/:id/reschedule`

Update public slot query to hide locked expired slots after calling `releaseExpiredSlotLocks`.

- [ ] **Step 6: Update UI**

Update `SchedulesPage.vue` with template creation, batch generation, and suspension actions. Update `RegistrationsPage.vue` with status filters, reschedule history, and no-show action. Update miniapp appointment page with lock countdown and appointments page with reschedule entry.

- [ ] **Step 7: Verify phase 2**

Run:

```bash
npm --prefix backend run test -- src/services/scheduling.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/services/scheduling.ts backend/src/services/scheduling.test.ts backend/src/routes/admin.ts backend/src/routes/mini.ts backend/src/routes/public.ts frontend/src/pages/SchedulesPage.vue frontend/src/pages/RegistrationsPage.vue miniapp/src/pages
git commit -m "feat: enhance scheduling and slot operations"
```

---

## Task 4: Phase 3 - Mock Payment and Refund Closure

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/providers/payment-provider.ts`
- Create: `backend/src/services/payment.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/mini.ts`
- Modify: `frontend/src/pages/CashierWorkbenchPage.vue`
- Create: `frontend/src/pages/PaymentHistoryPage.vue`
- Create: `miniapp/src/pages/fees/index.vue`
- Test: `backend/src/services/payment.test.ts`

- [ ] **Step 1: Write payment service tests**

Create `backend/src/services/payment.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { assertCanCancelOrder, assertCanRefundOrder, createMockTransactionNo } from './payment'

describe('payment workflow rules', () => {
  it('allows cancellation only for pending orders', () => {
    expect(() => assertCanCancelOrder('PENDING')).not.toThrow()
    expect(() => assertCanCancelOrder('PAID')).toThrow('Only pending payment orders can be cancelled')
  })

  it('allows refund only for paid orders', () => {
    expect(() => assertCanRefundOrder('PAID')).not.toThrow()
    expect(() => assertCanRefundOrder('PENDING')).toThrow('Only paid payment orders can be refunded')
  })

  it('creates stable mock transaction number prefix', () => {
    expect(createMockTransactionNo('PAY', new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^PAY20260714/)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/payment.test.ts`

Expected: FAIL because `payment.ts` is absent.

- [ ] **Step 3: Update schema**

Add:

- `enum PaymentBusinessType`
- `enum RefundStatus`
- `model PaymentTransaction`
- `model RefundOrder`
- `model RefundTransaction`
- `model PaymentSettlement`

Extend `PaymentOrder` with `businessType`, `sourceType`, `sourceId`, `cancelledAt`, `refundedAt`, and `payMethod`.

- [ ] **Step 4: Implement mock payment provider**

Create `backend/src/providers/payment-provider.ts`:

```ts
export type ProviderPaymentResult = { providerTradeNo: string; status: 'SUCCESS'; raw: Record<string, unknown> }
export type ProviderRefundResult = { providerRefundNo: string; status: 'SUCCESS'; raw: Record<string, unknown> }

export interface PaymentProvider {
  pay(input: { orderNo: string; amount: string; payMethod: string }): Promise<ProviderPaymentResult>
  refund(input: { refundNo: string; amount: string; reason: string }): Promise<ProviderRefundResult>
  query(transactionNo: string): Promise<{ transactionNo: string; status: 'SUCCESS' | 'NOT_FOUND' }>
}

export class MockPaymentProvider implements PaymentProvider {
  async pay(input: { orderNo: string; amount: string; payMethod: string }) {
    return { providerTradeNo: `MOCKPAY-${input.orderNo}`, status: 'SUCCESS' as const, raw: input }
  }

  async refund(input: { refundNo: string; amount: string; reason: string }) {
    return { providerRefundNo: `MOCKREFUND-${input.refundNo}`, status: 'SUCCESS' as const, raw: input }
  }

  async query(transactionNo: string) {
    return { transactionNo, status: 'SUCCESS' as const }
  }
}
```

- [ ] **Step 5: Implement payment service and routes**

Create `backend/src/services/payment.ts` with `mockPayOrder`, `cancelPaymentOrder`, `requestRefund`, `executeRefund`, `recalculateOrderAmount`, `assertCanCancelOrder`, `assertCanRefundOrder`, and `createMockTransactionNo`.

Add routes:

- `POST /api/staff/cashier/payment-orders/:id/pay`
- `POST /api/staff/cashier/payment-orders/:id/cancel`
- `POST /api/staff/cashier/payment-orders/:id/refunds`
- `POST /api/staff/cashier/refunds/:id/execute`
- `GET /api/staff/cashier/payment-orders`
- `GET /api/mini/fees`

- [ ] **Step 6: Update UI**

Update cashier workbench with paid/cancelled/refunded tabs, order details, payment transactions, refund dialog, and refund execution. Add miniapp fees page and pages.json entry.

- [ ] **Step 7: Verify phase 3**

Run:

```bash
npm --prefix backend run test -- src/services/payment.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/providers/payment-provider.ts backend/src/services/payment.ts backend/src/services/payment.test.ts backend/src/routes/staff.ts backend/src/routes/mini.ts frontend/src/pages miniapp/src
git commit -m "feat: add mock payment and refund workflow"
```

---

## Task 5: Phase 4 - Pharmacy Inventory

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/pharmacy-inventory.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/admin.ts`
- Modify: `frontend/src/pages/PharmacyWorkbenchPage.vue`
- Create: `frontend/src/pages/DrugStockPage.vue`
- Create: `frontend/src/pages/DrugStockMovementsPage.vue`
- Test: `backend/src/services/pharmacy-inventory.test.ts`

- [ ] **Step 1: Write inventory rule tests**

Create `backend/src/services/pharmacy-inventory.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { chooseDispenseBatches, assertBatchCanDispense } from './pharmacy-inventory'

describe('pharmacy inventory rules', () => {
  it('uses earliest valid expiry batches first', () => {
    const batches = chooseDispenseBatches(
      [
        { id: 'late', quantity: 10, expiresAt: new Date('2027-01-01') },
        { id: 'early', quantity: 5, expiresAt: new Date('2026-08-01') },
      ],
      7,
      new Date('2026-07-14'),
    )

    expect(batches).toEqual([
      { batchId: 'early', quantity: 5 },
      { batchId: 'late', quantity: 2 },
    ])
  })

  it('rejects expired batches', () => {
    expect(() => assertBatchCanDispense(new Date('2026-07-01'), new Date('2026-07-14'))).toThrow('Expired stock batch cannot be dispensed')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/pharmacy-inventory.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add:

- `enum DrugStockMovementType`
- `model DrugStockBatch`
- `model DrugStockMovement`
- `model DrugStockAlert`

Extend `DrugCatalog` with `minStock`, `requiresBatch`, and `isActive` if missing.

- [ ] **Step 4: Implement inventory service**

Create `backend/src/services/pharmacy-inventory.ts` with pure helpers from the test plus DB functions: `receiveStock`, `adjustStock`, `damageStock`, `dispensePrescriptionWithStock`, `returnDispensedPrescription`, `listStockAlerts`.

Use transactions for all stock mutations and create `DrugStockMovement` rows for every quantity change.

- [ ] **Step 5: Add routes**

Add pharmacy/admin routes:

- `GET /api/staff/pharmacy/stock-batches`
- `POST /api/staff/pharmacy/stock-batches`
- `POST /api/staff/pharmacy/stock-batches/:id/adjust`
- `POST /api/staff/pharmacy/stock-batches/:id/damage`
- `GET /api/staff/pharmacy/stock-movements`
- `GET /api/staff/pharmacy/stock-alerts`
- `POST /api/staff/pharmacy/prescriptions/:id/dispense`
- `POST /api/staff/pharmacy/prescriptions/:id/return`

- [ ] **Step 6: Update UI**

Add drug stock page, stock movements page, low-stock/near-expiry alerts, and pharmacy workbench stock warnings. The dispense dialog must show selected stock batches.

- [ ] **Step 7: Verify phase 4**

Run:

```bash
npm --prefix backend run test -- src/services/pharmacy-inventory.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/services/pharmacy-inventory.ts backend/src/services/pharmacy-inventory.test.ts backend/src/routes/staff.ts backend/src/routes/admin.ts frontend/src/pages frontend/src/router/index.ts frontend/src/api/hospital.ts
git commit -m "feat: add pharmacy inventory workflow"
```

---

## Task 6: Phase 5 - Clinical Efficiency and Quality

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/clinical-quality.ts`
- Modify: `backend/src/routes/admin.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `frontend/src/pages/DoctorWorkbenchPage.vue`
- Modify: `frontend/src/pages/PharmacyWorkbenchPage.vue`
- Create: `frontend/src/pages/ClinicalTemplatesPage.vue`
- Test: `backend/src/services/clinical-quality.test.ts`

- [ ] **Step 1: Write clinical quality tests**

Create `backend/src/services/clinical-quality.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { findDuplicateDrugIds, validatePrescriptionDraft } from './clinical-quality'

describe('clinical quality helpers', () => {
  it('detects duplicate prescription drugs', () => {
    expect(findDuplicateDrugIds([{ drugId: 'a' }, { drugId: 'b' }, { drugId: 'a' }])).toEqual(['a'])
  })

  it('rejects empty prescription quantity and usage fields', () => {
    expect(() =>
      validatePrescriptionDraft([{ drugId: 'drug-1', quantity: 0, dosage: '', usage: '' }]),
    ).toThrow('Prescription item quantity, dosage, and usage are required')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/clinical-quality.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add:

- `MedicalRecordTemplate`
- `CommonDiagnosis`
- `CommonMedicalOrder`
- `PrescriptionTemplate`
- `PrescriptionTemplateItem`
- `PrescriptionReviewLog`

Add prescription statuses or fields needed for rejected/re-submitted prescriptions, preserving existing `SUBMITTED`, `REVIEWED`, `DISPENSED`, and `CANCELLED`.

- [ ] **Step 4: Implement clinical quality service**

Create `backend/src/services/clinical-quality.ts` with:

- `findDuplicateDrugIds`
- `validatePrescriptionDraft`
- `applyRecordTemplate`
- `createPrescriptionFromTemplate`
- `reviewPrescription`
- `rejectPrescription`
- `resubmitPrescription`

The service must create `PrescriptionReviewLog` for every pharmacy review or rejection.

- [ ] **Step 5: Add routes**

Add admin/doctor/pharmacy routes:

- `GET/POST/PUT /api/admin/medical-record-templates`
- `GET/POST/PUT /api/admin/common-diagnoses`
- `GET/POST/PUT /api/admin/common-orders`
- `GET/POST/PUT /api/admin/prescription-templates`
- `POST /api/staff/doctor/encounters/:id/apply-record-template`
- `POST /api/staff/doctor/encounters/:id/prescriptions/from-template`
- `POST /api/staff/doctor/prescriptions/:id/resubmit`
- `POST /api/staff/pharmacy/prescriptions/:id/reject`

- [ ] **Step 6: Update UI**

Add template management page. Update doctor workbench with template selection for records, diagnoses, orders, and prescriptions. Update pharmacy workbench with reject dialog and review history.

- [ ] **Step 7: Verify phase 5**

Run:

```bash
npm --prefix backend run test -- src/services/clinical-quality.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/services/clinical-quality.ts backend/src/services/clinical-quality.test.ts backend/src/routes/admin.ts backend/src/routes/staff.ts frontend/src/pages frontend/src/router/index.ts frontend/src/api/hospital.ts
git commit -m "feat: add clinical templates and prescription review quality"
```

---

## Task 7: Phase 6 - Patient Notifications and Queue

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/queue.ts`
- Modify: `backend/src/routes/admin.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/mini.ts`
- Modify: `frontend/src/pages/DoctorWorkbenchPage.vue`
- Modify: `frontend/src/pages/RegistrationsPage.vue`
- Create: `miniapp/src/pages/notifications/index.vue`
- Create: `miniapp/src/pages/queue/index.vue`
- Modify: `miniapp/src/pages/doctors/index.vue`
- Test: `backend/src/services/queue.test.ts`

- [ ] **Step 1: Write queue tests**

Create `backend/src/services/queue.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { estimateWaitMinutes, nextQueueNumber, assertCanEnterQueue } from './queue'

describe('queue rules', () => {
  it('assigns next queue number', () => {
    expect(nextQueueNumber([{ queueNo: 1 }, { queueNo: 2 }])).toBe(3)
  })

  it('estimates wait time', () => {
    expect(estimateWaitMinutes(4, 8)).toBe(32)
  })

  it('allows queue only after check-in', () => {
    expect(() => assertCanEnterQueue('CHECKED_IN')).not.toThrow()
    expect(() => assertCanEnterQueue('BOOKED')).toThrow('Only checked-in registrations can enter queue')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/queue.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add:

- `PatientNotification`
- `QueueTicket`
- `DoctorQueueState`
- `FavoriteDoctor`

Link `QueueTicket` to `Registration`, `DoctorProfile`, and `Department`.

- [ ] **Step 4: Implement queue service**

Create `backend/src/services/queue.ts` with pure helpers from tests plus `createAppointmentNotification`, `createCheckInQueueTicket`, `callNextPatient`, `skipQueueTicket`, `restoreQueueTicket`, `completeQueueTicket`, `favoriteDoctor`, and `unfavoriteDoctor`.

- [ ] **Step 5: Add routes**

Add:

- `GET /api/mini/notifications`
- `POST /api/mini/notifications/:id/read`
- `GET /api/mini/queue`
- `POST /api/mini/doctors/:id/favorite`
- `DELETE /api/mini/doctors/:id/favorite`
- `POST /api/mini/visit-records/:id/follow-up`
- `POST /api/admin/registrations/:id/check-in` updated to create queue ticket
- `POST /api/staff/doctor/queue/next`
- `POST /api/staff/doctor/queue/:id/skip`
- `POST /api/staff/doctor/queue/:id/restore`

- [ ] **Step 6: Update UI**

Add miniapp notifications and queue pages. Update appointments page to show queue number, current call, and wait estimate. Update doctor workbench with current queue, next, skip, and restore actions. Add favorite button on doctor detail/list.

- [ ] **Step 7: Verify phase 6**

Run:

```bash
npm --prefix backend run test -- src/services/queue.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/services/queue.ts backend/src/services/queue.test.ts backend/src/routes backend/src/app.ts frontend/src/pages miniapp/src
git commit -m "feat: add patient notifications and outpatient queue"
```

---

## Task 8: Phase 7 - Operations Dashboard

**Files:**
- Create: `backend/src/services/dashboard.ts`
- Modify: `backend/src/routes/admin.ts`
- Modify: `frontend/src/pages/DashboardPage.vue`
- Test: `backend/src/services/dashboard.test.ts`
- Test: `frontend/src/pages/DashboardPage.spec.ts`

- [ ] **Step 1: Write dashboard aggregation test**

Create `backend/src/services/dashboard.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { calculateRate, netRevenue } from './dashboard'

describe('dashboard aggregation helpers', () => {
  it('calculates rates safely', () => {
    expect(calculateRate(5, 10)).toBe(0.5)
    expect(calculateRate(0, 0)).toBe(0)
  })

  it('excludes refunded and cancelled orders from net revenue', () => {
    expect(
      netRevenue([
        { amount: 100, status: 'PAID' },
        { amount: 50, status: 'REFUNDED' },
        { amount: 20, status: 'CANCELLED' },
      ]),
    ).toBe(100)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/dashboard.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Implement dashboard service**

Create `backend/src/services/dashboard.ts` with `calculateRate`, `netRevenue`, `getOverviewDashboard`, `getOutpatientDashboard`, `getRevenueDashboard`, `getPharmacyAlertsDashboard`, and `getQueuePressureDashboard`.

Aggregations must support date range, campus, department, and doctor filters.

- [ ] **Step 4: Add dashboard routes**

Add:

- `GET /api/admin/dashboard/overview`
- `GET /api/admin/dashboard/outpatient`
- `GET /api/admin/dashboard/revenue`
- `GET /api/admin/dashboard/pharmacy-alerts`
- `GET /api/admin/dashboard/queue-pressure`

- [ ] **Step 5: Update Dashboard page**

Split dashboard into today overview, outpatient funnel, queue pressure, revenue trend, department load, stock alerts, and pending work items. Reuse Element Plus tables/cards and keep empty states clean.

- [ ] **Step 6: Verify phase 7**

Run:

```bash
npm --prefix backend run test -- src/services/dashboard.test.ts
npm --prefix frontend run test -- src/pages/DashboardPage.spec.ts
npm --prefix backend run build
npm --prefix frontend run build
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

Run:

```bash
git add backend/src/services/dashboard.ts backend/src/services/dashboard.test.ts backend/src/routes/admin.ts frontend/src/pages/DashboardPage.vue frontend/src/pages/DashboardPage.spec.ts frontend/src/api/hospital.ts
git commit -m "feat: upgrade operations dashboard"
```

---

## Task 9: Phase 8 - Inpatient Management

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/inpatient.ts`
- Create: `backend/src/routes/nurse.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/mini.ts`
- Modify: `backend/src/app.ts`
- Create: `frontend/src/pages/InpatientAdmissionsPage.vue`
- Create: `frontend/src/pages/BedsPage.vue`
- Create: `frontend/src/pages/InpatientDetailPage.vue`
- Create: `miniapp/src/pages/inpatient/index.vue`
- Test: `backend/src/services/inpatient.test.ts`

- [ ] **Step 1: Write inpatient workflow tests**

Create `backend/src/services/inpatient.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { assertCanDischarge, assertCanOccupyBed, nextAdmissionNo } from './inpatient'

describe('inpatient rules', () => {
  it('allows bed occupation only when available', () => {
    expect(() => assertCanOccupyBed('AVAILABLE')).not.toThrow()
    expect(() => assertCanOccupyBed('OCCUPIED')).toThrow('Only available beds can be assigned')
  })

  it('allows discharge only after admission', () => {
    expect(() => assertCanDischarge('ADMITTED')).not.toThrow()
    expect(() => assertCanDischarge('PENDING')).toThrow('Only admitted patients can request discharge')
  })

  it('generates inpatient admission number prefix', () => {
    expect(nextAdmissionNo(new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^IP20260714/)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/inpatient.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add inpatient enums and models:

- `Ward`
- `Bed`
- `InpatientAdmission`
- `BedAssignment`
- `InpatientMedicalRecord`
- `InpatientOrder`
- `InpatientCharge`
- `DischargeRequest`

Add roles in seed later: `NURSE` and `INPATIENT_ADMIN`.

- [ ] **Step 4: Implement inpatient service**

Create `backend/src/services/inpatient.ts` with:

- `nextAdmissionNo`
- `admitPatient`
- `assignBed`
- `transferBed`
- `releaseBed`
- `createInpatientOrder`
- `stopInpatientOrder`
- `createInpatientChargeFromOrder`
- `requestDischarge`
- `approveDischarge`
- `settleDischarge`
- `completeDischarge`

All bed and charge mutations must run in transactions.

- [ ] **Step 5: Add inpatient routes**

Create `backend/src/routes/nurse.ts` and mount it in `backend/src/app.ts` at `/api/staff/nurse`.

Routes:

- `GET/POST/PUT /api/admin/wards`
- `GET/POST/PUT /api/admin/beds`
- `GET /api/staff/nurse/admissions`
- `POST /api/staff/nurse/admissions`
- `POST /api/staff/nurse/admissions/:id/assign-bed`
- `POST /api/staff/nurse/admissions/:id/transfer-bed`
- `GET /api/staff/doctor/inpatients`
- `POST /api/staff/doctor/inpatients/:id/orders`
- `POST /api/staff/doctor/inpatients/:id/discharge-request`
- `POST /api/staff/nurse/discharges/:id/approve`
- `POST /api/staff/nurse/discharges/:id/settle`
- `POST /api/staff/nurse/discharges/:id/complete`
- `GET /api/mini/inpatient`

- [ ] **Step 6: Update UI**

Add ward, bed, admission list, inpatient detail, inpatient orders, inpatient charges, and discharge pages. Add miniapp inpatient summary page.

- [ ] **Step 7: Verify phase 8**

Run:

```bash
npm --prefix backend run test -- src/services/inpatient.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/services/inpatient.ts backend/src/services/inpatient.test.ts backend/src/routes backend/src/app.ts frontend/src miniapp/src
git commit -m "feat: add inpatient management workflow"
```

---

## Task 10: Phase 9 - Mock Insurance Settlement

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/providers/insurance-provider.ts`
- Create: `backend/src/services/insurance.ts`
- Modify: `backend/src/routes/admin.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/mini.ts`
- Create: `frontend/src/pages/InsuranceProfilesPage.vue`
- Create: `frontend/src/pages/InsuranceMappingsPage.vue`
- Create: `frontend/src/pages/InsuranceSettlementsPage.vue`
- Test: `backend/src/services/insurance.test.ts`

- [ ] **Step 1: Write insurance tests**

Create `backend/src/services/insurance.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { calculateInsuranceSplit, assertCanReverseSettlement } from './insurance'

describe('mock insurance settlement rules', () => {
  it('calculates class A reimbursement by ratio', () => {
    expect(calculateInsuranceSplit({ amount: 100, category: 'A', ratio: 0.7, selfPayFirstRatio: 0 })).toEqual({
      insuranceAmount: 70,
      selfPayAmount: 30,
    })
  })

  it('calculates class C as self-pay', () => {
    expect(calculateInsuranceSplit({ amount: 100, category: 'C', ratio: 0.7, selfPayFirstRatio: 0 })).toEqual({
      insuranceAmount: 0,
      selfPayAmount: 100,
    })
  })

  it('allows reverse only for settled records', () => {
    expect(() => assertCanReverseSettlement('SETTLED')).not.toThrow()
    expect(() => assertCanReverseSettlement('PRE_SETTLED')).toThrow('Only settled insurance records can be reversed')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/insurance.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add:

- `InsuranceProfile`
- `InsuranceCatalogMapping`
- `InsuranceSettlement`
- `InsuranceSettlementItem`
- `InsuranceProviderLog`

Add enums for insurance status, insurance category, and settlement source.

- [ ] **Step 4: Implement mock insurance provider and service**

Create `backend/src/providers/insurance-provider.ts` with `InsuranceProvider` and `MockInsuranceProvider` methods: `preSettle`, `settle`, `reverse`, `refundOffset`.

Create `backend/src/services/insurance.ts` with `calculateInsuranceSplit`, `preSettleOrder`, `settleOrder`, `reverseSettlement`, and `offsetRefund`.

- [ ] **Step 5: Add routes**

Add:

- `GET/POST/PUT /api/admin/insurance-profiles`
- `GET/POST/PUT /api/admin/insurance-mappings`
- `GET /api/admin/insurance-provider-logs`
- `POST /api/staff/cashier/payment-orders/:id/insurance/pre-settle`
- `POST /api/staff/cashier/payment-orders/:id/insurance/settle`
- `POST /api/staff/cashier/insurance-settlements/:id/reverse`
- `GET /api/mini/fees/:id/insurance`

- [ ] **Step 6: Update UI**

Add insurance profile, mapping, settlement, and provider log pages. Update cashier order detail with pre-settle, settle, reverse buttons and insurance/self-pay breakdown. Update patient fee detail to show insurance split.

- [ ] **Step 7: Verify phase 9**

Run:

```bash
npm --prefix backend run test -- src/services/insurance.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/providers/insurance-provider.ts backend/src/services/insurance.ts backend/src/services/insurance.test.ts backend/src/routes frontend/src miniapp/src
git commit -m "feat: add mock insurance settlement"
```

---

## Task 11: Phase 10 - LIS Lab Workflow

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/providers/lab-provider.ts`
- Create: `backend/src/services/lab.ts`
- Create: `backend/src/routes/lab.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/mini.ts`
- Modify: `backend/src/app.ts`
- Create: `frontend/src/pages/LabItemsPage.vue`
- Create: `frontend/src/pages/LabWorkbenchPage.vue`
- Create: `miniapp/src/pages/lab-reports/index.vue`
- Test: `backend/src/services/lab.test.ts`

- [ ] **Step 1: Write lab tests**

Create `backend/src/services/lab.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { assertCanPublishLabReport, abnormalFlag, nextLabBarcode } from './lab'

describe('lab workflow rules', () => {
  it('marks abnormal results outside reference range', () => {
    expect(abnormalFlag(12, 4, 10)).toBe('HIGH')
    expect(abnormalFlag(2, 4, 10)).toBe('LOW')
    expect(abnormalFlag(6, 4, 10)).toBe('NORMAL')
  })

  it('allows publishing only reviewed reports', () => {
    expect(() => assertCanPublishLabReport('REVIEWED')).not.toThrow()
    expect(() => assertCanPublishLabReport('DRAFT')).toThrow('Only reviewed lab reports can be published')
  })

  it('generates lab barcode prefix', () => {
    expect(nextLabBarcode(new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^LAB20260714/)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/lab.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add:

- `LabTestItem`
- `LabRequest`
- `LabRequestItem`
- `LabSample`
- `LabResult`
- `LabReport`
- `LabProviderLog`

Add lab status enums.

- [ ] **Step 4: Implement lab provider and service**

Create `backend/src/providers/lab-provider.ts` with `LabProvider` and `MockLabProvider` result callback simulation.

Create `backend/src/services/lab.ts` with `createLabRequestFromOrder`, `collectSample`, `receiveSample`, `rejectSample`, `recordLabResults`, `reviewLabReport`, `publishLabReport`, `getPublishedReportsForPatient`, and pure helpers from the test.

- [ ] **Step 5: Add lab routes**

Create `backend/src/routes/lab.ts` and mount it at `/api/staff/lab`.

Routes:

- `GET/POST/PUT /api/admin/lab-items`
- `POST /api/staff/doctor/encounters/:id/lab-requests`
- `POST /api/staff/doctor/inpatients/:id/lab-requests`
- `GET /api/staff/lab/requests`
- `POST /api/staff/lab/requests/:id/collect`
- `POST /api/staff/lab/samples/:id/receive`
- `POST /api/staff/lab/samples/:id/reject`
- `POST /api/staff/lab/reports/:id/results`
- `POST /api/staff/lab/reports/:id/review`
- `POST /api/staff/lab/reports/:id/publish`
- `GET /api/mini/lab-reports`

- [ ] **Step 6: Update UI**

Add lab item management and lab workbench pages. Doctor workbench and inpatient detail must include "开检验" action. Miniapp gets lab report list/detail.

- [ ] **Step 7: Verify phase 10**

Run:

```bash
npm --prefix backend run test -- src/services/lab.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/providers/lab-provider.ts backend/src/services/lab.ts backend/src/services/lab.test.ts backend/src/routes backend/src/app.ts frontend/src miniapp/src
git commit -m "feat: add mock LIS lab workflow"
```

---

## Task 12: Phase 11 - PACS Imaging Workflow

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/providers/pacs-provider.ts`
- Create: `backend/src/services/radiology.ts`
- Create: `backend/src/routes/radiology.ts`
- Modify: `backend/src/routes/staff.ts`
- Modify: `backend/src/routes/mini.ts`
- Modify: `backend/src/app.ts`
- Create: `frontend/src/pages/ImagingItemsPage.vue`
- Create: `frontend/src/pages/RadiologyWorkbenchPage.vue`
- Create: `miniapp/src/pages/imaging-reports/index.vue`
- Test: `backend/src/services/radiology.test.ts`

- [ ] **Step 1: Write radiology tests**

Create `backend/src/services/radiology.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { assertCanPublishImagingReport, nextStudyUid, mockImageUrl } from './radiology'

describe('radiology workflow rules', () => {
  it('allows publishing only reviewed imaging reports', () => {
    expect(() => assertCanPublishImagingReport('REVIEWED')).not.toThrow()
    expect(() => assertCanPublishImagingReport('DRAFT')).toThrow('Only reviewed imaging reports can be published')
  })

  it('generates deterministic mock study UID prefix', () => {
    expect(nextStudyUid(new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^1\.2\.826\.0\.1\.3680043\.10\.543\.20260714/)
  })

  it('creates local mock image URL', () => {
    expect(mockImageUrl('study-1')).toBe('/mock-pacs/studies/study-1/viewer')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- src/services/radiology.test.ts`

Expected: FAIL because service is absent.

- [ ] **Step 3: Update schema**

Add:

- `ImagingExamItem`
- `ImagingRequest`
- `ImagingAppointment`
- `ImagingStudy`
- `ImagingReport`
- `PacsProviderLog`

Add imaging status enums.

- [ ] **Step 4: Implement PACS provider and radiology service**

Create `backend/src/providers/pacs-provider.ts` with `PacsProvider` and `MockPacsProvider` methods to create study metadata and mock image links.

Create `backend/src/services/radiology.ts` with `createImagingRequestFromOrder`, `scheduleImaging`, `checkInImagingAppointment`, `completeImagingStudy`, `recordImagingReport`, `reviewImagingReport`, `publishImagingReport`, and pure helpers from the test.

- [ ] **Step 5: Add radiology routes**

Create `backend/src/routes/radiology.ts` and mount it at `/api/staff/radiology`.

Routes:

- `GET/POST/PUT /api/admin/imaging-items`
- `POST /api/staff/doctor/encounters/:id/imaging-requests`
- `POST /api/staff/doctor/inpatients/:id/imaging-requests`
- `GET /api/staff/radiology/requests`
- `POST /api/staff/radiology/requests/:id/schedule`
- `POST /api/staff/radiology/appointments/:id/check-in`
- `POST /api/staff/radiology/appointments/:id/complete`
- `POST /api/staff/radiology/reports/:id/record`
- `POST /api/staff/radiology/reports/:id/review`
- `POST /api/staff/radiology/reports/:id/publish`
- `GET /api/mini/imaging-reports`

- [ ] **Step 6: Update UI**

Add imaging item management and radiology workbench pages. Doctor workbench and inpatient detail must include "开影像" action. Miniapp gets imaging report list/detail and mock image viewer link.

- [ ] **Step 7: Verify phase 11**

Run:

```bash
npm --prefix backend run test -- src/services/radiology.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix miniapp run typecheck
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add backend/prisma/schema.prisma backend/src/providers/pacs-provider.ts backend/src/services/radiology.ts backend/src/services/radiology.test.ts backend/src/routes backend/src/app.ts frontend/src miniapp/src
git commit -m "feat: add mock PACS imaging workflow"
```

---

## Task 13: Full Seed Expansion

**Files:**
- Modify: `backend/prisma/seed.ts`
- Test: `backend/prisma/seed-his-expansion.test.ts`

- [ ] **Step 1: Write seed coverage test**

Create `backend/prisma/seed-his-expansion.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { hisExpansionSeedPlan } from './seed'

describe('HIS expansion seed plan', () => {
  it('contains demo data for every expansion phase', () => {
    expect(hisExpansionSeedPlan.adminResources.departments.length).toBeGreaterThanOrEqual(16)
    expect(hisExpansionSeedPlan.scheduleTemplates.length).toBeGreaterThanOrEqual(6)
    expect(hisExpansionSeedPlan.stockBatches.length).toBeGreaterThanOrEqual(30)
    expect(hisExpansionSeedPlan.clinicalTemplates.length).toBeGreaterThanOrEqual(12)
    expect(hisExpansionSeedPlan.notifications.length).toBeGreaterThanOrEqual(10)
    expect(hisExpansionSeedPlan.wards.length).toBeGreaterThanOrEqual(4)
    expect(hisExpansionSeedPlan.insuranceProfiles.length).toBeGreaterThanOrEqual(10)
    expect(hisExpansionSeedPlan.labItems.length).toBeGreaterThanOrEqual(20)
    expect(hisExpansionSeedPlan.imagingItems.length).toBeGreaterThanOrEqual(12)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm --prefix backend run test -- prisma/seed-his-expansion.test.ts`

Expected: FAIL until `hisExpansionSeedPlan` is exported.

- [ ] **Step 3: Expand seed data**

Modify `backend/prisma/seed.ts` to export `hisExpansionSeedPlan` and seed:

- Admin master data for phase 1.
- Schedule templates and generated future slots for phase 2.
- Payment transactions and refund samples for phase 3.
- Stock batches, movements, and alerts for phase 4.
- Clinical templates, common diagnoses/orders, and prescription templates for phase 5.
- Notifications, queue tickets, queue states, and favorite doctors for phase 6.
- Dashboard-relevant mixed states for phase 7.
- Wards, beds, inpatient admissions, inpatient orders, charges, and discharge requests for phase 8.
- Insurance profiles, mappings, settlements, and provider logs for phase 9.
- Lab items, requests, samples, results, and reports for phase 10.
- Imaging items, requests, appointments, studies, and reports for phase 11.

All writes must use stable codes and upserts or deterministic delete/recreate scoped to demo codes.

- [ ] **Step 4: Verify seed**

Run:

```bash
npm --prefix backend run test -- prisma/seed-his-expansion.test.ts
npm --prefix backend run prisma:generate
npm --prefix backend run db:push
npm --prefix backend run db:seed
npm --prefix backend run db:seed
```

Expected: tests pass, database sync succeeds, and running seed twice has no unique constraint errors.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/prisma/seed.ts backend/prisma/seed-his-expansion.test.ts
git commit -m "feat: seed HIS expansion demo data"
```

---

## Task 14: Final Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-14-his-platform-expansion-design.md` only if implementation changed scope.

- [ ] **Step 1: Update README**

Document:

- All demo roles: `admin`, doctor, cashier, pharmacy, patient, nurse, lab tech, radiologist, inpatient admin.
- Door-to-door outpatient demo.
- Inpatient admission to discharge demo.
- Mock insurance settlement demo.
- LIS request to report demo.
- PACS request to report demo.
- Note that payment, insurance, LIS, and PACS are local mock providers.

- [ ] **Step 2: Run full verification**

Run:

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

Expected: all commands exit 0. Build warnings are acceptable only when exit code is 0.

- [ ] **Step 3: Verify repository cleanliness**

Run: `git status --short`

Expected: only intentional README/spec changes are listed before commit. Generated Prisma files should not be manually staged unless the repository already tracks them and Prisma generation changed them intentionally.

- [ ] **Step 4: Commit final docs**

Run:

```bash
git add README.md docs/superpowers/specs/2026-07-14-his-platform-expansion-design.md
git commit -m "docs: document HIS expansion demo workflows"
```

---

## Coverage Checklist

- Phase 1 admin CRUD, pagination, filters, enable/disable, audit: Task 2.
- Phase 2 schedule templates, locks, reschedule, no-show, suspension: Task 3.
- Phase 3 mock payment, transactions, refunds, cancellation: Task 4.
- Phase 4 pharmacy stock, batches, movements, alerts, dispense constraints: Task 5.
- Phase 5 clinical templates, common diagnosis/orders, prescription review and rejection: Task 6.
- Phase 6 notifications, queue, wait estimate, favorites, follow-up: Task 7.
- Phase 7 dashboard overview, outpatient funnel, revenue, alerts, queue pressure: Task 8.
- Phase 8 inpatient admission, bed, order, charge, discharge: Task 9.
- Phase 9 insurance profile, mappings, pre-settle, settle, reverse, refund offset: Task 10.
- Phase 10 LIS items, request, sample, result, report: Task 11.
- Phase 11 PACS items, request, appointment, study, report, mock viewer link: Task 12.
- Seed coverage for every phase: Task 13.
- README and full verification: Task 14.

## Execution Handoff

Plan execution should use one of these approaches:

1. **Subagent-Driven (recommended)**: dispatch a fresh subagent per task, review between tasks, and commit after each task.
2. **Inline Execution**: execute tasks in this session using checkpointed batches.

Use the listed verification commands before each commit. Do not skip schema generation, database push, or seed verification for schema-changing phases.
