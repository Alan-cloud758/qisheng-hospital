import { Router } from 'express'
import { RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import { assertCanCheckInRegistration } from '../services/outpatient-state'

export const adminRouter = Router()

adminRouter.use(auth, requireRole('ADMIN'))

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

adminRouter.get('/accounts', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { roles: { include: { role: true } }, doctorProfile: true, patientProfile: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    res.json({ items: users })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/roles', async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ items: roles })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/menus', async (_req, res, next) => {
  try {
    const menus = await prisma.menu.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
    res.json({ items: menus })
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

adminRouter.get('/campuses', async (_req, res, next) => {
  try {
    const campuses = await prisma.hospitalCampus.findMany({
      include: { departments: true, clinicRooms: true },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ items: campuses })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/departments', async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: { campus: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    res.json({ items: departments })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/doctors', async (_req, res, next) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: { user: true, department: true },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ items: doctors })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/clinic-rooms', async (_req, res, next) => {
  try {
    const rooms = await prisma.clinicRoom.findMany({
      include: { campus: true, department: true },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ items: rooms })
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
    const registrations = await prisma.registration.findMany({
      include: {
        department: true,
        doctor: { include: { user: true } },
        visitMember: true,
        slot: true,
        paymentOrder: true,
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

adminRouter.get('/fee-items', async (_req, res, next) => {
  try {
    const items = await prisma.feeItem.findMany({ orderBy: { code: 'asc' } })
    res.json({ items })
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

adminRouter.get('/drugs', async (_req, res, next) => {
  try {
    const items = await prisma.drugCatalog.findMany({ orderBy: { code: 'asc' } })
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

adminRouter.get('/announcements', async (_req, res, next) => {
  try {
    const items = await prisma.announcement.findMany({ orderBy: { publishedAt: 'desc' } })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

adminRouter.get('/dictionaries', async (_req, res, next) => {
  try {
    const items = await prisma.dictionaryCategory.findMany({
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})
