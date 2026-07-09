import { Router } from 'express'
import { z } from 'zod'
import { PaymentStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth } from '../middleware/auth'
import { bookAppointment } from '../services/appointments'

const visitMemberSchema = z.object({
  name: z.string().min(1),
  gender: z.string().optional(),
  birthday: z.coerce.date().optional(),
  idCardNo: z.string().optional(),
  phone: z.string().optional(),
  relationship: z.string().default('SELF'),
})

const registrationSchema = z.object({
  slotId: z.string().min(1),
  visitMemberId: z.string().min(1),
})

export const miniRouter = Router()

miniRouter.use(auth)

miniRouter.get('/visit-members', async (req, res, next) => {
  try {
    const members = await prisma.visitMember.findMany({
      where: { patient: { userId: req.user!.id } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    res.json({ items: members })
  } catch (error) {
    next(error)
  }
})

miniRouter.post('/visit-members', async (req, res, next) => {
  try {
    const input = visitMemberSchema.parse(req.body)
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.id } })

    if (!patient) {
      res.status(400).json({ message: '患者档案不存在' })
      return
    }

    const member = await prisma.visitMember.create({
      data: {
        patientId: patient.id,
        name: input.name,
        gender: input.gender,
        birthday: input.birthday,
        idCardNo: input.idCardNo,
        phone: input.phone,
        relationship: input.relationship,
      },
    })

    res.status(201).json({ item: member })
  } catch (error) {
    next(error)
  }
})

miniRouter.get('/registrations', async (req, res, next) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        doctor: { include: { user: true } },
        slot: true,
        paymentOrder: true,
        visitMember: true,
      },
    })

    res.json({ items: registrations })
  } catch (error) {
    next(error)
  }
})

miniRouter.post('/registrations', async (req, res, next) => {
  try {
    const input = registrationSchema.parse(req.body)
    const registration = await bookAppointment({
      userId: req.user!.id,
      slotId: input.slotId,
      visitMemberId: input.visitMemberId,
    })

    res.status(201).json({ item: registration })
  } catch (error) {
    if (error instanceof Error && ['号源不可预约', '就诊人不存在'].includes(error.message)) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

miniRouter.post('/payments/:id/mock-pay', async (req, res, next) => {
  try {
    const payment = await prisma.paymentOrder.update({
      where: { id: req.params.id },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    })

    res.json({ item: payment })
  } catch (error) {
    next(error)
  }
})
