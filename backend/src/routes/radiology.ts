import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import {
  checkInImagingAppointment,
  completeImagingStudy,
  imagingRequestInclude,
  publishImagingReport,
  recordImagingReport,
  reviewImagingReport,
  scheduleImaging,
} from '../services/radiology'

export const radiologyRouter = Router()

radiologyRouter.use(auth, requireRole('RADIOLOGY', 'ADMIN'))

const scheduleSchema = z.object({
  scheduledAt: z.coerce.date(),
  room: z.string().optional(),
})

const reportSchema = z.object({
  findings: z.string().min(1),
  impression: z.string().min(1),
})

radiologyRouter.get('/requests', async (_req, res, next) => {
  try {
    const items = await prisma.imagingRequest.findMany({
      include: imagingRequestInclude(),
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

radiologyRouter.post('/requests/:id/schedule', async (req, res, next) => {
  try {
    const input = scheduleSchema.parse(req.body)
    const item = await scheduleImaging(req.params.id, input)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

radiologyRouter.post('/appointments/:id/check-in', async (req, res, next) => {
  try {
    const item = await checkInImagingAppointment(req.params.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

radiologyRouter.post('/appointments/:id/complete', async (req, res, next) => {
  try {
    const item = await completeImagingStudy(req.params.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

radiologyRouter.post('/reports/:id/record', async (req, res, next) => {
  try {
    const input = reportSchema.parse(req.body)
    const item = await recordImagingReport(req.params.id, input)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

radiologyRouter.post('/reports/:id/review', async (req, res, next) => {
  try {
    const item = await reviewImagingReport(req.params.id, req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

radiologyRouter.post('/reports/:id/publish', async (req, res, next) => {
  try {
    const item = await publishImagingReport(req.params.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})
