import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'

export const staffRouter = Router()

staffRouter.use(auth)

staffRouter.get('/doctor/registrations', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { doctor: { userId: req.user!.id } },
      include: {
        department: true,
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

staffRouter.get('/cashier/payment-orders', requireRole('CASHIER', 'ADMIN'), async (_req, res, next) => {
  try {
    const orders = await prisma.paymentOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ items: orders })
  } catch (error) {
    next(error)
  }
})
