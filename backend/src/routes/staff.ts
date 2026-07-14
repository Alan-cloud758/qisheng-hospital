import { Router } from 'express'
import { z } from 'zod'
import { EncounterStatus, PrescriptionStatus, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { auth, requireRole } from '../middleware/auth'
import {
  applyRecordTemplate,
  createPrescriptionFromTemplate,
  rejectPrescription,
  resubmitPrescription,
  reviewPrescription as reviewPrescriptionWithQuality,
  validatePrescriptionDraft,
} from '../services/clinical-quality'
import { callNextPatient, restoreQueueTicket, skipQueueTicket } from '../services/queue'
import {
  assertCanCompleteEncounter,
  assertCanStartEncounter,
} from '../services/outpatient-state'
import { createInpatientOrder, requestDischarge } from '../services/inpatient'
import { preSettleOrder, reverseSettlement, settleOrder } from '../services/insurance'
import { createLabRequestForEncounter, createLabRequestForInpatient } from '../services/lab'
import { cancelPaymentOrder, executeRefund, mockPayOrder, requestRefund } from '../services/payment'
import {
  adjustStock,
  damageStock,
  dispensePrescriptionWithStock,
  listStockAlerts,
  receiveStock,
  returnDispensedPrescription,
} from '../services/pharmacy-inventory'

export const staffRouter = Router()

staffRouter.use(auth)

const recordSchema = z.object({
  summary: z.string().min(1),
  advice: z.string().optional(),
})

const diagnosisSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  note: z.string().optional(),
})

const orderSchema = z.object({
  type: z.string().min(1),
  content: z.string().min(1),
})

const inpatientOrderSchema = z.object({
  doctorId: z.string().optional(),
  type: z.string().min(1),
  content: z.string().min(1),
})

const labRequestSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1),
  clinicalNote: z.string().optional(),
})

const dischargeRequestSchema = z.object({
  reason: z.string().min(1),
})

const prescriptionSchema = z.object({
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        drugId: z.string().min(1),
        quantity: z.number().int().positive(),
        dosage: z.string().min(1),
        usage: z.string().min(1),
      }),
    )
    .default([]),
})

const receiveStockSchema = z.object({
  drugId: z.string().min(1),
  batchNo: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  expiresAt: z.coerce.date(),
  unitCost: z.coerce.number().nonnegative().optional(),
  supplier: z.string().optional(),
  reason: z.string().optional(),
})

const adjustStockSchema = z.object({
  quantity: z.coerce.number().int().min(0),
  reason: z.string().min(1),
})

const damageStockSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  reason: z.string().min(1),
})

const templateActionSchema = z.object({
  templateId: z.string().min(1),
})

const rejectPrescriptionSchema = z.object({
  reason: z.string().min(1),
})

const resubmitPrescriptionSchema = z.object({
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        drugId: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        dosage: z.string().min(1),
        usage: z.string().min(1),
      }),
    )
    .optional(),
})

function routeId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? '')
}

staffRouter.get('/doctor/registrations', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { doctor: { userId: req.user!.id } },
      include: {
        department: true,
        visitMember: true,
        slot: true,
        paymentOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ items: registrations })
  } catch (error) {
    next(error)
  }
})

staffRouter.get('/doctor/queue', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const where = req.user!.roles.includes('ADMIN') ? {} : { doctor: { userId: req.user!.id } }
    const registrations = await prisma.registration.findMany({
      where: {
        ...where,
        status: { in: [RegistrationStatus.CHECKED_IN, RegistrationStatus.IN_VISIT] },
      },
      include: {
        department: true,
        doctor: { include: { user: true } },
        visitMember: true,
        slot: true,
        queueTicket: true,
        encounter: {
          include: {
            medicalRecord: true,
            diagnoses: true,
            medicalOrders: true,
            prescriptions: { include: { items: { include: { drug: true } }, reviewLogs: { orderBy: { createdAt: 'desc' } } } },
          },
        },
      },
      orderBy: [{ checkedInAt: 'asc' }, { createdAt: 'asc' }],
      take: 100,
    })

    res.json({ items: registrations })
  } catch (error) {
    next(error)
  }
})

