import { AppointmentSlotStatus, PaymentStatus, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { assertCanUseLockedSlot } from './scheduling'

export async function bookAppointment(input: { userId: string; visitMemberId: string; slotId: string }) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.appointmentSlot.findUnique({
      where: { id: input.slotId },
      include: {
        schedule: {
          include: {
            doctor: true,
            department: true,
          },
        },
      },
    })

    if (!slot) {
      throw new Error('号源不可预约')
    }

    if (slot.status === AppointmentSlotStatus.LOCKED) {
      assertCanUseLockedSlot(new Date(), slot.lockedUntil)
      if (slot.lockedByUserId !== input.userId) {
        throw new Error('号源已被其他用户锁定')
      }
    } else if (slot.status !== AppointmentSlotStatus.AVAILABLE) {
      throw new Error('号源不可预约')
    }

    const visitMember = await tx.visitMember.findFirst({
      where: { id: input.visitMemberId, patient: { userId: input.userId } },
    })

    if (!visitMember) {
      throw new Error('就诊人不存在')
    }

    await tx.appointmentSlot.update({
      where: { id: slot.id },
      data: { status: AppointmentSlotStatus.BOOKED, lockedUntil: null, lockedByUserId: null },
    })

    const payment = await tx.paymentOrder.create({
      data: {
        orderNo: `PAY${Date.now()}`,
        title: '普通门诊挂号费',
        amount: slot.fee,
        status: PaymentStatus.PENDING,
        userId: input.userId,
      },
    })

    return tx.registration.create({
      data: {
        registrationNo: `REG${Date.now()}`,
        status: RegistrationStatus.BOOKED,
        userId: input.userId,
        visitMemberId: input.visitMemberId,
        departmentId: slot.schedule.departmentId,
        doctorId: slot.schedule.doctorId,
        slotId: slot.id,
        paymentOrderId: payment.id,
      },
      include: {
        department: true,
        doctor: { include: { user: true } },
        slot: true,
        paymentOrder: true,
        visitMember: true,
      },
    })
  })
}
