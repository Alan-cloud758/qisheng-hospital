# Outpatient Complete Business Design

## Background

Qisheng Hospital already has the first-stage platform skeleton modeled after the Meimao Mall stack: Express 5, TypeScript, Prisma 7, MySQL/MariaDB, Vue 3, Vite, Element Plus, Pinia, and uni-app. The current project has health checks, authentication, a first appointment API slice, an admin shell, a patient miniapp shell, and starter seed data.

This design expands the platform into a complete outpatient business edition. It does not include inpatient care, insurance settlement, LIS/PACS, real payment channels, EMR quality control, or third-party hospital integrations.

## Goal

Build a usable outpatient workflow across backend, web admin, and patient miniapp:

1. Patient selects department, doctor, and appointment slot.
2. Patient creates a registration and can view or cancel it.
3. Admin checks in the registration.
4. Doctor starts the encounter, writes record content, adds diagnoses, adds clinical orders, submits prescriptions, and completes the visit.
5. Cashier collects simulated payment for registration, consultation, and prescription items.
6. Pharmacy reviews and dispenses paid prescriptions.
7. Patient can view appointment status and visit summaries.

Every major module should have enough seed data for demonstration. Master-data modules should have about 10 to 20 records. Schedules, slots, registrations, payments, prescriptions, and audit logs should have more records so queue pages feel alive.

## Architecture

Keep the existing three-app layout: backend, frontend, miniapp, docs, and deploy.

Backend state-changing business rules live in service modules, not inside Vue pages. Routes expose action endpoints such as check in, start visit, complete visit, pay, review prescription, and dispense prescription. Frontends call these action endpoints and render the resulting state.

## Included Scope

- System management: accounts, roles, permissions, menus, audit logs.
- Hospital organization: campuses, departments, clinic rooms, doctor profiles.
- Patient center: patient profiles, visit members, registration history, encounter history.
- Scheduling and registration: schedule CRUD, slot generation, slot query, registration, cancel, check-in.
- Doctor workspace: pending visits, start visit, medical record, diagnoses, clinical orders, prescriptions, complete encounter.
- Cashier workspace: fee items, pending payment orders, simulated payment, payment history.
- Pharmacy workspace: drug catalog, prescription list, review, dispense.
- Operations config: announcements, dictionaries, dashboard statistics.
- Patient miniapp: public hospital data, visit member management, appointment flow, my appointments, visit record summary.
- Seed data expanded to meaningful page coverage.

## Excluded Scope

- Inpatient management.
- Insurance settlement.
- LIS/PACS integrations.
- Real WeChat or Alipay payment.
- EMR quality control.
- Real electronic prescription circulation with external pharmacies.
- Third-party hospital interface integrations.

## Data Model Changes

Current Prisma schema already covers most core entities. Add or refine:

- EncounterStatus enum for explicit encounter lifecycle.
- MedicalOrder for clinical orders and treatment advice that are not drug prescriptions.
- PaymentOrderItem for itemized registration, consultation, drug, and other charges.
- DictionaryCategory and DictionaryItem for operational dictionaries.
- PrescriptionReviewLog if pharmacy review and dispense need a dedicated timeline. If this creates too much extra scope, audit logs can cover the first complete outpatient version.

State lifecycle rules:

- Slot: AVAILABLE to LOCKED to BOOKED. Cancel releases slot back to AVAILABLE.
- Registration: BOOKED to CHECKED_IN to IN_VISIT to COMPLETED, with CANCELLED and NO_SHOW branches.
- Payment: PENDING to PAID, with CANCELLED and REFUNDED reserved.
- Prescription: DRAFT to SUBMITTED to REVIEWED to DISPENSED, with CANCELLED reserved.
- Encounter: OPEN to COMPLETED, with clear start and complete timestamps.

## Backend API Design

Use role-oriented route groups:

- /api/admin for system management, hospital organization, patients, schedules, payments, drugs, announcements, dictionaries, and dashboard.
- /api/staff/doctor for doctor workspace APIs.
- /api/staff/cashier for cashier workspace APIs.
- /api/staff/pharmacy for pharmacy workspace APIs.
- /api/mini for patient miniapp APIs.
- /api/public for public department, doctor, announcement, and slot APIs.

Important action endpoints:

