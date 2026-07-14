import { Router } from 'express'
import { z } from 'zod'
import { AuditAction, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import type { AdminDelegate, AdminResourceConfig } from '../services/admin-crud'
import { hashAccountPassword, registerAdminResourceRoutes } from '../services/admin-crud'
import { validatePrescriptionDraft } from '../services/clinical-quality'
import { assertCanCheckInRegistration } from '../services/outpatient-state'
import { listStockAlerts } from '../services/pharmacy-inventory'
import { generateSchedulesFromTemplate, markNoShow, suspendSchedule } from '../services/scheduling'

export const adminRouter = Router()

adminRouter.use(auth, requireRole('ADMIN'))

const adminResources: Record<string, AdminResourceConfig> = {
  accounts: {
    delegate: prisma.user as unknown as AdminDelegate,
    searchableFields: ['username', 'displayName', 'phone', 'email'],
    writableFields: ['username', 'phone', 'email', 'password', 'displayName', 'status'],
    select: {
      id: true,
      username: true,
      phone: true,
      email: true,
      displayName: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      roles: { include: { role: true } },
      doctorProfile: true,
      patientProfile: true,
    },
    orderBy: { createdAt: 'desc' },
    activeField: 'status',
    beforeWrite: hashAccountPassword,
  },
  roles: {
    delegate: prisma.role as unknown as AdminDelegate,
    searchableFields: ['code', 'name', 'description'],
    writableFields: ['code', 'name', 'description'],
    include: { permissions: { include: { permission: true } } },
    orderBy: { createdAt: 'asc' },
  },
  menus: {
    delegate: prisma.menu as unknown as AdminDelegate,
    searchableFields: ['code', 'title', 'path'],
    writableFields: ['code', 'title', 'path', 'icon', 'sortOrder', 'isActive', 'parentId'],
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    activeField: 'isActive',
  },
  campuses: {
    delegate: prisma.hospitalCampus as unknown as AdminDelegate,
    searchableFields: ['name', 'address', 'phone'],
    writableFields: ['name', 'address', 'phone', 'isActive'],
    include: { departments: true, clinicRooms: true },
    orderBy: { createdAt: 'asc' },
    activeField: 'isActive',
  },
  departments: {
    delegate: prisma.department as unknown as AdminDelegate,
    searchableFields: ['name', 'code', 'summary'],
    writableFields: ['campusId', 'name', 'code', 'summary', 'isActive', 'sortOrder'],
    include: { campus: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    activeField: 'isActive',
  },
  'clinic-rooms': {
    delegate: prisma.clinicRoom as unknown as AdminDelegate,
    searchableFields: ['name', 'floor'],
    writableFields: ['campusId', 'departmentId', 'name', 'floor', 'isActive'],
    include: { campus: true, department: true },
    orderBy: { createdAt: 'asc' },
    activeField: 'isActive',
  },
  doctors: {
    delegate: prisma.doctorProfile as unknown as AdminDelegate,
    searchableFields: ['employeeNo', 'title', 'specialty', 'licenseNo'],
    writableFields: [
      'userId',
      'departmentId',
      'employeeNo',
      'title',
      'specialty',
      'introduction',
      'licenseNo',
      'avatarUrl',
      'consultationFee',
      'isActive',
    ],
    include: { user: { select: { id: true, username: true, displayName: true, phone: true, email: true, status: true } }, department: true },
    orderBy: { createdAt: 'asc' },
    activeField: 'isActive',
  },
  'fee-items': {
    delegate: prisma.feeItem as unknown as AdminDelegate,
    searchableFields: ['code', 'name'],
    writableFields: ['code', 'name', 'amount', 'isActive'],
    orderBy: { code: 'asc' },
    activeField: 'isActive',
  },
  drugs: {
    delegate: prisma.drugCatalog as unknown as AdminDelegate,
    searchableFields: ['code', 'name', 'spec'],
    writableFields: ['code', 'name', 'spec', 'unit', 'price', 'minStock', 'requiresBatch', 'isActive'],
    orderBy: { code: 'asc' },
    activeField: 'isActive',
  },
  announcements: {
    delegate: prisma.announcement as unknown as AdminDelegate,
    searchableFields: ['title', 'content'],
    writableFields: ['title', 'content', 'isActive', 'publishedAt'],
    orderBy: { publishedAt: 'desc' },
    activeField: 'isActive',
  },
  dictionaries: {
    delegate: prisma.dictionaryCategory as unknown as AdminDelegate,
    searchableFields: ['code', 'name', 'description'],
    writableFields: ['code', 'name', 'description'],
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  },
  'dictionary-items': {
    delegate: prisma.dictionaryItem as unknown as AdminDelegate,
    searchableFields: ['code', 'label'],
    writableFields: ['categoryId', 'code', 'label', 'sortOrder', 'isActive'],
    include: { category: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    activeField: 'isActive',
  },
}

registerAdminResourceRoutes(adminRouter, adminResources)

const scheduleTemplateSchema = z.object({
  name: z.string().min(1),
  doctorId: z.string().min(1),
  departmentId: z.string().min(1),
  clinicRoomId: z.string().optional().nullable(),
  period: z.string().min(1),
  capacity: z.coerce.number().int().min(1),
  isActive: z.boolean().optional(),
  rules: z
    .array(
      z.object({
        weekday: z.coerce.number().int().min(0).max(6),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
      }),
    )
    .default([]),
})

const clinicalTemplateSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  advice: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

const commonDiagnosisSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(1),
  note: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

const commonOrderSchema = z.object({
  type: z.string().min(1),
  content: z.string().min(1),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

const prescriptionTemplateSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  items: z
    .array(
      z.object({
        drugId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        dosage: z.string().min(1),
        usage: z.string().min(1),
      }),
    )
    .default([]),
})

adminRouter.get('/medical-record-templates', async (_req, res, next) => {
  try {
    const items = await prisma.medicalRecordTemplate.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/medical-record-templates', async (req, res, next) => {
  try {
    const input = clinicalTemplateSchema.parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.medicalRecordTemplate.create({ data: { ...input, advice: input.advice ?? undefined } })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.CREATE, resource: 'medical-record-template', resourceId: created.id } })
      return created
    })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.put('/medical-record-templates/:id', async (req, res, next) => {
  try {
    const input = clinicalTemplateSchema.partial().parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.medicalRecordTemplate.update({ where: { id: req.params.id }, data: { ...input, advice: input.advice ?? undefined } })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.UPDATE, resource: 'medical-record-template', resourceId: updated.id } })
      return updated
    })
    res.json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/common-diagnoses', async (_req, res, next) => {
  try {
    const items = await prisma.commonDiagnosis.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 300 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/common-diagnoses', async (req, res, next) => {
  try {
    const input = commonDiagnosisSchema.parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.commonDiagnosis.create({ data: { ...input, code: input.code ?? undefined, note: input.note ?? undefined } })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.CREATE, resource: 'common-diagnosis', resourceId: created.id } })
      return created
    })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.put('/common-diagnoses/:id', async (req, res, next) => {
  try {
    const input = commonDiagnosisSchema.partial().parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.commonDiagnosis.update({ where: { id: req.params.id }, data: { ...input, code: input.code ?? undefined, note: input.note ?? undefined } })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.UPDATE, resource: 'common-diagnosis', resourceId: updated.id } })
      return updated
    })
    res.json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/common-orders', async (_req, res, next) => {
  try {
    const items = await prisma.commonMedicalOrder.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 300 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/common-orders', async (req, res, next) => {
  try {
    const input = commonOrderSchema.parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.commonMedicalOrder.create({ data: input })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.CREATE, resource: 'common-order', resourceId: created.id } })
      return created
    })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.put('/common-orders/:id', async (req, res, next) => {
  try {
    const input = commonOrderSchema.partial().parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.commonMedicalOrder.update({ where: { id: req.params.id }, data: input })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.UPDATE, resource: 'common-order', resourceId: updated.id } })
      return updated
    })
    res.json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/prescription-templates', async (_req, res, next) => {
  try {
    const items = await prisma.prescriptionTemplate.findMany({
      include: { items: { include: { drug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/prescription-templates', async (req, res, next) => {
  try {
    const input = prescriptionTemplateSchema.parse(req.body)
    validatePrescriptionDraft(input.items)
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.prescriptionTemplate.create({
        data: { name: input.name, note: input.note ?? undefined, isActive: input.isActive ?? true, items: { create: input.items } },
        include: { items: { include: { drug: true } } },
      })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.CREATE, resource: 'prescription-template', resourceId: created.id } })
      return created
    })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.put('/prescription-templates/:id', async (req, res, next) => {
  try {
    const input = prescriptionTemplateSchema.partial().parse(req.body)
    if (input.items) {
      validatePrescriptionDraft(input.items)
    }
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.prescriptionTemplate.update({
        where: { id: req.params.id },
        data: {
          name: input.name,
          note: input.note ?? undefined,
          isActive: input.isActive,
          ...(input.items ? { items: { deleteMany: {}, create: input.items } } : {}),
        },
        include: { items: { include: { drug: true } } },
      })
      await tx.auditLog.create({ data: { userId: req.user?.id, action: AuditAction.UPDATE, resource: 'prescription-template', resourceId: updated.id } })
      return updated
    })
    res.json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/schedule-templates', async (req, res, next) => {
  try {
    const templates = await prisma.scheduleTemplate.findMany({
      include: { doctor: { include: { user: true } }, department: true, clinicRoom: true, rules: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    res.json({ items: templates })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/schedule-templates', async (req, res, next) => {
  try {
    const input = scheduleTemplateSchema.parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const template = await tx.scheduleTemplate.create({
        data: {
          name: input.name,
          doctorId: input.doctorId,
          departmentId: input.departmentId,
          clinicRoomId: input.clinicRoomId || null,
          period: input.period,
          capacity: input.capacity,
          isActive: input.isActive ?? true,
          rules: { create: input.rules },
        },
        include: { doctor: { include: { user: true } }, department: true, clinicRoom: true, rules: true },
      })

      await tx.auditLog.create({
        data: { userId: req.user?.id, action: AuditAction.CREATE, resource: 'schedule-template', resourceId: template.id, detail: 'Created schedule template' },
      })

      return template
    })

    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.put('/schedule-templates/:id', async (req, res, next) => {
  try {
    const input = scheduleTemplateSchema.partial().parse(req.body)
    const item = await prisma.$transaction(async (tx) => {
      const template = await tx.scheduleTemplate.update({
        where: { id: req.params.id },
        data: {
          name: input.name,
          doctorId: input.doctorId,
          departmentId: input.departmentId,
          clinicRoomId: input.clinicRoomId,
          period: input.period,
          capacity: input.capacity,
          isActive: input.isActive,
          ...(input.rules
            ? {
                rules: {
                  deleteMany: {},
                  create: input.rules,
                },
              }
            : {}),
        },
        include: { doctor: { include: { user: true } }, department: true, clinicRoom: true, rules: true },
      })

      await tx.auditLog.create({
        data: { userId: req.user?.id, action: AuditAction.UPDATE, resource: 'schedule-template', resourceId: req.params.id, detail: 'Updated schedule template' },
      })

      return template
    })

    res.json({ item })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/schedule-templates/:id/generate', async (req, res, next) => {
  try {
    const input = z.object({ startDate: z.coerce.date(), endDate: z.coerce.date() }).parse(req.body)
    const items = await generateSchedulesFromTemplate(req.params.id, input.startDate, input.endDate, req.user?.id)
    res.json({ items })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

adminRouter.post('/schedules/:id/suspend', async (req, res, next) => {
  try {
    const input = z.object({ reason: z.string().min(1) }).parse(req.body)
    const item = await suspendSchedule(req.params.id, input.reason, req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

adminRouter.post('/registrations/:id/no-show', async (req, res, next) => {
  try {
    const input = z.object({ reason: z.string().min(1) }).parse(req.body)
    const item = await markNoShow(req.params.id, input.reason, req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

adminRouter.get('/slot-stats', async (_req, res, next) => {
  try {
    const grouped = await prisma.appointmentSlot.groupBy({
      by: ['status'],
      _count: { _all: true },
    })

    res.json({ items: grouped.map((item) => ({ status: item.status, count: item._count._all })) })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [departmentCount, doctorCount, registrationCount, pendingPaymentCount, prescriptionCount, patientCount] = await Promise.all([
      prisma.department.count(),
      prisma.doctorProfile.count(),
      prisma.registration.count(),
      prisma.paymentOrder.count({ where: { status: 'PENDING' } }),
      prisma.prescription.count(),
      prisma.patientProfile.count(),
    ])

    res.json({
      summary: {
        departmentCount,
        doctorCount,
        registrationCount,
        pendingPaymentCount,
        prescriptionCount,
        patientCount,
      },
    })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/audit-logs', async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, username: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    res.json({ items: logs })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/patients', async (_req, res, next) => {
  try {
    const patients = await prisma.patientProfile.findMany({
      include: { user: true, visitMembers: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    res.json({ items: patients })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/visit-members', async (_req, res, next) => {
  try {
    const members = await prisma.visitMember.findMany({
      include: { patient: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    res.json({ items: members })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/registrations', async (_req, res, next) => {
  try {
    const status = typeof _req.query.status === 'string' && _req.query.status ? _req.query.status : undefined
    if (status && !Object.values(RegistrationStatus).includes(status as RegistrationStatus)) {
      res.status(400).json({ message: 'Invalid registration status' })
      return
    }

    const registrations = await prisma.registration.findMany({
      where: status ? { status: status as RegistrationStatus } : undefined,
      include: {
        department: true,
        doctor: { include: { user: true } },
        visitMember: true,
        slot: true,
        paymentOrder: true,
        changeLogs: {
          where: { action: 'RESCHEDULE' },
          orderBy: { createdAt: 'desc' },
          include: { fromSlot: true, toSlot: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ items: registrations })
  } catch (error) {
    next(error)
  }
})

adminRouter.post('/registrations/:id/check-in', async (req, res, next) => {
  try {
    const registration = await prisma.registration.findUnique({ where: { id: req.params.id } })

    if (!registration) {
      res.status(404).json({ message: '挂号记录不存在' })
      return
    }

    assertCanCheckInRegistration(registration.status)

    const item = await prisma.registration.update({
      where: { id: req.params.id },
      data: { status: RegistrationStatus.CHECKED_IN, checkedInAt: new Date() },
      include: {
        department: true,
        doctor: { include: { user: true } },
        visitMember: true,
        slot: true,
        paymentOrder: true,
      },
    })

    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

adminRouter.get('/encounters', async (_req, res, next) => {
  try {
    const encounters = await prisma.encounter.findMany({
      include: {
        registration: { include: { visitMember: true, department: true } },
        doctor: { include: { user: true } },
        medicalRecord: true,
        diagnoses: true,
        medicalOrders: true,
        prescriptions: { include: { items: { include: { drug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    res.json({ items: encounters })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/schedules', async (_req, res, next) => {
  try {
    const schedules = await prisma.doctorSchedule.findMany({
      include: { doctor: { include: { user: true } }, department: true, clinicRoom: true, slots: true },
      orderBy: [{ workDate: 'asc' }, { period: 'asc' }],
      take: 300,
    })

    res.json({ items: schedules })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/slots', async (_req, res, next) => {
  try {
    const slots = await prisma.appointmentSlot.findMany({
      include: { schedule: { include: { doctor: { include: { user: true } }, department: true, clinicRoom: true } }, registration: true },
      orderBy: { startTime: 'asc' },
      take: 500,
    })

    res.json({ items: slots })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/payment-orders', async (_req, res, next) => {
  try {
    const items = await prisma.paymentOrder.findMany({
      include: { user: true, registration: true, items: true, transactions: true, refundOrders: { include: { transactions: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/prescriptions', async (_req, res, next) => {
  try {
    const items = await prisma.prescription.findMany({
      include: { doctor: { include: { user: true } }, encounter: true, items: { include: { drug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/stock-batches', async (_req, res, next) => {
  try {
    const items = await prisma.drugStockBatch.findMany({
      include: { drug: true },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/stock-movements', async (_req, res, next) => {
  try {
    const items = await prisma.drugStockMovement.findMany({
      include: {
        drug: true,
        batch: true,
        prescription: true,
        operator: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/stock-alerts', async (_req, res, next) => {
  try {
    const items = await listStockAlerts()
    res.json({ items })
  } catch (error) {
    next(error)
  }
})
