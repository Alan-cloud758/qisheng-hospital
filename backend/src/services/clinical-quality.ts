import { PrescriptionStatus } from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

export interface PrescriptionDraftItem {
  drugId: string
  quantity: number
  dosage: string
  usage: string
}

type ClinicalTx = Prisma.TransactionClient

export function findDuplicateDrugIds(items: Array<{ drugId: string }>) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const item of items) {
    if (seen.has(item.drugId)) {
      duplicates.add(item.drugId)
    }
    seen.add(item.drugId)
  }

  return [...duplicates]
}

export function validatePrescriptionDraft(items: PrescriptionDraftItem[]) {
  if (items.length === 0) {
    throw new Error('Prescription item quantity, dosage, and usage are required')
  }

  if (
    items.some(
      (item) => !item.drugId?.trim() || !Number.isInteger(item.quantity) || item.quantity <= 0 || !item.dosage?.trim() || !item.usage?.trim(),
    )
  ) {
    throw new Error('Prescription item quantity, dosage, and usage are required')
  }

  if (findDuplicateDrugIds(items).length > 0) {
    throw new Error('Duplicate prescription drugs are not allowed')
  }
}

async function writePrescriptionReviewLog(
  tx: ClinicalTx,
  input: {
    prescriptionId: string
    action: string
    fromStatus?: PrescriptionStatus
    toStatus: PrescriptionStatus
    reason?: string
    reviewerId?: string
  },
) {
  return tx.prescriptionReviewLog.create({
    data: {
      prescriptionId: input.prescriptionId,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      reason: input.reason,
      reviewerId: input.reviewerId,
    },
  })
}

export async function applyRecordTemplate(encounterId: string, templateId: string) {
  return prisma.$transaction(async (tx) => {
    const template = await tx.medicalRecordTemplate.findUnique({ where: { id: templateId } })
    if (!template || !template.isActive) {
      throw new Error('Medical record template not found')
    }

    return tx.medicalRecord.upsert({
      where: { encounterId },
      create: {
        encounterId,
        summary: template.summary,
        advice: template.advice,
      },
      update: {
        summary: template.summary,
        advice: template.advice,
      },
    })
  })
}

export async function createPrescriptionFromTemplate(encounterId: string, templateId: string, doctorId?: string) {
  return prisma.$transaction(async (tx) => {
    const [encounter, template] = await Promise.all([
      tx.encounter.findUnique({ where: { id: encounterId } }),
      tx.prescriptionTemplate.findUnique({ where: { id: templateId }, include: { items: true } }),
    ])

    if (!encounter) {
      throw new Error('Encounter not found')
    }
    if (!template || !template.isActive) {
      throw new Error('Prescription template not found')
    }

    validatePrescriptionDraft(template.items)

    return tx.prescription.create({
      data: {
        encounterId: encounter.id,
        doctorId: doctorId ?? encounter.doctorId,
        status: PrescriptionStatus.SUBMITTED,
        note: template.note,
        items: {
          create: template.items.map((item) => ({
            drugId: item.drugId,
            quantity: item.quantity,
            dosage: item.dosage,
            usage: item.usage,
          })),
        },
      },
      include: { items: { include: { drug: true } } },
    })
  })
}

export async function reviewPrescription(prescriptionId: string, reviewerId?: string) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({ where: { id: prescriptionId } })
    if (!prescription) {
      throw new Error('Prescription not found')
    }
    if (prescription.status !== PrescriptionStatus.SUBMITTED) {
      throw new Error('Only submitted prescriptions can be reviewed')
    }

    const claimed = await tx.prescription.updateMany({
      where: { id: prescription.id, status: PrescriptionStatus.SUBMITTED },
      data: {
        status: PrescriptionStatus.REVIEWED,
        rejectedReason: null,
        rejectedAt: null,
      },
    })
    if (claimed.count !== 1) {
      throw new Error('Only submitted prescriptions can be reviewed')
    }

    const item = await tx.prescription.findUnique({
      where: { id: prescription.id },
      include: {
        items: { include: { drug: { include: { stockBatches: { where: { isActive: true, quantity: { gt: 0 } }, orderBy: { expiresAt: 'asc' } } } } } },
        reviewLogs: { include: { reviewer: { select: { id: true, username: true, displayName: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })

    await writePrescriptionReviewLog(tx, {
      prescriptionId: prescription.id,
      action: 'REVIEW',
      fromStatus: prescription.status,
      toStatus: PrescriptionStatus.REVIEWED,
      reviewerId,
    })

    return item!
  })
}

export async function rejectPrescription(prescriptionId: string, reason: string, reviewerId?: string) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({ where: { id: prescriptionId } })
    if (!prescription) {
      throw new Error('Prescription not found')
    }
    if (prescription.status !== PrescriptionStatus.SUBMITTED) {
      throw new Error('Only submitted prescriptions can be rejected')
    }

    const claimed = await tx.prescription.updateMany({
      where: { id: prescription.id, status: PrescriptionStatus.SUBMITTED },
      data: {
        status: PrescriptionStatus.REJECTED,
        rejectedReason: reason,
        rejectedAt: new Date(),
      },
    })
    if (claimed.count !== 1) {
      throw new Error('Only submitted prescriptions can be rejected')
    }

    const item = await tx.prescription.findUnique({
      where: { id: prescription.id },
      include: {
        items: { include: { drug: true } },
        reviewLogs: { include: { reviewer: { select: { id: true, username: true, displayName: true } } }, orderBy: { createdAt: 'desc' } },
      },
    })

    await writePrescriptionReviewLog(tx, {
      prescriptionId: prescription.id,
      action: 'REJECT',
      fromStatus: prescription.status,
      toStatus: PrescriptionStatus.REJECTED,
      reason,
      reviewerId,
    })

    return item!
  })
}

export async function resubmitPrescription(
  prescriptionId: string,
  input: { note?: string; items?: PrescriptionDraftItem[] } = {},
  doctorId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({ where: { id: prescriptionId }, include: { doctor: true } })
    if (!prescription) {
      throw new Error('Prescription not found')
    }
    if (prescription.status !== PrescriptionStatus.REJECTED) {
      throw new Error('Only rejected prescriptions can be resubmitted')
    }
    if (doctorId && prescription.doctorId !== doctorId) {
      throw new Error('Cannot resubmit another doctor prescription')
    }

    if (input.items) {
      validatePrescriptionDraft(input.items)
    }

    const claimed = await tx.prescription.updateMany({
      where: { id: prescription.id, status: PrescriptionStatus.REJECTED },
      data: {
        status: PrescriptionStatus.SUBMITTED,
        note: input.note,
        rejectedReason: null,
        rejectedAt: null,
        resubmittedAt: new Date(),
      },
    })
    if (claimed.count !== 1) {
      throw new Error('Only rejected prescriptions can be resubmitted')
    }

    if (input.items) {
      await tx.prescriptionItem.deleteMany({ where: { prescriptionId: prescription.id } })
      await tx.prescriptionItem.createMany({
        data: input.items.map((item) => ({
          prescriptionId: prescription.id,
          drugId: item.drugId,
          quantity: item.quantity,
          dosage: item.dosage,
          usage: item.usage,
        })),
      })
    }

    const item = await tx.prescription.findUnique({
      where: { id: prescription.id },
      include: { items: { include: { drug: true } } },
    })

    return item!
  })
}
