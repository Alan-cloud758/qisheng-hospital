import { Router } from 'express'
import { z } from 'zod'
import { AuditAction, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import type { AdminDelegate, AdminResourceConfig } from '../services/admin-crud'
import { hashAccountPassword, registerAdminResourceRoutes } from '../services/admin-crud'
import { assertCanCheckInRegistration } from '../services/outpatient-state'
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
    writableFields: ['code', 'name', 'spec', 'unit', 'price', 'isActive'],
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
      include: { user: true, registration: true, items: true },
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
