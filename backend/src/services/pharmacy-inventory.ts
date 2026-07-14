import { DrugStockMovementType, PrescriptionStatus } from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

interface BatchCandidate {
  id: string
  quantity: number
  expiresAt: Date
}

export interface DispenseBatchSelection {
  batchId: string
  quantity: number
}

type InventoryTx = Prisma.TransactionClient

const NEAR_EXPIRY_DAYS = 30

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function assertBatchCanDispense(expiresAt: Date, now = new Date()) {
  if (expiresAt < startOfDay(now)) {
    throw new Error('Expired stock batch cannot be dispensed')
  }
}

export function chooseDispenseBatches(batches: BatchCandidate[], quantity: number, now = new Date()): DispenseBatchSelection[] {
  if (quantity <= 0) {
    return []
  }

  let remaining = quantity
  const selected: DispenseBatchSelection[] = []
  const ordered = [...batches]
    .filter((batch) => batch.quantity > 0 && batch.expiresAt >= startOfDay(now))
    .sort((left, right) => left.expiresAt.getTime() - right.expiresAt.getTime() || left.id.localeCompare(right.id))

  for (const batch of ordered) {
    assertBatchCanDispense(batch.expiresAt, now)
    const picked = Math.min(batch.quantity, remaining)
    selected.push({ batchId: batch.id, quantity: picked })
    remaining -= picked
    if (remaining === 0) {
      break
    }
  }

  if (remaining > 0) {
    throw new Error('Insufficient stock for prescription')
  }

  return selected
}

export function sumDispensableQuantity(batches: BatchCandidate[], now = new Date()) {
  return batches
    .filter((batch) => batch.quantity > 0 && batch.expiresAt >= startOfDay(now))
    .reduce((sum, batch) => sum + batch.quantity, 0)
}

export function assertHasDispenseMovements(movements: unknown[]) {
  if (movements.length === 0) {
    throw new Error('Prescription has no dispensed stock movements')
  }
}

async function createMovement(
  tx: InventoryTx,
  input: {
    batchId: string
    drugId: string
    prescriptionId?: string
    type: DrugStockMovementType
    quantity: number
    beforeQuantity: number
    afterQuantity: number
    reason?: string
    operatorId?: string
  },
) {
  return tx.drugStockMovement.create({
    data: {
      batchId: input.batchId,
      drugId: input.drugId,
      prescriptionId: input.prescriptionId,
      type: input.type,
      quantity: input.quantity,
      beforeQuantity: input.beforeQuantity,
      afterQuantity: input.afterQuantity,
      reason: input.reason,
      operatorId: input.operatorId,
    },
  })
}

export async function receiveStock(input: {
  drugId: string
  batchNo: string
  quantity: number
  expiresAt: Date
  unitCost?: number
  supplier?: string
  reason?: string
  operatorId?: string
}) {
  if (input.quantity <= 0) {
    throw new Error('Received quantity must be positive')
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.drugStockBatch.upsert({
      where: { drugId_batchNo: { drugId: input.drugId, batchNo: input.batchNo } },
      update: {
        quantity: { increment: input.quantity },
        expiresAt: input.expiresAt,
        unitCost: input.unitCost,
        supplier: input.supplier,
        isActive: true,
      },
      create: {
        drugId: input.drugId,
        batchNo: input.batchNo,
        quantity: input.quantity,
        expiresAt: input.expiresAt,
        unitCost: input.unitCost,
        supplier: input.supplier,
      },
      include: { drug: true },
    })

    const beforeQuantity = batch.quantity - input.quantity
    await createMovement(tx, {
      batchId: batch.id,
      drugId: batch.drugId,
      type: DrugStockMovementType.RECEIVE,
      quantity: input.quantity,
      beforeQuantity,
      afterQuantity: batch.quantity,
      reason: input.reason ?? 'Stock received',
      operatorId: input.operatorId,
    })

    return batch
  })
}

export async function adjustStock(batchId: string, input: { quantity: number; reason: string; operatorId?: string }) {
  if (input.quantity < 0) {
    throw new Error('Adjusted quantity cannot be negative')
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.drugStockBatch.findUnique({ where: { id: batchId }, include: { drug: true } })
    if (!batch) {
      throw new Error('Stock batch not found')
    }

    const claimed = await tx.drugStockBatch.updateMany({
      where: { id: batch.id, quantity: batch.quantity },
      data: { quantity: input.quantity },
    })
    if (claimed.count !== 1) {
      throw new Error('Stock batch was changed, please retry')
    }

    const item = await tx.drugStockBatch.findUnique({ where: { id: batch.id }, include: { drug: true } })
    if (!item) {
      throw new Error('Stock batch not found')
    }

    await createMovement(tx, {
      batchId: batch.id,
      drugId: batch.drugId,
      type: DrugStockMovementType.ADJUST,
      quantity: input.quantity - batch.quantity,
      beforeQuantity: batch.quantity,
      afterQuantity: input.quantity,
      reason: input.reason,
      operatorId: input.operatorId,
    })

    return item
  })
}

