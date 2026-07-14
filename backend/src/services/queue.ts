import { PatientNotificationType, QueueTicketStatus, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'

export function nextQueueNumber(tickets: Array<{ queueNo: number }>) {
  return tickets.reduce((max, ticket) => Math.max(max, ticket.queueNo), 0) + 1
}

export function estimateWaitMinutes(position: number, avgMinutes: number) {
  return Math.max(position, 0) * Math.max(avgMinutes, 0)
}

export function assertCanEnterQueue(status: string) {
  if (status !== RegistrationStatus.CHECKED_IN) {
    throw new Error('Only checked-in registrations can enter queue')
  }
}

export function assertTicketBelongsToDoctor(ticket: { doctorId: string }, doctorId: string) {
  if (ticket.doctorId !== doctorId) {
    throw new Error('Queue ticket does not belong to current doctor')
  }
}

export async function createAppointmentNotification(userId: string, input: { title: string; content: string; sourceType?: string; sourceId?: string }) {
  return prisma.patientNotification.create({
    data: {
      userId,
      type: PatientNotificationType.APPOINTMENT,
      title: input.title,
      content: input.content,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  })
}

export async function createCheckInQueueTicket(registrationId: string) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
      include: { department: true, doctor: { include: { user: true } }, visitMember: true },
    })
    if (!registration) {
      throw new Error('Registration not found')
    }
    assertCanEnterQueue(registration.status)

    const existing = await tx.queueTicket.findUnique({ where: { registrationId: registration.id }, include: { doctor: { include: { user: true } }, department: true } })
    if (existing) {
      return existing
    }

    const tickets = await tx.queueTicket.findMany({ where: { doctorId: registration.doctorId }, select: { queueNo: true } })
    const ticket = await tx.queueTicket.create({
      data: {
        registrationId: registration.id,
        doctorId: registration.doctorId,
        departmentId: registration.departmentId,
        queueNo: nextQueueNumber(tickets),
      },
      include: { doctor: { include: { user: true } }, department: true, registration: { include: { visitMember: true } } },
    })

    await tx.doctorQueueState.upsert({
      where: { doctorId: registration.doctorId },
      create: { doctorId: registration.doctorId },
      update: {},
    })

    await tx.patientNotification.create({
      data: {
        userId: registration.userId,
        type: PatientNotificationType.QUEUE,
        title: '已签到入队',
        content: `${registration.visitMember.name} 已进入 ${registration.doctor.user.displayName} 医生队列，排队号 ${ticket.queueNo}`,
        sourceType: 'queue-ticket',
        sourceId: ticket.id,
      },
    })

    return ticket
  })
}

export async function checkInRegistrationWithQueue(registrationId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const registration = await tx.registration.findUnique({
          where: { id: registrationId },
          include: { department: true, doctor: { include: { user: true } }, visitMember: true },
        })
        if (!registration) {
          throw new Error('Registration not found')
        }

        const claimed = await tx.registration.updateMany({
          where: { id: registration.id, status: RegistrationStatus.BOOKED },
          data: { status: RegistrationStatus.CHECKED_IN, checkedInAt: new Date() },
        })
        if (claimed.count !== 1 && registration.status !== RegistrationStatus.CHECKED_IN) {
          throw new Error('Only booked registrations can be checked in')
        }

        const existing = await tx.queueTicket.findUnique({ where: { registrationId: registration.id }, include: { doctor: { include: { user: true } }, department: true } })
        if (existing) {
          return existing
        }

        const tickets = await tx.queueTicket.findMany({ where: { doctorId: registration.doctorId }, select: { queueNo: true } })
        const ticket = await tx.queueTicket.create({
          data: {
            registrationId: registration.id,
            doctorId: registration.doctorId,
            departmentId: registration.departmentId,
            queueNo: nextQueueNumber(tickets),
          },
          include: { doctor: { include: { user: true } }, department: true, registration: { include: { visitMember: true } } },
        })

        await tx.doctorQueueState.upsert({
          where: { doctorId: registration.doctorId },
          create: { doctorId: registration.doctorId },
          update: {},
        })

        await tx.patientNotification.create({
          data: {
            userId: registration.userId,
            type: PatientNotificationType.QUEUE,
            title: '已签到入队',
            content: `${registration.visitMember.name} 已进入 ${registration.doctor.user.displayName} 医生队列，排队号 ${ticket.queueNo}`,
            sourceType: 'queue-ticket',
            sourceId: ticket.id,
          },
        })

        return ticket
      })
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002' && attempt < 2) {
        continue
      }
      throw error
    }
  }
  throw new Error('Unable to create queue ticket')
}

