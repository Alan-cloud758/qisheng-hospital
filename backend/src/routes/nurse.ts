import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import { admitPatient, approveDischarge, assignBed, completeDischarge, settleDischarge, transferBed } from '../services/inpatient'

export const nurseRouter = Router()

nurseRouter.use(auth, requireRole('NURSE', 'INPATIENT_ADMIN', 'ADMIN'))

const admissionSchema = z.object({
  userId: z.string().min(1),
  visitMemberId: z.string().min(1),
  attendingDoctorId: z.string().optional().transform((value) => value || undefined),
  wardId: z.string().optional().transform((value) => value || undefined),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  depositAmount: z.coerce.number().nonnegative().optional(),
})

const bedActionSchema = z.object({
  bedId: z.string().min(1),
  reason: z.string().optional(),
})

const approveDischargeSchema = z.object({
  approvalNote: z.string().optional(),
})

function routeId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? '')
}

nurseRouter.get('/admissions', async (_req, res, next) => {
  try {
    const items = await prisma.inpatientAdmission.findMany({
      include: {
        user: true,
        visitMember: true,
        attendingDoctor: { include: { user: true, department: true } },
        ward: true,
        currentBed: { include: { ward: true } },
        bedAssignments: { include: { bed: { include: { ward: true } } }, orderBy: { assignedAt: 'desc' } },
        orders: { include: { doctor: { include: { user: true } }, charges: true }, orderBy: { createdAt: 'desc' } },
        charges: { include: { paymentOrder: true }, orderBy: { createdAt: 'desc' } },
        dischargeRequests: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

nurseRouter.get('/beds', async (_req, res, next) => {
  try {
    const items = await prisma.bed.findMany({
      where: { isActive: true },
      include: { ward: { include: { campus: true } } },
      orderBy: [{ wardId: 'asc' }, { bedNo: 'asc' }],
      take: 500,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

nurseRouter.post('/admissions', async (req, res, next) => {
  try {
    const input = admissionSchema.parse(req.body)
    const item = await admitPatient(input)
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

nurseRouter.post('/admissions/:id/assign-bed', async (req, res, next) => {
  try {
    const input = bedActionSchema.parse(req.body)
    const item = await assignBed(routeId(req.params.id), input.bedId, input.reason)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

nurseRouter.post('/admissions/:id/transfer-bed', async (req, res, next) => {
  try {
    const input = bedActionSchema.parse(req.body)
    const item = await transferBed(routeId(req.params.id), input.bedId, input.reason)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

nurseRouter.post('/discharges/:id/approve', async (req, res, next) => {
  try {
    const input = approveDischargeSchema.parse(req.body ?? {})
    const item = await approveDischarge(routeId(req.params.id), { approvedByUserId: req.user?.id, approvalNote: input.approvalNote })
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

nurseRouter.post('/discharges/:id/settle', async (req, res, next) => {
  try {
    const item = await settleDischarge(routeId(req.params.id))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

nurseRouter.post('/discharges/:id/complete', async (req, res, next) => {
  try {
    const item = await completeDischarge(routeId(req.params.id))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})