export async function damageStock(batchId: string, input: { quantity: number; reason: string; operatorId?: string }) {
  if (input.quantity <= 0) {
    throw new Error('Damaged quantity must be positive')
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.drugStockBatch.findUnique({ where: { id: batchId }, include: { drug: true } })
    if (!batch) {
      throw new Error('Stock batch not found')
    }

    const claimed = await tx.drugStockBatch.updateMany({
      where: { id: batch.id, quantity: { gte: input.quantity } },
      data: { quantity: { decrement: input.quantity } },
    })
    if (claimed.count !== 1) {
      throw new Error('Damaged quantity exceeds current stock')
    }

    const updated = await tx.drugStockBatch.findUnique({ where: { id: batch.id }, include: { drug: true } })
    if (!updated) {
      throw new Error('Stock batch not found')
    }

    await createMovement(tx, {
      batchId: batch.id,
      drugId: batch.drugId,
      type: DrugStockMovementType.DAMAGE,
      quantity: -input.quantity,
      beforeQuantity: updated.quantity + input.quantity,
      afterQuantity: updated.quantity,
      reason: input.reason,
      operatorId: input.operatorId,
    })

    return updated
  })
}

export async function dispensePrescriptionWithStock(prescriptionId: string, operatorId?: string) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: { include: { drug: true } } },
    })

    if (!prescription) {
      throw new Error('Prescription not found')
    }
    if (prescription.status !== PrescriptionStatus.REVIEWED) {
      throw new Error('Only reviewed prescriptions can be dispensed')
    }

    const claimedPrescription = await tx.prescription.updateMany({
      where: { id: prescription.id, status: PrescriptionStatus.REVIEWED },
      data: { status: PrescriptionStatus.DISPENSED },
    })
    if (claimedPrescription.count !== 1) {
      throw new Error('Only reviewed prescriptions can be dispensed')
    }

    const now = new Date()
    const selectedBatches: Array<DispenseBatchSelection & { drugId: string; drugName: string; batchNo: string; expiresAt: Date }> = []

    for (const item of prescription.items) {
      const batches = await tx.drugStockBatch.findMany({
        where: { drugId: item.drugId, quantity: { gt: 0 }, isActive: true },
        orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
      })
      const selections = chooseDispenseBatches(batches, item.quantity, now)

      for (const selection of selections) {
        const batch = batches.find((row) => row.id === selection.batchId)
        if (!batch) {
          throw new Error('Selected stock batch not found')
        }
        const claimed = await tx.drugStockBatch.updateMany({
          where: { id: batch.id, quantity: { gte: selection.quantity } },
          data: { quantity: { decrement: selection.quantity } },
        })
        if (claimed.count !== 1) {
          throw new Error('Stock batch was changed, please retry')
        }
        const updated = await tx.drugStockBatch.findUnique({ where: { id: batch.id } })
        if (!updated) {
          throw new Error('Selected stock batch not found')
        }

        await createMovement(tx, {
          batchId: batch.id,
          drugId: batch.drugId,
          prescriptionId: prescription.id,
          type: DrugStockMovementType.DISPENSE,
          quantity: -selection.quantity,
          beforeQuantity: updated.quantity + selection.quantity,
          afterQuantity: updated.quantity,
          reason: `Dispensed prescription ${prescription.id}`,
          operatorId,
        })

        selectedBatches.push({
          batchId: batch.id,
          drugId: batch.drugId,
          drugName: item.drug.name,
          batchNo: batch.batchNo,
          expiresAt: batch.expiresAt,
          quantity: selection.quantity,
        })
      }
    }

    const item = await tx.prescription.findUnique({
      where: { id: prescription.id },
      include: { doctor: { include: { user: true, department: true } }, encounter: true, items: { include: { drug: true } } },
    })

    return { ...item!, selectedBatches }
  })
}

