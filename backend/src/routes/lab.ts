import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import { collectSample, labRequestInclude, publishLabReport, receiveSample, recordLabResults, rejectSample, reviewLabReport } from '../services/lab'

export const labRouter = Router()

labRouter.use(auth, requireRole('LAB', 'ADMIN'))

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  return value
}, z.coerce.number().optional())

const resultSchema = z.object({
  summary: z.string().optional(),
  results: z
    .array(
      z.object({
        itemId: z.string().min(1),
        resultValue: z.string().min(1),
        numericValue: optionalNumber,
        unit: z.string().optional(),
        referenceLow: optionalNumber,
        referenceHigh: optionalNumber,
      }),
    )
    .default([]),
})

export function parseLabResultPayload(payload: unknown) {
  return resultSchema.parse(payload)
}

labRouter.get('/requests', async (_req, res, next) => {
  try {
    const items = await prisma.labRequest.findMany({
      include: labRequestInclude(),
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

labRouter.post('/requests/:id/collect', async (req, res, next) => {
  try {
    const item = await collectSample(req.params.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

labRouter.post('/samples/:id/receive', async (req, res, next) => {
  try {
    const item = await receiveSample(req.params.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

labRouter.post('/samples/:id/reject', async (req, res, next) => {
  try {
    const input = z.object({ reason: z.string().min(1) }).parse(req.body)
    const item = await rejectSample(req.params.id, input.reason)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

labRouter.post('/reports/:id/results', async (req, res, next) => {
  try {
    const input = parseLabResultPayload(req.body)
    const item = await recordLabResults(req.params.id, input)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

labRouter.post('/reports/:id/review', async (req, res, next) => {
  try {
    const item = await reviewLabReport(req.params.id, req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

labRouter.post('/reports/:id/publish', async (req, res, next) => {
  try {
    const item = await publishLabReport(req.params.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})
