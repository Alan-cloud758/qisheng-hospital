import { Router } from 'express'
import { AppointmentSlotStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { releaseExpiredSlotLocks } from '../services/scheduling'

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

publicRouter.get('/departments/:id', async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        campus: true,
        doctors: {
          where: { isActive: true },
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!department || !department.isActive) {
      res.status(404).json({ message: '科室不存在' })
      return
    }

    res.json({ item: department })
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

publicRouter.get('/doctors', async (req, res, next) => {
  try {
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined
    const doctors = await prisma.doctorProfile.findMany({
      where: { isActive: true, ...(departmentId ? { departmentId } : {}) },
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

publicRouter.get('/doctors/:id', async (req, res, next) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, displayName: true } },
        department: { include: { campus: true } },
      },
    })

    if (!doctor || !doctor.isActive) {
      res.status(404).json({ message: '医生不存在' })
      return
    }

    res.json({
      item: {
        id: doctor.id,
        name: doctor.user.displayName,
        title: doctor.title,
        specialty: doctor.specialty,
        introduction: doctor.introduction,
        consultationFee: Number(doctor.consultationFee),
        department: doctor.department,
      },
    })
  } catch (error) {
    next(error)
  }
})

publicRouter.get('/doctors/:id/slots', async (req, res, next) => {
  try {
    await releaseExpiredSlotLocks()
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