export async function returnDispensedPrescription(prescriptionId: string, operatorId?: string) {
  return prisma.$transaction(async (tx) => {
    const prescription = await tx.prescription.findUnique({ where: { id: prescriptionId } })
    if (!prescription) {
      throw new Error('Prescription not found')
    }
    if (prescription.status !== PrescriptionStatus.DISPENSED) {
      throw new Error('Only dispensed prescriptions can be returned')
    }

    const dispenseMovements = await tx.drugStockMovement.findMany({
      where: { prescriptionId, type: DrugStockMovementType.DISPENSE },
      include: { batch: true },
    })
    assertHasDispenseMovements(dispenseMovements)

    const claimedPrescription = await tx.prescription.updateMany({
      where: { id: prescription.id, status: PrescriptionStatus.DISPENSED },
      data: { status: PrescriptionStatus.REVIEWED },
    })
    if (claimedPrescription.count !== 1) {
      throw new Error('Only dispensed prescriptions can be returned')
    }

    for (const movement of dispenseMovements) {
      const quantity = Math.abs(movement.quantity)
      const updated = await tx.drugStockBatch.update({
        where: { id: movement.batchId },
        data: { quantity: { increment: quantity } },
      })

      await createMovement(tx, {
        batchId: movement.batchId,
        drugId: movement.drugId,
        prescriptionId,
        type: DrugStockMovementType.RETURN,
        quantity,
        beforeQuantity: updated.quantity - quantity,
        afterQuantity: updated.quantity,
        reason: `Returned prescription ${prescriptionId}`,
        operatorId,
      })
    }

    return tx.prescription.findUnique({
      where: { id: prescriptionId },
      include: { doctor: { include: { user: true, department: true } }, encounter: true, items: { include: { drug: true } } },
    })
  })
}

export async function listStockAlerts(now = new Date()) {
  const nearExpiryBefore = new Date(now)
  nearExpiryBefore.setDate(nearExpiryBefore.getDate() + NEAR_EXPIRY_DAYS)

  const drugs = await prisma.drugCatalog.findMany({
    where: { isActive: true },
    include: { stockBatches: { where: { isActive: true }, orderBy: { expiresAt: 'asc' } } },
    orderBy: { code: 'asc' },
  })

  const computedAlerts = drugs.flatMap((drug) => {
    const total = sumDispensableQuantity(drug.stockBatches, now)
    const alerts: Array<{
      id: string
      drugId: string
      drugName: string
      batchId?: string
      batchNo?: string
      type: string
      level: string
      message: string
      quantity?: number
      expiresAt?: Date
    }> = []

    if (drug.minStock > 0 && total <= drug.minStock) {
      alerts.push({
        id: `low-${drug.id}`,
        drugId: drug.id,
        drugName: drug.name,
        type: 'LOW_STOCK',
        level: total === 0 ? 'CRITICAL' : 'WARNING',
        message: `${drug.name} stock ${total} is at or below minimum ${drug.minStock}`,
        quantity: total,
      })
    }

    for (const batch of drug.stockBatches) {
      if (batch.quantity > 0 && batch.expiresAt < startOfDay(now)) {
        alerts.push({
          id: `expired-${batch.id}`,
          drugId: drug.id,
          drugName: drug.name,
          batchId: batch.id,
          batchNo: batch.batchNo,
          type: 'EXPIRED',
          level: 'CRITICAL',
          message: `${drug.name} batch ${batch.batchNo} is expired`,
          quantity: batch.quantity,
          expiresAt: batch.expiresAt,
        })
      } else if (batch.quantity > 0 && batch.expiresAt <= nearExpiryBefore) {
        alerts.push({
          id: `near-expiry-${batch.id}`,
          drugId: drug.id,
          drugName: drug.name,
          batchId: batch.id,
          batchNo: batch.batchNo,
          type: 'NEAR_EXPIRY',
          level: 'WARNING',
          message: `${drug.name} batch ${batch.batchNo} expires soon`,
          quantity: batch.quantity,
          expiresAt: batch.expiresAt,
        })
      }
    }

    return alerts
  })

  await prisma.$transaction(async (tx) => {
    const activeAlertIds = computedAlerts.map((alert) => alert.id)
    await tx.drugStockAlert.updateMany({
      where: activeAlertIds.length ? { isResolved: false, id: { notIn: activeAlertIds } } : { isResolved: false },
      data: { isResolved: true, resolvedAt: now },
    })

    for (const alert of computedAlerts) {
      await tx.drugStockAlert.upsert({
        where: { id: alert.id },
        update: {
          drugId: alert.drugId,
          batchId: alert.batchId,
          type: alert.type,
          level: alert.level,
          message: alert.message,
          isResolved: false,
          resolvedAt: null,
        },
        create: {
          id: alert.id,
          drugId: alert.drugId,
          batchId: alert.batchId,
          type: alert.type,
          level: alert.level,
          message: alert.message,
        },
      })
    }
  })

  return computedAlerts
}
