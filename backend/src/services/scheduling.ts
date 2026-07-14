import { AppointmentSlotStatus, AuditAction, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'

const DEFAULT_LOCK_MINUTES = 10

export function assertCanReschedule(status: string) {
  if (status !== RegistrationStatus.BOOKED) {
    throw new Error('Only booked registrations can be rescheduled')
  }
}

export function computeSlotLockExpiry(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60 * 1000)
}

export function assertCanUseLockedSlot(now: Date, lockedUntil?: Date | null) {
  if (!lockedUntil || lockedUntil.getTime() <= now.getTime()) {
    throw new Error('Slot lock has expired')
  }
}

function assertLockOwner(lockedByUserId: string | null | undefined, userId: string) {
  if (lockedByUserId && lockedByUserId !== userId) {
    throw new Error('Slot is locked by another user')
  }
}

function timeOnDate(date: Date, time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function generateSchedulesFromTemplate(templateId: string, startDate: Date, endDate: Date, userId?: string) {
  const created = await prisma.$transaction(async (tx) => {
    const template = await tx.scheduleTemplate.findUnique({
      where: { id: templateId },
      include: { rules: true, doctor: true },
    })

    if (!template || !template.isActive) {
      throw new Error('Schedule template is not available')
    }

    const schedules = []
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      const workDate = new Date(day)
      workDate.setHours(0, 0, 0, 0)
      const weekday = workDate.getDay()
      const rules = template.rules.filter((rule) => rule.weekday === weekday)

      if (rules.length === 0) {
        continue
      }

      const existing = await tx.doctorSchedule.findFirst({
        where: {
          doctorId: template.doctorId,
          workDate,
          period: template.period,
          clinicRoomId: template.clinicRoomId,
        },
      })

      if (existing) {
        continue
      }

      const schedule = await tx.doctorSchedule.create({
        data: {
          doctorId: template.doctorId,
          departmentId: template.departmentId,
          clinicRoomId: template.clinicRoomId,
          workDate,
          period: template.period,
          capacity: template.capacity * rules.length,
          slots: {
            create: rules.flatMap((rule) =>
              Array.from({ length: template.capacity }, () => ({
                startTime: timeOnDate(workDate, rule.startTime),
                endTime: timeOnDate(workDate, rule.endTime),
                fee: template.doctor.consultationFee,
                status: AppointmentSlotStatus.AVAILABLE,
              })),
            ),
          },
          changeLogs: {
            create: {
              action: 'GENERATE',
              reason: `Generated from template ${template.name} for ${dateKey(workDate)}`,
              userId,
            },
          },
        },
        include: { slots: true },
      })
      schedules.push(schedule)
    }

    await tx.auditLog.create({
      data: { userId, action: AuditAction.CREATE, resource: 'schedule-template', resourceId: templateId, detail: 'Generated schedules' },
    })

    return schedules
  })

  return created
}

export async function lockSlot(slotId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const lockedUntil = computeSlotLockExpiry(now, DEFAULT_LOCK_MINUTES)
    const result = await tx.appointmentSlot.updateMany({
      where: {
        id: slotId,
        OR: [
          { status: AppointmentSlotStatus.AVAILABLE },
          { status: AppointmentSlotStatus.LOCKED, lockedByUserId: userId, lockedUntil: { gt: now } },
        ],
      },
      data: { status: AppointmentSlotStatus.LOCKED, lockedUntil, lockedByUserId: userId },
    })

    if (result.count === 0) {
      const slot = await tx.appointmentSlot.findUnique({ where: { id: slotId } })
      if (!slot) {
        throw new Error('Slot not found')
      }
      if (slot.status === AppointmentSlotStatus.LOCKED) {
        assertCanUseLockedSlot(now, slot.lockedUntil)
        assertLockOwner(slot.lockedByUserId, userId)
      }
      throw new Error('Slot is not available')
    }

    const item = await tx.appointmentSlot.findUnique({ where: { id: slotId } })
    if (!item) {
      throw new Error('Slot not found')
    }

    await tx.auditLog.create({
      data: { userId, action: AuditAction.UPDATE, resource: 'appointment-slot', resourceId: slotId, detail: 'Locked appointment slot' },
    })

    return item
  })
}

export async function releaseExpiredSlotLocks(now = new Date()) {
  const result = await prisma.$transaction(async (tx) => {
    const released = await tx.appointmentSlot.updateMany({
      where: {
        status: AppointmentSlotStatus.LOCKED,
        lockedUntil: { lte: now },
      },
      data: {
        status: AppointmentSlotStatus.AVAILABLE,
        lockedUntil: null,
        lockedByUserId: null,
      },
    })

    if (released.count > 0) {
      await tx.auditLog.create({
        data: {
          action: AuditAction.UPDATE,
          resource: 'appointment-slot',
          detail: `Released ${released.count} expired slot locks`,
        },
      })
    }

    return released
  })

  return result
}

