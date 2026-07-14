import { Router } from 'express'
import { z } from 'zod'
import { AppointmentSlotStatus, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth } from '../middleware/auth'
import { bookAppointment } from '../services/appointments'
import { assertCanCancelRegistration } from '../services/outpatient-state'
import { lockSlot, rescheduleRegistration } from '../services/scheduling'
import { mockPayOrder } from '../services/payment'
import { createAppointmentNotification, favoriteDoctor, unfavoriteDoctor } from '../services/queue'

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

function estimateWait(position: number, avg = 8) {
  return Math.max(position, 0) * avg
}

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
        queueTicket: true,
      },
    })

    const items = await Promise.all(
      registrations.map(async (registration) => {
        if (!registration.queueTicket) {
          return registration
        }
        const ahead = await prisma.queueTicket.count({
          where: { doctorId: registration.queueTicket.doctorId, status: 'WAITING', queueNo: { lt: registration.queueTicket.queueNo } },
        })
        const state = await prisma.doctorQueueState.findUnique({ where: { doctorId: registration.queueTicket.doctorId } })
        const currentTicket = state?.currentTicketId ? await prisma.queueTicket.findUnique({ where: { id: state.currentTicketId } }) : null
        return {
          ...registration,
          queueTicket: {
            ...registration.queueTicket,
            ahead,
            waitMinutes: estimateWait(ahead, state?.avgMinutes ?? 8),
            currentQueueNo: currentTicket?.queueNo,
          },
        }
      }),
    )

    res.json({ items })
  } catch (error) {
    next(error)
  }
})

miniRouter.get('/notifications', async (req, res, next) => {
  try {
    const items = await prisma.patientNotification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

miniRouter.post('/notifications/:id/read', async (req, res, next) => {
  try {
    const claimed = await prisma.patientNotification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { readAt: new Date() },
    })
    if (claimed.count !== 1) {
      res.status(404).json({ message: '通知不存在' })
      return
    }
    const item = await prisma.patientNotification.findUnique({ where: { id: req.params.id } })
    res.json({ item })
  } catch (error) {
    next(error)
  }
})

miniRouter.get('/queue', async (req, res, next) => {
  try {
    const tickets = await prisma.queueTicket.findMany({
      where: { registration: { userId: req.user!.id } },
      include: { registration: { include: { visitMember: true, slot: true } }, doctor: { include: { user: true } }, department: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const enriched = await Promise.all(
      tickets.map(async (ticket) => {
        const ahead = await prisma.queueTicket.count({
          where: { doctorId: ticket.doctorId, status: 'WAITING', queueNo: { lt: ticket.queueNo } },
        })
        const state = await prisma.doctorQueueState.findUnique({ where: { doctorId: ticket.doctorId } })
        const currentTicket = state?.currentTicketId ? await prisma.queueTicket.findUnique({ where: { id: state.currentTicketId } }) : null
        return { ...ticket, ahead, waitMinutes: estimateWait(ahead, state?.avgMinutes ?? 8), currentTicketId: state?.currentTicketId, currentQueueNo: currentTicket?.queueNo }
      }),
    )
    res.json({ items: enriched })
  } catch (error) {
    next(error)
  }
})

miniRouter.post('/doctors/:id/favorite', async (req, res, next) => {
  try {
    const item = await favoriteDoctor(req.user!.id, req.params.id)
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

miniRouter.delete('/doctors/:id/favorite', async (req, res, next) => {
  try {
    const item = await unfavoriteDoctor(req.user!.id, req.params.id)
    res.json({ item })
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

    await createAppointmentNotification(req.user!.id, {
      title: '预约成功',
      content: `预约 ${registration.department?.name ?? '门诊'} 成功，请按时就诊`,
      sourceType: 'registration',
      sourceId: registration.id,
    })

    res.status(201).json({ item: registration })
  } catch (error) {
    if (
      error instanceof Error &&
      ['号源不可预约', '就诊人不存在', '号源已被其他用户锁定', 'Slot lock has expired', 'Slot is locked by another user'].includes(error.message)
    ) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

miniRouter.post('/slots/:id/lock', async (req, res, next) => {
  try {
    const item = await lockSlot(req.params.id, req.user!.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

miniRouter.post('/registrations/:id/reschedule', async (req, res, next) => {
  try {
    const input = z.object({ slotId: z.string().min(1) }).parse(req.body)
    const item = await rescheduleRegistration(req.params.id, input.slotId, req.user!.id)
    await createAppointmentNotification(req.user!.id, {
      title: '改约成功',
      content: `预约 ${item.registrationNo} 已完成改约`,
      sourceType: 'registration',
      sourceId: item.id,
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

miniRouter.post('/visit-records/:id/follow-up', async (req, res, next) => {
  try {
    const record = await prisma.encounter.findFirst({
      where: { id: req.params.id, registration: { userId: req.user!.id } },
      include: { registration: true, doctor: { include: { user: true } } },
    })
    if (!record) {
      res.status(404).json({ message: '就诊记录不存在' })
      return
    }
    const item = await prisma.patientNotification.create({
      data: {
        userId: req.user!.id,
        type: 'FOLLOW_UP',
        title: '复诊提醒',
        content: `请按医嘱关注 ${record.doctor.user.displayName} 医生的复诊安排`,
        sourceType: 'encounter',
        sourceId: record.id,
      },
    })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

miniRouter.post('/payments/:id/mock-pay', async (req, res, next) => {
  try {
    const order = await prisma.paymentOrder.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
    if (!order) {
      res.status(404).json({ message: '支付订单不存在' })
      return
    }

    const payment = await mockPayOrder(req.params.id, 'MINI_MOCK', req.user?.id)

    res.json({ item: payment })
  } catch (error) {
    next(error)
  }
})

miniRouter.get('/fees', async (req, res, next) => {
  try {
    const items = await prisma.paymentOrder.findMany({
      where: { userId: req.user!.id },
      include: { items: true, transactions: true, refundOrders: { include: { transactions: true } }, registration: { include: { department: true, doctor: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ items })
  } catch (error) {
    next(error)
  }
})