staffRouter.get('/doctor/queue-tickets', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const doctor = await requireDoctorProfileForRequest(req)
    const items = await prisma.queueTicket.findMany({
      where: doctor ? { doctorId: doctor.id } : undefined,
      include: { registration: { include: { visitMember: true } }, doctor: { include: { user: true } }, department: true },
      orderBy: [{ status: 'asc' }, { queueNo: 'asc' }],
      take: 100,
    })
    res.json({ items })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/queue/next', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const doctor = await requireDoctorProfileForRequest(req)
    const doctorId = doctor?.id ?? z.object({ doctorId: z.string().min(1) }).parse(req.body ?? {}).doctorId
    const item = await callNextPatient(doctorId)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/queue/:id/skip', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const doctor = await requireDoctorProfileForRequest(req)
    const item = await skipQueueTicket(routeId(req.params.id), doctor?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/queue/:id/restore', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const doctor = await requireDoctorProfileForRequest(req)
    const item = await restoreQueueTicket(routeId(req.params.id), doctor?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.get('/doctor/clinical-templates', requireRole('DOCTOR', 'ADMIN'), async (_req, res, next) => {
  try {
    const [recordTemplates, diagnoses, orders, prescriptionTemplates, drugs] = await Promise.all([
      prisma.medicalRecordTemplate.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.commonDiagnosis.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 300 }),
      prisma.commonMedicalOrder.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 300 }),
      prisma.prescriptionTemplate.findMany({ where: { isActive: true }, include: { items: { include: { drug: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.drugCatalog.findMany({ where: { isActive: true }, orderBy: { code: 'asc' }, take: 500 }),
    ])

    res.json({ recordTemplates, diagnoses, orders, prescriptionTemplates, drugs })
  } catch (error) {
    next(error)
  }
})

staffRouter.get('/doctor/lab-items', requireRole('DOCTOR', 'ADMIN'), async (_req, res, next) => {
  try {
    const items = await prisma.labTestItem.findMany({ where: { isActive: true }, orderBy: { code: 'asc' }, take: 300 })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

async function findDoctorProfile(userId: string) {
  return prisma.doctorProfile.findUnique({ where: { userId } })
}

async function requireDoctorProfileForRequest(req: Parameters<Parameters<typeof staffRouter.get>[1]>[0]) {
  if (req.user!.roles.includes('ADMIN')) {
    return null
  }

  const doctor = await findDoctorProfile(req.user!.id)
  if (!doctor) {
    throw new Error('医生档案不存在')
  }
  return doctor
}

async function findEncounterForDoctor(encounterId: string, doctorId?: string) {
  const encounter = await prisma.encounter.findUnique({ where: { id: encounterId } })
  if (!encounter) {
    throw new Error('接诊记录不存在')
  }
  if (doctorId && encounter.doctorId !== doctorId) {
    throw new Error('不能操作其他医生的接诊记录')
  }
  return encounter
}

async function findInpatientForDoctor(admissionId: string, doctorId?: string) {
  const admission = await prisma.inpatientAdmission.findUnique({ where: { id: admissionId } })
  if (!admission) {
    throw new Error('住院记录不存在')
  }
  if (doctorId && admission.attendingDoctorId !== doctorId) {
    throw new Error('不能操作其他医生的住院记录')
  }
  return admission
}

async function startRegistrationEncounter(registrationId: string, currentUserId: string, isAdmin: boolean) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { doctor: true },
  })

  if (!registration) {
    throw new Error('挂号记录不存在')
  }

  if (!isAdmin && registration.doctor.userId !== currentUserId) {
    throw new Error('不能接诊其他医生的患者')
  }

  assertCanStartEncounter(registration.status)

  return prisma.$transaction(async (tx) => {
    await tx.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.IN_VISIT },
    })
    const ticket = await tx.queueTicket.findUnique({ where: { registrationId: registration.id } })
    if (ticket && ticket.status !== 'COMPLETED') {
      await tx.queueTicket.update({
        where: { id: ticket.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
      await tx.doctorQueueState.updateMany({
        where: { doctorId: ticket.doctorId, currentTicketId: ticket.id },
        data: { currentTicketId: null },
      })
    }

    return tx.encounter.upsert({
      where: { registrationId: registration.id },
      create: {
        registrationId: registration.id,
        doctorId: registration.doctorId,
        status: EncounterStatus.OPEN,
        startedAt: new Date(),
      },
      update: {
        status: EncounterStatus.OPEN,
        startedAt: new Date(),
      },
      include: { registration: { include: { visitMember: true, department: true } }, medicalRecord: true, diagnoses: true, medicalOrders: true },
    })
  })
}

staffRouter.post('/doctor/registrations/:id/start', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await startRegistrationEncounter(routeId(req.params.id), req.user!.id, req.user!.roles.includes('ADMIN'))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/start', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await startRegistrationEncounter(routeId(req.params.id), req.user!.id, req.user!.roles.includes('ADMIN'))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.put('/doctor/encounters/:id/record', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = recordSchema.parse(req.body)
    const encounterId = routeId(req.params.id)
    const doctor = await requireDoctorProfileForRequest(req)
    await findEncounterForDoctor(encounterId, doctor?.id)
    const item = await prisma.medicalRecord.upsert({
      where: { encounterId },
      create: { encounterId, summary: input.summary, advice: input.advice },
      update: { summary: input.summary, advice: input.advice },
    })
    res.json({ item })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/diagnoses', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = diagnosisSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    await findEncounterForDoctor(routeId(req.params.id), doctor?.id)
    const item = await prisma.diagnosis.create({ data: { encounterId: routeId(req.params.id), ...input } })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/orders', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = orderSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    await findEncounterForDoctor(routeId(req.params.id), doctor?.id)
    const item = await prisma.medicalOrder.create({ data: { encounterId: routeId(req.params.id), type: input.type, content: input.content } })
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/prescriptions', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = prescriptionSchema.parse(req.body)
    validatePrescriptionDraft(input.items)
    const doctor = await requireDoctorProfileForRequest(req)
    const encounter = await findEncounterForDoctor(routeId(req.params.id), doctor?.id)

    const doctorId = doctor?.id ?? encounter.doctorId
    const item = await prisma.prescription.create({
      data: {
        encounterId: encounter.id,
        doctorId,
        status: PrescriptionStatus.SUBMITTED,
        note: input.note,
        items: {
          create: input.items.map((row) => ({
            drugId: row.drugId,
            quantity: row.quantity,
            dosage: row.dosage,
            usage: row.usage,
          })),
        },
      },
      include: { items: { include: { drug: true } } },
    })

    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/lab-requests', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = labRequestSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    const encounter = await findEncounterForDoctor(routeId(req.params.id), doctor?.id)
    const item = await createLabRequestForEncounter(encounter.id, input, doctor?.id ?? encounter.doctorId)
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/apply-record-template', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = templateActionSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    await findEncounterForDoctor(routeId(req.params.id), doctor?.id)
    const item = await applyRecordTemplate(routeId(req.params.id), input.templateId)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/prescriptions/from-template', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = templateActionSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    const encounter = await findEncounterForDoctor(routeId(req.params.id), doctor?.id)
    const item = await createPrescriptionFromTemplate(encounter.id, input.templateId, doctor?.id ?? encounter.doctorId)
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/prescriptions/:id/resubmit', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = resubmitPrescriptionSchema.parse(req.body ?? {})
    const doctor = await requireDoctorProfileForRequest(req)
    const item = await resubmitPrescription(routeId(req.params.id), input, doctor?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/encounters/:id/complete', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const doctor = await requireDoctorProfileForRequest(req)
    const encounter = await findEncounterForDoctor(routeId(req.params.id), doctor?.id)
    assertCanCompleteEncounter(encounter.status)

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.encounter.update({
        where: { id: encounter.id },
        data: { status: EncounterStatus.COMPLETED, completedAt: new Date() },
      })
      await tx.registration.update({
        where: { id: encounter.registrationId },
        data: { status: RegistrationStatus.COMPLETED },
      })
      const ticket = await tx.queueTicket.findUnique({ where: { registrationId: encounter.registrationId } })
      if (ticket && ticket.status !== 'COMPLETED') {
        await tx.queueTicket.update({
          where: { id: ticket.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        })
        await tx.doctorQueueState.updateMany({
          where: { doctorId: ticket.doctorId, currentTicketId: ticket.id },
          data: { currentTicketId: null },
        })
      }
      return updated
    })

    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.get('/doctor/inpatients', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const doctor = await requireDoctorProfileForRequest(req)
    const items = await prisma.inpatientAdmission.findMany({
      where: doctor ? { attendingDoctorId: doctor.id } : undefined,
      include: {
        user: true,
        visitMember: true,
        attendingDoctor: { include: { user: true, department: true } },
        ward: true,
        currentBed: { include: { ward: true } },
        bedAssignments: { include: { bed: { include: { ward: true } } }, orderBy: { assignedAt: 'desc' } },
        medicalRecords: { include: { doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
        orders: { include: { doctor: { include: { user: true } }, charges: true }, orderBy: { createdAt: 'desc' } },
        charges: { include: { paymentOrder: true }, orderBy: { createdAt: 'desc' } },
        dischargeRequests: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ items })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/inpatients/:id/orders', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = inpatientOrderSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    const admission = await findInpatientForDoctor(routeId(req.params.id), doctor?.id)
    const doctorId = doctor?.id ?? input.doctorId ?? admission.attendingDoctorId
    if (!doctorId) {
      res.status(400).json({ message: 'doctorId is required' })
      return
    }
    const item = await createInpatientOrder(admission.id, { doctorId, type: input.type, content: input.content })
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/inpatients/:id/lab-requests', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = labRequestSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    const admission = await findInpatientForDoctor(routeId(req.params.id), doctor?.id)
    const item = await createLabRequestForInpatient(admission.id, { ...input, doctorId: doctor?.id ?? admission.attendingDoctorId ?? undefined })
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/doctor/inpatients/:id/discharge-request', requireRole('DOCTOR', 'ADMIN'), async (req, res, next) => {
  try {
    const input = dischargeRequestSchema.parse(req.body)
    const doctor = await requireDoctorProfileForRequest(req)
    const admission = await findInpatientForDoctor(routeId(req.params.id), doctor?.id)
    const item = await requestDischarge(admission.id, { doctorId: doctor?.id ?? admission.attendingDoctorId ?? undefined, reason: input.reason })
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.get('/cashier/payment-orders', requireRole('CASHIER', 'ADMIN'), async (_req, res, next) => {
  try {
    const orders = await prisma.paymentOrder.findMany({
      include: {
        user: true,
        registration: { include: { visitMember: true, department: true } },
        items: true,
        transactions: true,
        refundOrders: { include: { transactions: true } },
        insuranceSettlements: { include: { items: true, profile: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ items: orders })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/cashier/payment-orders/:id/pay', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = z.object({ payMethod: z.string().optional() }).parse(req.body ?? {})
    const item = await mockPayOrder(routeId(req.params.id), input.payMethod, req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/cashier/payment-orders/:id/cancel', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await cancelPaymentOrder(routeId(req.params.id), req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/cashier/payment-orders/:id/insurance/pre-settle', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await preSettleOrder(routeId(req.params.id))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/cashier/payment-orders/:id/insurance/settle', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await settleOrder(routeId(req.params.id))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/cashier/insurance-settlements/:id/reverse', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await reverseSettlement(routeId(req.params.id))
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/cashier/payment-orders/:id/refunds', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = z.object({ amount: z.coerce.number().positive().optional(), reason: z.string().min(1) }).parse(req.body)
    const item = await requestRefund(routeId(req.params.id), input, req.user?.id)
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/cashier/refunds/:id/execute', requireRole('CASHIER', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await executeRefund(routeId(req.params.id), req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.get('/pharmacy/prescriptions', requireRole('PHARMACY', 'ADMIN'), async (_req, res, next) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        doctor: { include: { user: true, department: true } },
        encounter: { include: { registration: { include: { visitMember: true } } } },
        items: { include: { drug: { include: { stockBatches: { where: { isActive: true, quantity: { gt: 0 } }, orderBy: { expiresAt: 'asc' } } } } } },
        reviewLogs: { include: { reviewer: { select: { id: true, username: true, displayName: true } } }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ items: prescriptions })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/pharmacy/prescriptions/:id/review', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await reviewPrescriptionWithQuality(routeId(req.params.id), req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/pharmacy/prescriptions/:id/reject', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const input = rejectPrescriptionSchema.parse(req.body)
    const item = await rejectPrescription(routeId(req.params.id), input.reason, req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/pharmacy/prescriptions/:id/dispense', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await dispensePrescriptionWithStock(routeId(req.params.id), req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/pharmacy/prescriptions/:id/return', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const item = await returnDispensedPrescription(routeId(req.params.id), req.user?.id)
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.get('/pharmacy/stock-batches', requireRole('PHARMACY', 'ADMIN'), async (_req, res, next) => {
  try {
    const items = await prisma.drugStockBatch.findMany({
      include: { drug: true },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

staffRouter.post('/pharmacy/stock-batches', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const input = receiveStockSchema.parse(req.body)
    const item = await receiveStock({ ...input, operatorId: req.user?.id })
    res.status(201).json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/pharmacy/stock-batches/:id/adjust', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const input = adjustStockSchema.parse(req.body)
    const item = await adjustStock(routeId(req.params.id), { ...input, operatorId: req.user?.id })
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.post('/pharmacy/stock-batches/:id/damage', requireRole('PHARMACY', 'ADMIN'), async (req, res, next) => {
  try {
    const input = damageStockSchema.parse(req.body)
    const item = await damageStock(routeId(req.params.id), { ...input, operatorId: req.user?.id })
    res.json({ item })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message })
      return
    }
    next(error)
  }
})

staffRouter.get('/pharmacy/stock-movements', requireRole('PHARMACY', 'ADMIN'), async (_req, res, next) => {
  try {
    const items = await prisma.drugStockMovement.findMany({
      include: {
        drug: true,
        batch: true,
        prescription: true,
        operator: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    })
    res.json({ items })
  } catch (error) {
    next(error)
  }
})

staffRouter.get('/pharmacy/stock-alerts', requireRole('PHARMACY', 'ADMIN'), async (_req, res, next) => {
  try {
    const items = await listStockAlerts()
    res.json({ items })
  } catch (error) {
    next(error)
  }
})
