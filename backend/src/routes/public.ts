import { Router } from 'express'
import { AppointmentSlotStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'

export const publicRouter = Router()

publicRouter.get('/departments', async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        summary: true,
        campus: { select: { id: true, name: true } },
      },
    })

    res.json({ items: departments })
  } catch (error) {
    next(error)
  }
})

publicRouter.get('/departments/:id/doctors', async (req, res, next) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { departmentId: req.params.id, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, displayName: true } },
        department: { select: { id: true, name: true } },
      },
    })

    res.json({
      items: doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.user.displayName,
        title: doctor.title,
        specialty: doctor.specialty,
        introduction: doctor.introduction,
        consultationFee: Number(doctor.consultationFee),
        department: doctor.department,
      })),
    })
  } catch (error) {
    next(error)
  }
})

publicRouter.get('/doctors/:id/slots', async (req, res, next) => {
  try {
    const slots = await prisma.appointmentSlot.findMany({
      where: {
        status: AppointmentSlotStatus.AVAILABLE,
        schedule: { doctorId: req.params.id },
      },
      orderBy: { startTime: 'asc' },
      include: {
        schedule: {
          include: {
            department: { select: { id: true, name: true } },
            clinicRoom: { select: { id: true, name: true, floor: true } },
          },
        },
      },
    })

    res.json({
      items: slots.map((slot) => ({
        id: slot.id,
        date: slot.startTime.toISOString().slice(0, 10),
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        fee: Number(slot.fee),
        department: slot.schedule.department,
        clinicRoom: slot.schedule.clinicRoom,
      })),
    })
  } catch (error) {
    next(error)
  }
})

publicRouter.get('/announcements', async (_req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    })

    res.json({ items: announcements })
  } catch (error) {
    next(error)
  }
})
