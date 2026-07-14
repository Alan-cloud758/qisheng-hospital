import { Router } from 'express'
import { z } from 'zod'
import { AppointmentSlotStatus, PaymentStatus, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth } from '../middleware/auth'
import { bookAppointment } from '../services/appointments'
import { assertCanCancelRegistration } from '../services/outpatient-state'

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

miniRouter.put('/visit-members/:id', async (req, res, next) => {
  try {
    const input = visitMemberSchema.partial().parse(req.body)
    const member = await prisma.visitMember.findFirst({
      where: { id: req.params.id, patient: { userId: req.user!.id } },
    })

    if (!member) {
      res.status(404).json({ message: '就诊人不存在' })
      return
    }

    const item = await prisma.visitMember.update({
      where: { id: member.id },
      data: input,
    })

    res.json({ item })
  } catch (error) {
    next(error)
  }
})

miniRouter.post('/visit-members/:id/default', async (req, res, next) => {
  try {
    const member = await prisma.visitMember.findFirst({
      where: { id: req.params.id, patient: { userId: req.user!.id } },
      include: { patient: true },
    })

    if (!member) {
      res.status(404).json({ message: '就诊人不存在' })
      return
    }

    await prisma.visitMember.updateMany({
      where: { patientId: member.patientId },
      data: { isDefault: false },
    })

    const item = await prisma.visitMember.update({
      where: { id: member.id },
      data: { isDefault: true },
    })

    res.json({ item })
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

miniRouter.post('/registrations/:id/cancel', async (req, res, next) => {
  try {
    const registration = await prisma.registration.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { slot: true },
    })

    if (!registration) {
      res.status(404).json({ message: '预约记录不存在' })
      return
    }

    assertCanCancelRegistration(registration.status)

    const item = await prisma.$transaction(async (tx) => {
      await tx.appointmentSlot.update({
        where: { id: registration.slotId },
        data: { status: AppointmentSlotStatus.AVAILABLE },
      })

      return tx.registration.update({
        where: { id: registration.id },
        data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
        include: {
          department: true,
          doctor: { include: { user: true } },
          slot: true,
          paymentOrder: true,
          visitMember: true,
        },
      })
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

miniRouter.get('/visit-records', async (req, res, next) => {
  try {
    const records = await prisma.encounter.findMany({
      where: { registration: { userId: req.user!.id } },
      include: {
        registration: { include: { department: true, doctor: { include: { user: true } }, visitMember: true, slot: true } },
        medicalRecord: true,
        diagnoses: true,
        medicalOrders: true,
        prescriptions: { include: { items: { include: { drug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ items: records })
  } catch (error) {
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
