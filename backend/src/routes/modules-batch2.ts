import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import { parsePagination } from '../services/pagination'

// ═══════════════════════════════════════════════
// 患者360视图路由
// ═══════════════════════════════════════════════
export const patientViewRouter = Router()
patientViewRouter.use(auth)

patientViewRouter.get('/patient/:id/profile', async (req, res, next) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.params.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, phone: true, email: true, status: true, lastLoginAt: true, createdAt: true } },
        visitMembers: { orderBy: { isDefault: 'desc' } },
      },
    })
    if (!patient) { res.status(404).json({ message: '患者不存在' }); return }
    res.json({ item: patient })
  } catch (error) { next(error) }
})

patientViewRouter.get('/patient/:id/timeline', async (req, res, next) => {
  try {
    const userId = req.params.id
    const [registrations, encounters, prescriptions, labRequests, imagingRequests, admissions] = await Promise.all([
      prisma.registration.findMany({
        where: { userId },
        include: { department: true, doctor: { include: { user: { select: { displayName: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.encounter.findMany({
        where: { registration: { userId } },
        include: { medicalRecord: true, diagnoses: true, registration: { include: { department: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.findMany({
        where: { encounter: { registration: { userId } } },
        include: { items: { include: { drug: true } }, doctor: { include: { user: { select: { displayName: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.labRequest.findMany({
        where: { userId },
        include: { items: { include: { item: true } }, report: { include: { results: { include: { item: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.imagingRequest.findMany({
        where: { userId },
        include: { items: { include: { item: true } }, report: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inpatientAdmission.findMany({
        where: { userId },
        include: { ward: true, currentBed: true, attendingDoctor: { include: { user: { select: { displayName: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const timeline: { date: string; type: string; data: unknown }[] = []
    for (const r of registrations) timeline.push({ date: r.createdAt.toISOString(), type: 'REGISTRATION', data: r })
    for (const e of encounters) timeline.push({ date: e.createdAt.toISOString(), type: 'ENCOUNTER', data: e })
    for (const p of prescriptions) timeline.push({ date: p.createdAt.toISOString(), type: 'PRESCRIPTION', data: p })
    for (const l of labRequests) timeline.push({ date: l.createdAt.toISOString(), type: 'LAB_REQUEST', data: l })
    for (const i of imagingRequests) timeline.push({ date: i.createdAt.toISOString(), type: 'IMAGING_REQUEST', data: i })
    for (const a of admissions) timeline.push({ date: a.createdAt.toISOString(), type: 'ADMISSION', data: a })
    timeline.sort((a, b) => b.date.localeCompare(a.date))

    res.json({ items: timeline })
  } catch (error) { next(error) }
})

patientViewRouter.get('/patient/:id/lab-results', async (req, res, next) => {
  try {
    const userId = req.params.id
    const results = await prisma.labResult.findMany({
      where: { report: { request: { userId } }, numericValue: { not: null } },
      include: { item: { select: { id: true, code: true, name: true, unit: true, referenceLow: true, referenceHigh: true } }, report: { include: { request: { select: { requestedAt: true } } } } },
      orderBy: { report: { request: { requestedAt: 'desc' } } },
    })

    const grouped = new Map<string, { item: { id: string; code: string; name: string; unit: string | null; referenceLow: unknown; referenceHigh: unknown }; values: { date: Date; value: unknown; abnormalFlag: string }[] }>()
    for (const r of results) {
      const key = r.itemId
      if (!grouped.has(key)) grouped.set(key, { item: r.item, values: [] })
      grouped.get(key)!.values.push({ date: r.report.request.requestedAt, value: r.numericValue, abnormalFlag: r.abnormalFlag })
    }
    const items = Array.from(grouped.values()).map((g) => ({ ...g, values: g.values.sort((a, b) => a.date.getTime() - b.date.getTime()) }))
    res.json({ items })
  } catch (error) { next(error) }
})

patientViewRouter.get('/patient/:id/prescriptions', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const where = { encounter: { registration: { userId: req.params.id } } }
    const [items, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: { items: { include: { drug: true } }, doctor: { include: { user: { select: { displayName: true } }, department: true } } },
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

patientViewRouter.get('/patient/:id/admissions', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const where = { userId: req.params.id }
    const [items, total] = await Promise.all([
      prisma.inpatientAdmission.findMany({
        where,
        include: { ward: true, currentBed: true, attendingDoctor: { include: { user: { select: { displayName: true } }, department: true } }, bedAssignments: { include: { bed: { include: { ward: true } } }, orderBy: { assignedAt: 'desc' } } },
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      prisma.inpatientAdmission.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

patientViewRouter.get('/patient/:id/exam-orders', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const where = { userId: req.params.id }
    const [items, total] = await Promise.all([
      prisma.examOrder.findMany({
        where,
        include: { package: true, items: true },
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      prisma.examOrder.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 排班日历路由
// ═══════════════════════════════════════════════
export const scheduleCalendarRouter = Router()

scheduleCalendarRouter.get('/calendar', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined
    const where = {
      ...(startDate ? { workDate: { gte: new Date(startDate) } } : {}),
      ...(endDate ? { workDate: { lte: new Date(endDate) } } : {}),
      ...(departmentId ? { departmentId } : {}),
    }
    const schedules = await prisma.doctorSchedule.findMany({
      where,
      include: { doctor: { include: { user: { select: { displayName: true } }, department: true } }, clinicRoom: true, slots: { orderBy: { startTime: 'asc' } } },
      orderBy: [{ workDate: 'asc' }, { period: 'asc' }],
      take: 500,
    })

    const grouped: Record<string, typeof schedules> = {}
    for (const s of schedules) {
      const dateKey = s.workDate.toISOString().slice(0, 10)
      const groupKey = `${dateKey}_${s.period}`
      if (!grouped[groupKey]) grouped[groupKey] = []
      grouped[groupKey].push(s)
    }
    res.json({ groups: grouped, items: schedules })
  } catch (error) { next(error) }
})

const waitlistSchema = z.object({
  doctorId: z.string().min(1),
  departmentId: z.string().min(1),
  preferredDate: z.string().optional(),
})

scheduleCalendarRouter.post('/waitlist', auth, async (req, res, next) => {
  try {
    const input = waitlistSchema.parse(req.body)
    const item = await prisma.waitlistEntry.create({
      data: { userId: req.user!.id, doctorId: input.doctorId, departmentId: input.departmentId, preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

scheduleCalendarRouter.get('/change-requests', auth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const where = { ...(status ? { status } : {}) }
    const [items, total] = await Promise.all([
      prisma.scheduleChangeRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.scheduleChangeRequest.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 报表分析路由
// ═══════════════════════════════════════════════
export const reportRouter = Router()
reportRouter.use(auth, requireRole('ADMIN'))

reportRouter.get('/daily', async (req, res, next) => {
  try {
    const dateStr = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10)
    const dayStart = new Date(dateStr)
    const dayEnd = new Date(dateStr + 'T23:59:59')

    const [registrations, paidOrders, prescriptions] = await Promise.all([
      prisma.registration.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.paymentOrder.findMany({ where: { status: 'PAID', paidAt: { gte: dayStart, lte: dayEnd } }, select: { amount: true } }),
      prisma.prescription.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
    ])
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0)
    res.json({ date: dateStr, registrations, revenue, prescriptions })
  } catch (error) { next(error) }
})

reportRouter.get('/monthly', async (req, res, next) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : new Date().toISOString().slice(0, 7)
    const monthStart = new Date(month + '-01')
    const nextMonth = new Date(monthStart)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const [registrations, paidOrders, prescriptions, admissions, discharges] = await Promise.all([
      prisma.registration.count({ where: { createdAt: { gte: monthStart, lt: nextMonth } } }),
      prisma.paymentOrder.findMany({ where: { status: 'PAID', paidAt: { gte: monthStart, lt: nextMonth } }, select: { amount: true } }),
      prisma.prescription.count({ where: { createdAt: { gte: monthStart, lt: nextMonth } } }),
      prisma.inpatientAdmission.count({ where: { createdAt: { gte: monthStart, lt: nextMonth } } }),
      prisma.inpatientAdmission.count({ where: { dischargedAt: { gte: monthStart, lt: nextMonth } } }),
    ])
    const revenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0)
    res.json({ month, registrations, revenue, prescriptions, admissions, discharges })
  } catch (error) { next(error) }
})

reportRouter.get('/department-report', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined
    const dateFilter = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
    }
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        registrations: { where: { createdAt: dateFilter }, select: { id: true, status: true } },
        doctors: {
          include: {
            encounters: { where: { createdAt: dateFilter }, select: { id: true } },
            prescriptions: { where: { createdAt: dateFilter }, select: { id: true } },
          },
        },
      },
    })
    const items = departments.map((dept) => ({
      departmentId: dept.id,
      departmentName: dept.name,
      registrationCount: dept.registrations.length,
      completedCount: dept.registrations.filter((r) => r.status === 'COMPLETED').length,
      encounterCount: dept.doctors.reduce((sum, d) => sum + d.encounters.length, 0),
      prescriptionCount: dept.doctors.reduce((sum, d) => sum + d.prescriptions.length, 0),
    })).sort((a, b) => b.registrationCount - a.registrationCount)
    res.json({ items })
  } catch (error) { next(error) }
})

reportRouter.get('/doctor-report', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined
    const dateFilter = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
    }
    const doctors = await prisma.doctorProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { displayName: true } },
        department: { select: { name: true } },
        encounters: { where: { createdAt: dateFilter }, select: { id: true, status: true } },
        prescriptions: { where: { createdAt: dateFilter }, select: { id: true, status: true } },
        registrations: { where: { createdAt: dateFilter }, select: { id: true } },
      },
    })
    const items = doctors.map((doc) => ({
      doctorId: doc.id,
      doctorName: doc.user.displayName,
      departmentName: doc.department.name,
      registrationCount: doc.registrations.length,
      encounterCount: doc.encounters.length,
      completedEncounters: doc.encounters.filter((e) => e.status === 'COMPLETED').length,
      prescriptionCount: doc.prescriptions.length,
    })).sort((a, b) => b.encounterCount - a.encounterCount).slice(0, 50)
    res.json({ items })
  } catch (error) { next(error) }
})

reportRouter.get('/drug-report', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? new Date(req.query.startDate) : undefined
    const endDate = typeof req.query.endDate === 'string' ? new Date(req.query.endDate + 'T23:59:59') : undefined
    const prescriptionItems = await prisma.prescriptionItem.findMany({
      where: {
        prescription: {
          status: { in: ['REVIEWED', 'DISPENSED'] },
          ...(startDate || endDate ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {}),
        },
      },
      include: { drug: true },
    })
    const drugMap = new Map<string, { name: string; spec: string; totalQuantity: number; totalAmount: number }>()
    for (const item of prescriptionItems) {
      const key = item.drugId
      const existing = drugMap.get(key) ?? { name: item.drug.name, spec: item.drug.spec, totalQuantity: 0, totalAmount: 0 }
      existing.totalQuantity += item.quantity
      existing.totalAmount += item.quantity * Number(item.drug.price)
      drugMap.set(key, existing)
    }
    const items = Array.from(drugMap.entries()).map(([drugId, data]) => ({ drugId, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 30)
    res.json({ items })
  } catch (error) { next(error) }
})

reportRouter.get('/revenue-composition', async (req, res, next) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined
    const dateFilter = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
    }
    const orders = await prisma.paymentOrder.findMany({
      where: { status: 'PAID', paidAt: dateFilter },
      include: { items: true },
    })
    const composition: Record<string, number> = { REGISTRATION: 0, LAB: 0, IMAGING: 0, DRUG: 0, INPATIENT: 0, OTHER: 0 }
    for (const order of orders) {
      const category = order.businessType === 'REGISTRATION' ? 'REGISTRATION'
        : order.businessType === 'INPATIENT' ? 'INPATIENT'
        : order.sourceType === 'LAB' ? 'LAB'
        : order.sourceType === 'IMAGING' ? 'IMAGING'
        : order.sourceType === 'PRESCRIPTION' ? 'DRUG'
        : 'OTHER'
      composition[category] += Number(order.amount)
    }
    res.json({ composition, totalOrders: orders.length })
  } catch (error) { next(error) }
})

reportRouter.get('/waiting-time', async (_req, res, next) => {
  try {
    const encounters = await prisma.encounter.findMany({
      where: { status: 'COMPLETED', startedAt: { not: null }, completedAt: { not: null } },
      include: { registration: { include: { department: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    })
    const deptMap = new Map<string, { name: string; totalTime: number; count: number }>()
    for (const enc of encounters) {
      if (!enc.startedAt || !enc.completedAt) continue
      const deptId = enc.registration.departmentId
      const existing = deptMap.get(deptId) ?? { name: enc.registration.department.name, totalTime: 0, count: 0 }
      existing.totalTime += enc.completedAt.getTime() - enc.startedAt.getTime()
      existing.count += 1
      deptMap.set(deptId, existing)
    }
    const items = Array.from(deptMap.entries()).map(([departmentId, data]) => ({
      departmentId,
      departmentName: data.name,
      avgMinutes: data.count > 0 ? Math.round(data.totalTime / data.count / 60000) : 0,
      sampleCount: data.count,
    })).sort((a, b) => b.avgMinutes - a.avgMinutes)
    res.json({ items })
  } catch (error) { next(error) }
})

reportRouter.get('/bed-report', async (_req, res, next) => {
  try {
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      include: { beds: { where: { isActive: true }, select: { id: true, status: true } } },
    })
    const items = wards.map((ward) => {
      const total = ward.beds.length
      const occupied = ward.beds.filter((b) => b.status === 'OCCUPIED').length
      const available = ward.beds.filter((b) => b.status === 'AVAILABLE').length
      const cleaning = ward.beds.filter((b) => b.status === 'CLEANING').length
      const maintenance = ward.beds.filter((b) => b.status === 'MAINTENANCE').length
      return {
        wardId: ward.id,
        wardName: ward.name,
        total,
        occupied,
        available,
        cleaning,
        maintenance,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 10000) / 100 : 0,
      }
    }).sort((a, b) => b.occupancyRate - a.occupancyRate)
    res.json({ items })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 药品深度管理路由
// ═══════════════════════════════════════════════
export const pharmacyDeepRouter = Router()
pharmacyDeepRouter.use(auth, requireRole('ADMIN', 'PHARMACY'))

pharmacyDeepRouter.get('/suppliers', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined
    const where = { isActive: true, ...(keyword ? { OR: [{ name: { contains: keyword } }, { code: { contains: keyword } }] } : {}) }
    const [items, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.supplier.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

pharmacyDeepRouter.get('/purchase-orders', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const where = { ...(status ? { status: status as never } : {}) }
    const [items, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: { include: { drug: true } } },
        skip, take, orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  items: z.array(z.object({ drugId: z.string().min(1), quantity: z.number().int().positive(), unitPrice: z.number().nonnegative() })).min(1),
})

pharmacyDeepRouter.post('/purchase-orders', async (req, res, next) => {
  try {
    const input = purchaseOrderSchema.parse(req.body)
    const orderNo = `PO${Date.now()}`
    const totalAmount = input.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
    const item = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: input.supplierId,
        totalAmount,
        createdBy: req.user?.id,
        items: { create: input.items.map((i) => ({ drugId: i.drugId, quantity: i.quantity, unitPrice: i.unitPrice })) },
      },
      include: { supplier: true, items: { include: { drug: true } } },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

pharmacyDeepRouter.post('/purchase-orders/:id/approve', async (req, res, next) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } })
    if (!order) { res.status(404).json({ message: '采购单不存在' }); return }
    if (order.status !== 'SUBMITTED') { res.status(400).json({ message: '只能审批已提交的采购单' }); return }
    const item = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedBy: req.user?.id, orderedAt: new Date() },
      include: { supplier: true, items: { include: { drug: true } } },
    })
    res.json({ item })
  } catch (error) { next(error) }
})

pharmacyDeepRouter.post('/purchase-orders/:id/receive', async (req, res, next) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } })
    if (!order) { res.status(404).json({ message: '采购单不存在' }); return }
    if (order.status !== 'APPROVED') { res.status(400).json({ message: '只能验收已审批的采购单' }); return }

    const item = await prisma.$transaction(async (tx) => {
      for (const orderItem of order.items) {
        const batchNo = `B${Date.now()}${Math.random().toString(36).slice(2, 6)}`
        await tx.drugStockBatch.create({
          data: {
            drugId: orderItem.drugId,
            batchNo,
            quantity: orderItem.quantity,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            unitCost: orderItem.unitPrice,
          },
        })
        await tx.purchaseOrderItem.update({ where: { id: orderItem.id }, data: { receivedQty: orderItem.quantity } })
      }
      return tx.purchaseOrder.update({
        where: { id: req.params.id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
        include: { supplier: true, items: { include: { drug: true } } },
      })
    })
    res.json({ item })
  } catch (error) { next(error) }
})

pharmacyDeepRouter.get('/stocktaking', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.stocktakingOrder.findMany({ include: { items: { include: { drug: true } } }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.stocktakingOrder.count(),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const stocktakingSchema = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({ drugId: z.string().min(1) })).min(1),
})

pharmacyDeepRouter.post('/stocktaking', async (req, res, next) => {
  try {
    const input = stocktakingSchema.parse(req.body)
    const orderNo = `ST${Date.now()}`

    const stockBatches = await prisma.drugStockBatch.findMany({
      where: { drugId: { in: input.items.map((i) => i.drugId) }, isActive: true, quantity: { gt: 0 } },
    })
    const stockMap = new Map<string, number>()
    for (const batch of stockBatches) {
      stockMap.set(batch.drugId, (stockMap.get(batch.drugId) ?? 0) + batch.quantity)
    }

    const item = await prisma.stocktakingOrder.create({
      data: {
        orderNo,
        notes: input.notes,
        createdBy: req.user?.id,
        items: {
          create: input.items.map((i) => ({
            drugId: i.drugId,
            systemQuantity: stockMap.get(i.drugId) ?? 0,
          })),
        },
      },
      include: { items: { include: { drug: true } } },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

pharmacyDeepRouter.get('/price-changes', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const where = { ...(status ? { status } : {}) }
    const [items, total] = await Promise.all([
      prisma.drugPriceChange.findMany({ where, include: { drug: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.drugPriceChange.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const priceChangeSchema = z.object({
  drugId: z.string().min(1),
  newPrice: z.number().positive(),
  reason: z.string().optional(),
})

pharmacyDeepRouter.post('/price-changes', async (req, res, next) => {
  try {
    const input = priceChangeSchema.parse(req.body)
    const drug = await prisma.drugCatalog.findUnique({ where: { id: input.drugId } })
    if (!drug) { res.status(404).json({ message: '药品不存在' }); return }
    const item = await prisma.drugPriceChange.create({
      data: { drugId: input.drugId, oldPrice: drug.price, newPrice: input.newPrice, reason: input.reason, requestedBy: req.user?.id },
      include: { drug: true },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 住院深度管理路由
// ═══════════════════════════════════════════════
export const inpatientDeepRouter = Router()
inpatientDeepRouter.use(auth, requireRole('DOCTOR', 'NURSE', 'INPATIENT_ADMIN', 'ADMIN'))

inpatientDeepRouter.get('/progress-notes/:admissionId', async (req, res, next) => {
  try {
    const items = await prisma.inpatientProgressNote.findMany({
      where: { admissionId: req.params.admissionId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const progressNoteSchema = z.object({
  noteType: z.enum(['FIRST', 'DAILY', 'SUPERVISORY', 'DISCHARGE']),
  content: z.string().min(1),
  doctorId: z.string().optional(),
})

inpatientDeepRouter.post('/progress-notes/:admissionId', async (req, res, next) => {
  try {
    const input = progressNoteSchema.parse(req.body)
    const item = await prisma.inpatientProgressNote.create({
      data: { admissionId: req.params.admissionId, noteType: input.noteType, content: input.content, doctorId: input.doctorId },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

inpatientDeepRouter.get('/consultations/:admissionId', async (req, res, next) => {
  try {
    const items = await prisma.consultationRequest.findMany({
      where: { admissionId: req.params.admissionId },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const consultationSchema = z.object({
  requestingDeptId: z.string().min(1),
  consultingDeptId: z.string().min(1),
  reason: z.string().min(1),
  requestedBy: z.string().optional(),
})

inpatientDeepRouter.post('/consultations/:admissionId', async (req, res, next) => {
  try {
    const input = consultationSchema.parse(req.body)
    const item = await prisma.consultationRequest.create({
      data: { admissionId: req.params.admissionId, ...input },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

inpatientDeepRouter.post('/consultations/:id/complete', async (req, res, next) => {
  try {
    const { opinion, consultedBy } = z.object({ opinion: z.string().min(1), consultedBy: z.string().optional() }).parse(req.body)
    const item = await prisma.consultationRequest.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', opinion, consultedBy, completedAt: new Date() },
    })
    res.json({ item })
  } catch (error) { next(error) }
})

inpatientDeepRouter.get('/transfers/:admissionId', async (req, res, next) => {
  try {
    const items = await prisma.transferRequest.findMany({
      where: { admissionId: req.params.admissionId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ items })
  } catch (error) { next(error) }
})

const transferSchema = z.object({
  fromWardId: z.string().min(1),
  toWardId: z.string().min(1),
  fromBedId: z.string().optional(),
  toBedId: z.string().optional(),
  reason: z.string().optional(),
  requestedBy: z.string().optional(),
})

inpatientDeepRouter.post('/transfers/:admissionId', async (req, res, next) => {
  try {
    const input = transferSchema.parse(req.body)
    const item = await prisma.transferRequest.create({
      data: { admissionId: req.params.admissionId, ...input },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

inpatientDeepRouter.get('/discharge-summary/:admissionId', async (req, res, next) => {
  try {
    const item = await prisma.dischargeSummary.findUnique({
      where: { admissionId: req.params.admissionId },
    })
    if (!item) { res.status(404).json({ message: '出院小结不存在' }); return }
    res.json({ item })
  } catch (error) { next(error) }
})

const dischargeSummarySchema = z.object({
  diagnosis: z.string().min(1),
  treatmentSummary: z.string().min(1),
  dischargeOrders: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpDept: z.string().optional(),
  doctorId: z.string().optional(),
})

inpatientDeepRouter.post('/discharge-summary/:admissionId', async (req, res, next) => {
  try {
    const input = dischargeSummarySchema.parse(req.body)
    const item = await prisma.dischargeSummary.create({
      data: {
        admissionId: req.params.admissionId,
        diagnosis: input.diagnosis,
        treatmentSummary: input.treatmentSummary,
        dischargeOrders: input.dischargeOrders,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
        followUpDept: input.followUpDept,
        doctorId: input.doctorId,
      },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 系统管理扩展路由
// ═══════════════════════════════════════════════
export const systemConfigRouter = Router()
systemConfigRouter.use(auth, requireRole('ADMIN'))

systemConfigRouter.get('/configs', async (_req, res, next) => {
  try {
    const items = await prisma.systemConfig.findMany({ orderBy: { configKey: 'asc' } })
    res.json({ items })
  } catch (error) { next(error) }
})

systemConfigRouter.put('/configs/:key', async (req, res, next) => {
  try {
    const { configValue, description } = z.object({ configValue: z.string(), description: z.string().optional() }).parse(req.body)
    const item = await prisma.systemConfig.upsert({
      where: { configKey: req.params.key },
      create: { configKey: req.params.key, configValue, description, updatedBy: req.user?.id },
      update: { configValue, description, updatedBy: req.user?.id },
    })
    res.json({ item })
  } catch (error) { next(error) }
})

systemConfigRouter.get('/notification-templates', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const [items, total] = await Promise.all([
      prisma.notificationTemplate.findMany({ skip, take, orderBy: { code: 'asc' } }),
      prisma.notificationTemplate.count(),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

systemConfigRouter.get('/import-logs', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const importType = typeof req.query.importType === 'string' ? req.query.importType : undefined
    const where = { ...(importType ? { importType } : {}) }
    const [items, total] = await Promise.all([
      prisma.dataImportLog.findMany({ where, skip, take, orderBy: { importedAt: 'desc' } }),
      prisma.dataImportLog.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

// ═══════════════════════════════════════════════
// 设备管理路由
// ═══════════════════════════════════════════════
export const equipmentRouter = Router()
equipmentRouter.use(auth, requireRole('ADMIN'))

equipmentRouter.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined
    const where = {
      isActive: true,
      ...(category ? { category } : {}),
      ...(status ? { status: status as never } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(keyword ? { OR: [{ name: { contains: keyword } }, { code: { contains: keyword } }] } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.equipment.findMany({ where, include: { department: true }, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.equipment.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const equipmentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  serialNo: z.string().optional(),
  departmentId: z.string().optional(),
  location: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
})

equipmentRouter.post('/', async (req, res, next) => {
  try {
    const input = equipmentSchema.parse(req.body)
    const item = await prisma.equipment.create({
      data: {
        ...input,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
      },
      include: { department: true },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

equipmentRouter.put('/:id', async (req, res, next) => {
  try {
    const input = equipmentSchema.partial().parse(req.body)
    const item = await prisma.equipment.update({
      where: { id: req.params.id },
      data: {
        ...input,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
      },
      include: { department: true },
    })
    res.json({ item })
  } catch (error) { next(error) }
})

equipmentRouter.get('/:id/maintenance', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const where = { equipmentId: req.params.id }
    const [items, total] = await Promise.all([
      prisma.equipmentMaintenance.findMany({ where, skip, take, orderBy: { performedAt: 'desc' } }),
      prisma.equipmentMaintenance.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

const maintenanceSchema = z.object({
  maintenanceType: z.enum(['SCHEDULED', 'REPAIR', 'CALIBRATION']),
  description: z.string().min(1),
  cost: z.number().nonnegative().optional(),
  performedBy: z.string().optional(),
  performedAt: z.string().optional(),
  nextDueDate: z.string().optional(),
})

equipmentRouter.post('/:id/maintenance', async (req, res, next) => {
  try {
    const input = maintenanceSchema.parse(req.body)
    const item = await prisma.equipmentMaintenance.create({
      data: {
        equipmentId: req.params.id,
        maintenanceType: input.maintenanceType,
        description: input.description,
        cost: input.cost,
        performedBy: input.performedBy,
        performedAt: input.performedAt ? new Date(input.performedAt) : new Date(),
        nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : undefined,
      },
    })
    res.status(201).json({ item })
  } catch (error) { next(error) }
})

equipmentRouter.get('/usage-logs', async (req, res, next) => {
  try {
    const { page, pageSize, skip, take } = parsePagination(req.query)
    const equipmentId = typeof req.query.equipmentId === 'string' ? req.query.equipmentId : undefined
    const where = { ...(equipmentId ? { equipmentId } : {}) }
    const [items, total] = await Promise.all([
      prisma.equipmentUsageLog.findMany({ where, skip, take, orderBy: { startTime: 'desc' } }),
      prisma.equipmentUsageLog.count({ where }),
    ])
    res.json({ items, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})