export async function rescheduleRegistration(registrationId: string, newSlotId: string, userId: string) {
  const item = await prisma.$transaction(async (tx) => {
    const now = new Date()
    const registration = await tx.registration.findFirst({ where: { id: registrationId, userId }, include: { slot: true, paymentOrder: true } })
    if (!registration) {
      throw new Error('Registration not found')
    }

    assertCanReschedule(registration.status)

    const newSlot = await tx.appointmentSlot.findUnique({
      where: { id: newSlotId },
      include: { schedule: { include: { doctor: true } } },
    })
    if (!newSlot) {
      throw new Error('Slot not found')
    }

    if (newSlot.status === AppointmentSlotStatus.LOCKED) {
      assertCanUseLockedSlot(now, newSlot.lockedUntil)
      assertLockOwner(newSlot.lockedByUserId, userId)
    } else if (newSlot.status !== AppointmentSlotStatus.AVAILABLE) {
      throw new Error('Slot is not available')
    }

    await tx.appointmentSlot.update({
      where: { id: registration.slotId },
      data: { status: AppointmentSlotStatus.AVAILABLE, lockedUntil: null, lockedByUserId: null },
    })
    await tx.appointmentSlot.update({
      where: { id: newSlotId },
      data: { status: AppointmentSlotStatus.BOOKED, lockedUntil: null, lockedByUserId: null },
    })

    if (registration.paymentOrderId) {
      await tx.paymentOrder.update({
        where: { id: registration.paymentOrderId },
        data: { amount: newSlot.fee },
      })
      await tx.paymentOrderItem.updateMany({
        where: { paymentOrderId: registration.paymentOrderId, itemType: 'REGISTRATION' },
        data: { unitPrice: newSlot.fee, amount: newSlot.fee },
      })
    }

    const item = await tx.registration.update({
      where: { id: registration.id },
      data: {
        slotId: newSlotId,
        departmentId: newSlot.schedule.departmentId,
        doctorId: newSlot.schedule.doctorId,
        changeLogs: {
          create: {
            action: 'RESCHEDULE',
            fromSlotId: registration.slotId,
            toSlotId: newSlotId,
            userId,
          },
        },
      },
      include: { department: true, doctor: { include: { user: true } }, slot: true, paymentOrder: true, visitMember: true },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.UPDATE, resource: 'registration', resourceId: registrationId, detail: 'Rescheduled registration' },
    })

    return item
  })

  return item
}

export async function markNoShow(registrationId: string, reason: string, userId?: string) {
  const item = await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({ where: { id: registrationId } })
    if (!registration) {
      throw new Error('Registration not found')
    }

    if (registration.status !== RegistrationStatus.BOOKED) {
      throw new Error('Only booked registrations can be marked no-show')
    }

    const item = await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.NO_SHOW,
        noShowAt: new Date(),
        noShowReason: reason,
        changeLogs: { create: { action: 'NO_SHOW', reason, userId } },
      },
      include: { department: true, doctor: { include: { user: true } }, slot: true, paymentOrder: true, visitMember: true },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.UPDATE, resource: 'registration', resourceId: registrationId, detail: `Marked no-show: ${reason}` },
    })

    return item
  })

  return item
}

export async function suspendSchedule(scheduleId: string, reason: string, userId?: string) {
  const item = await prisma.$transaction(async (tx) => {
    await tx.appointmentSlot.updateMany({
      where: { scheduleId, status: { in: [AppointmentSlotStatus.AVAILABLE, AppointmentSlotStatus.LOCKED, AppointmentSlotStatus.BOOKED] } },
      data: { status: AppointmentSlotStatus.CANCELLED, lockedUntil: null, lockedByUserId: null },
    })

    await tx.registration.updateMany({
      where: { slot: { scheduleId }, status: RegistrationStatus.BOOKED },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    })

    await tx.scheduleChangeLog.create({
      data: { scheduleId, action: 'SUSPEND', reason, userId },
    })

    const item = await tx.doctorSchedule.findUnique({
      where: { id: scheduleId },
      include: { doctor: { include: { user: true } }, department: true, clinicRoom: true, slots: true, changeLogs: true },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.UPDATE, resource: 'doctor-schedule', resourceId: scheduleId, detail: `Suspended schedule: ${reason}` },
    })

    return item
  })

  return item
}
