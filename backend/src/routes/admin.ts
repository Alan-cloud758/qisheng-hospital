import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'

export const adminRouter = Router()

adminRouter.use(auth, requireRole('ADMIN'))

adminRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const [departmentCount, doctorCount, registrationCount, pendingPaymentCount] = await Promise.all([
      prisma.department.count(),
      prisma.doctorProfile.count(),
      prisma.registration.count(),
      prisma.paymentOrder.count({ where: { status: 'PENDING' } }),
    ])

    res.json({
      summary: {
        departmentCount,
        doctorCount,
        registrationCount,
        pendingPaymentCount,
      },
    })
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
