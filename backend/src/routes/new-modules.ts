import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import { parsePagination } from '../services/pagination'

// ═══════════════════════════════════════════════
// 体检管理路由
// ═══════════════════════════════════════════════
export const examRouter = Router()
examRouter.use(auth, requireRole('ADMIN', 'NURSE'))

examRouter.get('/packages', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.examPackage.findMany({ where: { isActive: true }, include: { items: { orderBy: { sortOrder: 'asc' } } }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.examPackage.count({ where: { isActive: true } }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

examRouter.get('/orders', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const where = { ...(status ? { status: status as never } : {}) }
    const [items, total] = await Promise.all([
      prisma.examOrder.findMany({ where, include: { package: true, user: { select: { id: true, displayName: true } }, items: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.examOrder.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const examResultSchema = z.object({
  resultValue: z.string().min(1),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
  abnormalFlag: z.string().optional(),
})

examRouter.put('/order-items/:id/result', async (req, res, next) => {
  try {
    const input = examResultSchema.parse(req.body)
    const item = await prisma.examOrderItem.update({
      where: { id: req.params.id },
      data: { ...input, status: 'COMPLETED', performedAt: new Date(), performedBy: req.user?.displayName },
    })
    res.json({ item })
  } catch (error) { next(error) }
})

examRouter.post('/orders/:id/complete', async (req, res, next) => {
  try {
    const order = await prisma.examOrder.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
    res.json({ item: order })
  } catch (error) { next(error) }
})

examRouter.post('/orders/:id/report', async (req, res, next) => {
  try {
    const { summary } = z.object({ summary: z.string().min(1) }).parse(req.body)
    const order = await prisma.examOrder.update({
      where: { id: req.params.id },
      data: { status: 'REPORTED', reportSummary: summary },
    })
    res.json({ item: order })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 手术管理路由
// ═══════════════════════════════════════════════
export const surgeryRouter = Router()
surgeryRouter.use(auth, requireRole('ADMIN', 'DOCTOR'))

surgeryRouter.get('/requests', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.surgeryRequest.findMany({
        include: { surgeon: { include: { user: true, department: true } }, schedules: { include: { room: true } } },
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      prisma.surgeryRequest.count(),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const surgeryRequestSchema = z.object({
  patientUserId: z.string().min(1),
  surgeonId: z.string().min(1),
  anesthesiaType: z.string().min(1),
  procedureName: z.string().min(1),
  urgency: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  diagnosis: z.string().optional(),
  plannedDuration: z.number().optional(),
  notes: z.string().optional(),
  admissionId: z.string().optional(),
  registrationId: z.string().optional(),
})

surgeryRouter.post('/requests', async (req, res, next) => {
  try {
    const input = surgeryRequestSchema.parse(req.body)
    const requestNo = `SR${Date.now()}`
    const item = await prisma.surgeryRequest.create({
      data: { requestNo, ...input },
      include: { surgeon: { include: { user: true } } },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

surgeryRouter.get('/rooms', async (_req, res, next) => {
  try {
    const items = await prisma.operatingRoom.findMany({ where: { isActive: true }, include: { campus: true }, orderBy: { code: 'asc' } })
    res.json({ items })
  } catch (error) { next(error) }
})

const scheduleSchema = z.object({
  requestId: z.string().min(1),
  roomId: z.string().min(1),
  scheduledStart: z.string().min(1),
  scheduledEnd: z.string().min(1),
})

surgeryRouter.post('/schedules', async (req, res, next) => {
  try {
    const input = scheduleSchema.parse(req.body)
    const item = await prisma.surgerySchedule.create({
      data: {
        requestId: input.requestId,
        roomId: input.roomId,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: new Date(input.scheduledEnd),
      },
      include: { room: true, request: true },
    })
    await prisma.surgeryRequest.update({ where: { id: input.requestId }, data: { status: 'SCHEDULED' } })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

surgeryRouter.post('/schedules/:id/start', async (req, res, next) => {
  try {
    const item = await prisma.surgerySchedule.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', actualStart: new Date() },
    })
    await prisma.surgeryRequest.update({ where: { id: item.requestId }, data: { status: 'IN_PROGRESS' } })
    await prisma.operatingRoom.update({ where: { id: item.roomId }, data: { status: 'IN_USE' } })
    res.json({ item })
  } catch (error) { next(error) }
})

surgeryRouter.post('/schedules/:id/complete', async (req, res, next) => {
  try {
    const item = await prisma.surgerySchedule.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', actualEnd: new Date() },
    })
    await prisma.surgeryRequest.update({ where: { id: item.requestId }, data: { status: 'COMPLETED' } })
    await prisma.operatingRoom.update({ where: { id: item.roomId }, data: { status: 'CLEANING' } })
    res.json({ item })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 护理管理路由
// ═══════════════════════════════════════════════
export const nursingRouter = Router()
nursingRouter.use(auth, requireRole('NURSE', 'INPATIENT_ADMIN', 'ADMIN'))

nursingRouter.get('/vital-signs/:admissionId', async (req, res, next) => {
  try {
    const items = await prisma.vitalSignRecord.findMany({
      where: { admissionId: req.params.admissionId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const vitalSignSchema = z.object({
  temperature: z.number().optional(),
  pulse: z.number().int().optional(),
  respiration: z.number().int().optional(),
  systolicBp: z.number().int().optional(),
  diastolicBp: z.number().int().optional(),
  oxygenSaturation: z.number().optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional(),
})

nursingRouter.post('/vital-signs/:admissionId', async (req, res, next) => {
  try {
    const input = vitalSignSchema.parse(req.body)
    const item = await prisma.vitalSignRecord.create({
      data: { admissionId: req.params.admissionId, ...input, recordedBy: req.user?.displayName },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

nursingRouter.get('/assessments/:admissionId', async (req, res, next) => {
  try {
    const items = await prisma.nursingAssessment.findMany({
      where: { admissionId: req.params.admissionId },
      orderBy: { assessedAt: 'desc' },
      take: 50,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const assessmentSchema = z.object({
  assessmentType: z.string().min(1),
  score: z.number().int().optional(),
  level: z.string().optional(),
  findings: z.string().optional(),
  measures: z.string().optional(),
})

nursingRouter.post('/assessments/:admissionId', async (req, res, next) => {
  try {
    const input = assessmentSchema.parse(req.body)
    const item = await prisma.nursingAssessment.create({
      data: { admissionId: req.params.admissionId, ...input, assessedBy: req.user?.displayName },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

nursingRouter.get('/executions/:admissionId', async (req, res, next) => {
  try {
    const items = await prisma.nursingExecution.findMany({
      where: { admissionId: req.params.admissionId },
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

nursingRouter.post('/executions/:id/execute', async (req, res, next) => {
  try {
    const item = await prisma.nursingExecution.update({
      where: { id: req.params.id },
      data: { status: 'EXECUTED', executedAt: new Date(), executedBy: req.user?.displayName },
    })
    res.json({ item })
  } catch (error) { next(error) }
})

nursingRouter.get('/shift-reports', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.shiftReport.findMany({ include: { ward: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.shiftReport.count(),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const shiftReportSchema = z.object({
  wardId: z.string().min(1),
  shiftType: z.enum(['DAY', 'NIGHT']),
  content: z.string().min(1),
  patientCount: z.number().int().optional(),
  abnormalNotes: z.string().optional(),
  handoverTo: z.string().optional(),
})

nursingRouter.post('/shift-reports', async (req, res, next) => {
  try {
    const input = shiftReportSchema.parse(req.body)
    const item = await prisma.shiftReport.create({
      data: { ...input, reportDate: new Date(), createdBy: req.user?.displayName },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 物资耗材路由
// ═══════════════════════════════════════════════
export const consumableRouter = Router()
consumableRouter.use(auth, requireRole('ADMIN', 'PHARMACY'))

consumableRouter.get('/catalog', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.consumableCatalog.findMany({ where: { isActive: true }, skip, take, orderBy: { code: 'asc' } }),
      prisma.consumableCatalog.count({ where: { isActive: true } }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

consumableRouter.get('/batches', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.consumableBatch.findMany({ where: { isActive: true }, include: { catalog: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.consumableBatch.count({ where: { isActive: true } }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

consumableRouter.get('/movements', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.consumableMovement.findMany({ include: { catalog: true, batch: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.consumableMovement.count(),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 运营分析报表路由
// ═══════════════════════════════════════════════
export const analyticsRouter = Router()
analyticsRouter.use(auth, requireRole('ADMIN'))

analyticsRouter.get('/revenue', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined
    const paidOrders = await prisma.paymentOrder.findMany({
      where: { status: 'PAID', ...(startDate ? { paidAt: { gte: new Date(startDate) } } : {}), ...(endDate ? { paidAt: { lte: new Date(endDate + 'T23:59:59') } } : {}) },
      include: { items: true },
    })
    const total = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0)
    const byDate: Record<string, number> = {}
    for (const order of paidOrders) {
      const date = order.paidAt?.toISOString().slice(0, 10) ?? 'unknown'
      byDate[date] = (byDate[date] ?? 0) + Number(order.amount)
    }
    const trend = Object.entries(byDate).map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date))
    res.json({ total, trend, orderCount: paidOrders.length })
  } catch (error) { next(error) }
})

analyticsRouter.get('/department-workload', async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        registrations: { select: { id: true, status: true } },
      },
    })
    const items = departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      registrationCount: dept.registrations.length,
      completedCount: dept.registrations.filter((r) => r.status === 'COMPLETED').length,
    })).sort((a, b) => b.registrationCount - a.registrationCount)
    res.json({ items })
  } catch (error) { next(error) }
})

analyticsRouter.get('/doctor-workload', async (_req, res, next) => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { displayName: true } },
        department: { select: { name: true } },
        encounters: { where: { status: 'COMPLETED' }, select: { id: true } },
        prescriptions: { where: { status: { in: ['REVIEWED', 'DISPENSED'] } }, select: { id: true } },
      },
    })
    const items = doctors.map((doc) => ({
      doctorId: doc.id,
      doctorName: doc.user.displayName,
      departmentName: doc.department.name,
      encounterCount: doc.encounters.length,
      prescriptionCount: doc.prescriptions.length,
    })).sort((a, b) => b.encounterCount - a.encounterCount).slice(0, 50)
    res.json({ items })
  } catch (error) { next(error) }
})

analyticsRouter.get('/drug-sales', async (_req, res, next) => {
  try {
    const prescriptionItems = await prisma.prescriptionItem.findMany({
      where: { prescription: { status: { in: ['REVIEWED', 'DISPENSED'] } } },
      include: { drug: true },
    })
    const drugMap = new Map<string, { name: string; totalQuantity: number; totalAmount: number }>()
    for (const item of prescriptionItems) {
      const key = item.drugId
      const existing = drugMap.get(key) ?? { name: item.drug.name, totalQuantity: 0, totalAmount: 0 }
      existing.totalQuantity += item.quantity
      existing.totalAmount += item.quantity * Number(item.drug.price)
      drugMap.set(key, existing)
    }
    const items = Array.from(drugMap.entries()).map(([drugId, data]) => ({ drugId, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 30)
    res.json({ items })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 患者端增强路由
// ═══════════════════════════════════════════════
export const patientEnhancedRouter = Router()
patientEnhancedRouter.use(auth)

patientEnhancedRouter.get('/consultations', async (req, res, next) => {
  try {
    const items = await prisma.onlineConsultation.findMany({
      where: { userId: req.user!.id },
      include: { doctor: { include: { user: true, department: true } }, messages: { orderBy: { createdAt: 'asc' }, take: 100 } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const consultationSchema = z.object({
  doctorId: z.string().min(1),
  channel: z.enum(['TEXT', 'VIDEO']).default('TEXT'),
  symptoms: z.string().optional(),
})

patientEnhancedRouter.post('/consultations', async (req, res, next) => {
  try {
    const input = consultationSchema.parse(req.body)
    const item = await prisma.onlineConsultation.create({
      data: { userId: req.user!.id, ...input },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

const messageSchema = z.object({
  content: z.string().min(1),
  messageType: z.string().default('TEXT'),
})

patientEnhancedRouter.post('/consultations/:id/messages', async (req, res, next) => {
  try {
    const input = messageSchema.parse(req.body)
    const consultation = await prisma.onlineConsultation.findUnique({ where: { id: req.params.id } })
    if (!consultation || consultation.userId !== req.user!.id) {
      res.status(404).json({ message: '问诊不存在' })
      return
    }
    const item = await prisma.consultationMessage.create({
      data: { consultationId: req.params.id, senderType: 'PATIENT', senderId: req.user!.id, ...input },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

patientEnhancedRouter.get('/medication-reminders', async (req, res, next) => {
  try {
    const items = await prisma.medicationReminder.findMany({
      where: { userId: req.user!.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const reminderSchema = z.object({
  drugName: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().min(1),
  reminderTime: z.string().min(1),
  prescriptionId: z.string().optional(),
})

patientEnhancedRouter.post('/medication-reminders', async (req, res, next) => {
  try {
    const input = reminderSchema.parse(req.body)
    const item = await prisma.medicationReminder.create({
      data: { userId: req.user!.id, startDate: new Date(), ...input },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})