export async function callNextPatient(doctorId: string) {
  return prisma.$transaction(async (tx) => {
    const activeTicket = await tx.queueTicket.findFirst({
      where: { doctorId, status: QueueTicketStatus.CALLED },
      orderBy: { calledAt: 'asc' },
    })
    if (activeTicket) {
      throw new Error('A patient is already being called')
    }

    const ticket = await tx.queueTicket.findFirst({
      where: { doctorId, status: QueueTicketStatus.WAITING },
      orderBy: { queueNo: 'asc' },
      include: { registration: true },
    })
    if (!ticket) {
      throw new Error('No waiting patients in queue')
    }

    const claimed = await tx.queueTicket.updateMany({
      where: { id: ticket.id, status: QueueTicketStatus.WAITING },
      data: { status: QueueTicketStatus.CALLED, calledAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Queue ticket was changed, please retry')
    }

    await tx.doctorQueueState.upsert({
      where: { doctorId },
      create: { doctorId, currentTicketId: ticket.id },
      update: { currentTicketId: ticket.id },
    })

    await tx.patientNotification.create({
      data: {
        userId: ticket.registration.userId,
        type: PatientNotificationType.QUEUE,
        title: '医生叫号',
        content: `请 ${ticket.queueNo} 号到诊室就诊`,
        sourceType: 'queue-ticket',
        sourceId: ticket.id,
      },
    })

    return tx.queueTicket.findUnique({ where: { id: ticket.id }, include: { registration: { include: { visitMember: true } }, doctor: { include: { user: true } }, department: true } })
  })
}

export async function skipQueueTicket(ticketId: string, doctorId?: string) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.queueTicket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      throw new Error('Queue ticket not found')
    }
    if (doctorId) {
      assertTicketBelongsToDoctor(ticket, doctorId)
    }

    const claimed = await tx.queueTicket.updateMany({
      where: { id: ticketId, status: { in: [QueueTicketStatus.WAITING, QueueTicketStatus.CALLED] }, ...(doctorId ? { doctorId } : {}) },
      data: { status: QueueTicketStatus.SKIPPED, skippedAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only waiting or called queue tickets can be skipped')
    }

    await tx.doctorQueueState.updateMany({
      where: { doctorId: ticket.doctorId, currentTicketId: ticket.id },
      data: { currentTicketId: null },
    })

    return tx.queueTicket.findUnique({
      where: { id: ticketId },
      include: { registration: { include: { visitMember: true } }, doctor: { include: { user: true } }, department: true },
    })
  })
}

export async function restoreQueueTicket(ticketId: string, doctorId?: string) {
  const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } })
  if (!ticket) {
    throw new Error('Queue ticket not found')
  }
  if (doctorId) {
    assertTicketBelongsToDoctor(ticket, doctorId)
  }

  const claimed = await prisma.queueTicket.updateMany({
    where: { id: ticketId, status: QueueTicketStatus.SKIPPED, ...(doctorId ? { doctorId } : {}) },
    data: { status: QueueTicketStatus.WAITING, skippedAt: null },
  })
  if (claimed.count !== 1) {
    throw new Error('Only skipped queue tickets can be restored')
  }

  return prisma.queueTicket.findUnique({
    where: { id: ticketId },
    include: { registration: { include: { visitMember: true } }, doctor: { include: { user: true } }, department: true },
  })
}

export async function completeQueueTicket(ticketId: string) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.queueTicket.update({
      where: { id: ticketId },
      data: { status: QueueTicketStatus.COMPLETED, completedAt: new Date() },
    })
    await tx.doctorQueueState.updateMany({
      where: { doctorId: ticket.doctorId, currentTicketId: ticket.id },
      data: { currentTicketId: null },
    })
    return ticket
  })
}

export async function favoriteDoctor(userId: string, doctorId: string) {
  return prisma.favoriteDoctor.upsert({
    where: { userId_doctorId: { userId, doctorId } },
    create: { userId, doctorId },
    update: {},
    include: { doctor: { include: { user: true, department: true } } },
  })
}

export async function unfavoriteDoctor(userId: string, doctorId: string) {
  await prisma.favoriteDoctor.deleteMany({ where: { userId, doctorId } })
  return { userId, doctorId }
}