- POST /api/mini/registrations
- POST /api/mini/registrations/:id/cancel
- POST /api/admin/registrations/:id/check-in
- POST /api/staff/doctor/encounters/:id/start
- PUT /api/staff/doctor/encounters/:id/record
- POST /api/staff/doctor/encounters/:id/diagnoses
- POST /api/staff/doctor/encounters/:id/orders
- POST /api/staff/doctor/encounters/:id/prescriptions
- POST /api/staff/doctor/encounters/:id/complete
- POST /api/staff/cashier/payment-orders/:id/pay
- POST /api/staff/pharmacy/prescriptions/:id/review
- POST /api/staff/pharmacy/prescriptions/:id/dispense

List and CRUD endpoints should be provided for all master data used by pages.

## Web Frontend Design

The web app remains a dense operational system using Element Plus:

- Dashboard with outpatient KPIs and queues.
- System pages: accounts, roles, menus, audit logs.
- Organization pages: campuses, departments, clinic rooms, doctors.
- Patient pages: profiles, visit members, visit history.
- Scheduling pages: schedules, slots, registrations.
- Doctor workspace: waiting list, encounter detail, record, diagnosis, clinical order, prescription.
- Cashier workspace: pending payments, payment history, fee items.
- Pharmacy workspace: prescriptions, review, dispense, drug catalog.
- Operations pages: announcements and dictionaries.

Every page should call backend APIs, not rely on static page-local mock content. Empty states should still render cleanly.

## Miniapp Design

The patient miniapp should support:

- Home with announcements, shortcut entries, and recommended departments.
- Department list and detail.
- Doctor list, doctor detail, and available slots.
- Visit member list, add, edit, set default.
- Appointment confirmation and submission.
- My appointments with cancel and status display.
- Visit records with record summary, diagnoses, and prescription summary.

The miniapp should stay lightweight and fast. It should prioritize clear patient actions over decorative content.

## Seed Data Expansion

The seed script must be repeatable and idempotent. It should create realistic datasets:

- Campuses: 2 to 3.
- Departments: 12 to 16.
- Clinic rooms: 15 or more.
- Doctors: 20 or more across departments.
- Staff accounts: administrators, doctors, cashiers, pharmacy workers, nurses.
- Patient accounts and profiles: 15 or more.
- Visit members: 20 or more.
- Schedules: at least 7 future days across multiple doctors, 80 or more records.
- Slots: 300 or more.
- Registrations: 30 or more across BOOKED, CHECKED_IN, IN_VISIT, COMPLETED, CANCELLED.
- Encounters, records, diagnoses: 15 or more.
- Clinical orders: 15 or more.
- Fee items: 15 or more.
- Payment orders and items: 30 or more across payment states.
- Drugs: 30 or more.
- Prescriptions and prescription items: 20 or more.
- Announcements: 10 or more.
- Dictionary categories and items: 5 or more categories with 5 to 10 items each.
- Audit logs: 30 or more.

Seeded data should include enough cross-linked records to demonstrate the full outpatient flow.

## Testing Strategy

- Backend service tests for state transitions and illegal transition rejection.
- Backend route tests for registration, cancel, check-in, start encounter, save record, submit prescription, pay, review, dispense.
- Frontend tests for routing and key page rendering.
- Miniapp tests for appointment formatting, status labels, member selection, and core utility behavior.
- Final verification: lint, backend tests, frontend tests, miniapp tests, build, Prisma generate, db push, db seed.

## Acceptance Criteria

- Each backend, admin, and miniapp module has real API-backed data.
- Patient can create and cancel a registration from miniapp APIs.
- Admin can check in a registration.
- Doctor can start and complete an encounter, save record data, diagnoses, orders, and prescriptions.
- Cashier can mark pending payment orders as paid.
- Pharmacy can review and dispense prescriptions.
- Patient can view appointment status and visit summaries.
- Each major page has meaningful seeded data.
- Seed can be run repeatedly without duplicate dirty data.
- Lint, tests, build, Prisma generate, db push, and db seed pass.

## Delivery Plan

Implementation should be planned as staged commits:

1. Schema and seed expansion.
2. Backend outpatient services and action APIs.
3. Admin web module pages and API clients.
4. Patient miniapp real-data flow.
5. Verification, polish, and documentation.
