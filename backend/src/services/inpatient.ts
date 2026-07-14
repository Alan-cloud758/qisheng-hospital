import {
  AuditAction,
  BedAssignmentStatus,
  BedStatus,
  DischargeRequestStatus,
  InpatientAdmissionStatus,
  InpatientChargeStatus,
  InpatientOrderStatus,
  PaymentStatus,
  PaymentBusinessType,
} from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

type InpatientTx = Prisma.TransactionClient

export function assertCanOccupyBed(status: string) {
  if (status !== BedStatus.AVAILABLE) {
    throw new Error('Only available beds can be assigned')
  }
}

export function assertCanDischarge(status: string) {
  if (status !== InpatientAdmissionStatus.ADMITTED) {
    throw new Error('Only admitted patients can request discharge')
  }
}

export function nextAdmissionNo(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `IP${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

function nextInpatientPaymentNo(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `IPB${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

function includeAdmission() {
  return {
    user: true,
    visitMember: true,
    attendingDoctor: { include: { user: true, department: true } },
    ward: true,
    currentBed: { include: { ward: true } },
    bedAssignments: { include: { bed: { include: { ward: true } } }, orderBy: { assignedAt: 'desc' } },
    medicalRecords: { include: { doctor: { include: { user: true } } }, orderBy: { createdAt: 'desc' } },
    orders: { include: { doctor: { include: { user: true } }, charges: true }, orderBy: { createdAt: 'desc' } },
    charges: { include: { feeItem: true, paymentOrder: true }, orderBy: { createdAt: 'desc' } },
    dischargeRequests: { orderBy: { createdAt: 'desc' } },
  } satisfies Prisma.InpatientAdmissionInclude
}

async function findAdmission(tx: InpatientTx, admissionId: string) {
  const admission = await tx.inpatientAdmission.findUnique({ where: { id: admissionId } })
  if (!admission) {
    throw new Error('Inpatient admission not found')
  }
  return admission
}

async function findBed(tx: InpatientTx, bedId: string) {
  const bed = await tx.bed.findUnique({ where: { id: bedId }, include: { ward: true } })
  if (!bed) {
    throw new Error('Bed not found')
  }
  return bed
}

async function releaseActiveAssignment(tx: InpatientTx, admissionId: string, reason?: string) {
  const active = await tx.bedAssignment.findFirst({
    where: { admissionId, status: BedAssignmentStatus.ACTIVE },
    orderBy: { assignedAt: 'desc' },
  })
  if (!active) return

  await tx.bedAssignment.update({
    where: { id: active.id },
    data: { status: BedAssignmentStatus.RELEASED, releasedAt: new Date(), reason },
  })
  await tx.bed.update({ where: { id: active.bedId }, data: { status: BedStatus.AVAILABLE } })
}

function optionalId(value?: string) {
  return value && value.trim() ? value.trim() : undefined
}

async function claimBed(tx: InpatientTx, bedId: string) {
  const claimed = await tx.bed.updateMany({
    where: { id: bedId, status: BedStatus.AVAILABLE, isActive: true },
    data: { status: BedStatus.OCCUPIED },
  })
  if (claimed.count !== 1) {
    throw new Error('Only available beds can be assigned')
  }
}

async function claimAdmissionBedVersion(
  tx: InpatientTx,
  admission: Awaited<ReturnType<typeof findAdmission>>,
  data: {
    status?: InpatientAdmissionStatus
    wardId: string
    currentBedId: string
    admittedAt?: Date
  },
) {
  const claimed = await tx.inpatientAdmission.updateMany({
    where: { id: admission.id, bedVersion: admission.bedVersion },
    data: {
      ...data,
      bedVersion: { increment: 1 },
    },
  })
  if (claimed.count !== 1) {
    throw new Error('Inpatient bed assignment was changed, please retry')
  }
}

export async function admitPatient(input: {
  userId: string
  visitMemberId: string
  attendingDoctorId?: string
  wardId?: string
  diagnosis?: string
  notes?: string
  depositAmount?: number
}) {
  const member = await prisma.visitMember.findFirst({ where: { id: input.visitMemberId, patient: { userId: input.userId } } })
  if (!member) {
    throw new Error('Visit member does not belong to patient user')
  }

  return prisma.inpatientAdmission.create({
    data: {
      admissionNo: nextAdmissionNo(),
      userId: input.userId,
      visitMemberId: input.visitMemberId,
      attendingDoctorId: optionalId(input.attendingDoctorId),
      wardId: optionalId(input.wardId),
      diagnosis: input.diagnosis || undefined,
      notes: input.notes || undefined,
      depositAmount: input.depositAmount ?? 0,
    },
    include: includeAdmission(),
  })
}

export async function assignBed(admissionId: string, bedId: string, reason = 'Admission bed assignment') {
  return prisma.$transaction(async (tx) => {
    const admission = await findAdmission(tx, admissionId)
    if (admission.status !== InpatientAdmissionStatus.PENDING && admission.status !== InpatientAdmissionStatus.ADMITTED) {
      throw new Error('Only pending or admitted patients can be assigned a bed')
    }
    const bed = await findBed(tx, bedId)
    assertCanOccupyBed(bed.status)

    await releaseActiveAssignment(tx, admission.id, 'Reassigned bed')
    await claimBed(tx, bed.id)
    await claimAdmissionBedVersion(tx, admission, {
      status: InpatientAdmissionStatus.ADMITTED,
      wardId: bed.wardId,
      currentBedId: bed.id,
      admittedAt: admission.admittedAt ?? new Date(),
    })
    await tx.bedAssignment.create({ data: { admissionId: admission.id, bedId: bed.id, reason } })
    return tx.inpatientAdmission.findUnique({
      where: { id: admission.id },
      include: includeAdmission(),
    })
  })
}

export async function transferBed(admissionId: string, bedId: string, reason = 'Bed transfer') {
  return prisma.$transaction(async (tx) => {
    const admission = await findAdmission(tx, admissionId)
    if (admission.status !== InpatientAdmissionStatus.ADMITTED) {
      throw new Error('Only admitted patients can transfer beds')
    }
    const bed = await findBed(tx, bedId)
    assertCanOccupyBed(bed.status)

    await releaseActiveAssignment(tx, admission.id, reason)
    await claimBed(tx, bed.id)
    await claimAdmissionBedVersion(tx, admission, {
      wardId: bed.wardId,
      currentBedId: bed.id,
    })
    await tx.bedAssignment.create({ data: { admissionId: admission.id, bedId: bed.id, reason } })
    return tx.inpatientAdmission.findUnique({
      where: { id: admission.id },
      include: includeAdmission(),
    })
  })
}

export async function releaseBed(admissionId: string, reason = 'Bed released') {
  return prisma.$transaction(async (tx) => {
    const admission = await findAdmission(tx, admissionId)
    await releaseActiveAssignment(tx, admission.id, reason)
    return tx.inpatientAdmission.update({
      where: { id: admission.id },
      data: { currentBedId: null },
      include: includeAdmission(),
    })
  })
}

export async function createInpatientOrder(admissionId: string, input: { doctorId: string; type: string; content: string }) {
  const admission = await prisma.inpatientAdmission.findUnique({ where: { id: admissionId } })
  if (!admission) {
    throw new Error('Inpatient admission not found')
  }
  if (admission.status !== InpatientAdmissionStatus.ADMITTED) {
    throw new Error('Only admitted patients can receive inpatient orders')
  }
  return prisma.inpatientOrder.create({
    data: { admissionId, doctorId: input.doctorId, type: input.type, content: input.content },
    include: { admission: { include: { visitMember: true, currentBed: true } }, doctor: { include: { user: true } }, charges: true },
  })
}

export async function stopInpatientOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.inpatientOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new Error('Inpatient order not found')
    }
    const claimed = await tx.inpatientOrder.updateMany({
      where: { id: order.id, status: InpatientOrderStatus.ACTIVE },
      data: { status: InpatientOrderStatus.STOPPED, stoppedAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only active inpatient orders can be stopped')
    }
    return tx.inpatientOrder.findUnique({ where: { id: order.id }, include: { admission: true, doctor: { include: { user: true } }, charges: true } })
  })
}

export async function createInpatientChargeFromOrder(
  orderId: string,
  input: { feeItemId?: string; itemName?: string; quantity?: number; unitPrice?: number },
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.inpatientOrder.findUnique({ where: { id: orderId }, include: { admission: true } })
    if (!order) {
      throw new Error('Inpatient order not found')
    }
    if (order.status !== InpatientOrderStatus.ACTIVE) {
      throw new Error('Only active inpatient orders can create charges')
    }

    const feeItem = input.feeItemId ? await tx.feeItem.findUnique({ where: { id: input.feeItemId } }) : null
    const quantity = input.quantity ?? 1
    const unitPrice = input.unitPrice ?? (feeItem ? Number(feeItem.amount) : 0)
    const itemName = input.itemName ?? feeItem?.name ?? order.content
    const amount = quantity * unitPrice

    return tx.inpatientCharge.create({
      data: { admissionId: order.admissionId, orderId: order.id, feeItemId: feeItem?.id, itemName, quantity, unitPrice, amount },
      include: { admission: true, order: true, feeItem: true },
    })
  })
}

export async function requestDischarge(admissionId: string, input: { reason: string; doctorId?: string }) {
  return prisma.$transaction(async (tx) => {
    const admission = await findAdmission(tx, admissionId)
    assertCanDischarge(admission.status)
    const claimed = await tx.inpatientAdmission.updateMany({
      where: { id: admission.id, status: InpatientAdmissionStatus.ADMITTED },
      data: { status: InpatientAdmissionStatus.DISCHARGE_REQUESTED },
    })
    if (claimed.count !== 1) {
      throw new Error('Only admitted patients can request discharge')
    }
    return tx.dischargeRequest.create({
      data: { admissionId: admission.id, requestedByDoctorId: input.doctorId, reason: input.reason },
      include: { admission: { include: includeAdmission() }, requestedByDoctor: { include: { user: true } } },
    })
  })
}

export async function approveDischarge(requestId: string, input: { approvedByUserId?: string; approvalNote?: string }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.dischargeRequest.findUnique({ where: { id: requestId }, include: { admission: true } })
    if (!request) {
      throw new Error('Discharge request not found')
    }
    if (request.status !== DischargeRequestStatus.REQUESTED) {
      throw new Error('Only requested discharge can be approved')
    }
    const claimed = await tx.dischargeRequest.updateMany({
      where: { id: request.id, status: DischargeRequestStatus.REQUESTED },
      data: {
        status: DischargeRequestStatus.APPROVED,
        approvedByUserId: input.approvedByUserId,
        approvalNote: input.approvalNote,
        approvedAt: new Date(),
      },
    })
    if (claimed.count !== 1) {
      throw new Error('Only requested discharge can be approved')
    }
    await tx.inpatientAdmission.update({ where: { id: request.admissionId }, data: { status: InpatientAdmissionStatus.DISCHARGE_APPROVED } })
    return tx.dischargeRequest.findUnique({
      where: { id: request.id },
      include: { admission: { include: includeAdmission() }, approvedBy: true },
    })
  })
}

export async function settleDischarge(requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.dischargeRequest.findUnique({ where: { id: requestId }, include: { admission: true } })
    if (!request) {
      throw new Error('Discharge request not found')
    }
    if (request.status !== DischargeRequestStatus.APPROVED) {
      throw new Error('Only approved discharge can be settled')
    }
    const claimed = await tx.dischargeRequest.updateMany({
      where: { id: request.id, status: DischargeRequestStatus.APPROVED },
      data: { status: DischargeRequestStatus.SETTLED, settledAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only approved discharge can be settled')
    }
    const charges = await tx.inpatientCharge.findMany({ where: { admissionId: request.admissionId, status: InpatientChargeStatus.UNBILLED } })
    const amount = charges.reduce((sum, charge) => sum + Number(charge.amount), 0)
    let paymentOrderId: string | undefined

    if (charges.length > 0) {
      const order = await tx.paymentOrder.create({
        data: {
          orderNo: nextInpatientPaymentNo(),
          title: `住院费用 ${request.admission.admissionNo}`,
          amount,
          businessType: PaymentBusinessType.INPATIENT,
          sourceType: 'inpatient-admission',
          sourceId: request.admissionId,
          userId: request.admission.userId,
          items: {
            create: charges.map((charge) => ({
              itemType: 'INPATIENT',
              itemName: charge.itemName,
              quantity: charge.quantity,
              unitPrice: charge.unitPrice,
              amount: charge.amount,
            })),
          },
        },
      })
      paymentOrderId = order.id
      await tx.inpatientCharge.updateMany({
        where: { id: { in: charges.map((charge) => charge.id) } },
        data: { status: InpatientChargeStatus.BILLED, paymentOrderId },
      })
    }

    await tx.inpatientAdmission.update({ where: { id: request.admissionId }, data: { status: InpatientAdmissionStatus.SETTLED } })
    return tx.dischargeRequest.findUnique({
      where: { id: request.id },
      include: { admission: { include: includeAdmission() } },
    })
  })
}

export async function completeDischarge(requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.dischargeRequest.findUnique({ where: { id: requestId }, include: { admission: true } })
    if (!request) {
      throw new Error('Discharge request not found')
    }
    if (request.status !== DischargeRequestStatus.SETTLED) {
      throw new Error('Only settled discharge can be completed')
    }
    const pendingOrders = await tx.paymentOrder.findMany({
      where: { sourceType: 'inpatient-admission', sourceId: request.admissionId, status: { not: PaymentStatus.PAID } },
      select: { id: true, status: true },
    })
    if (pendingOrders.length > 0) {
      throw new Error('Inpatient charges must be paid before discharge')
    }
    const claimed = await tx.dischargeRequest.updateMany({
      where: { id: request.id, status: DischargeRequestStatus.SETTLED },
      data: { status: DischargeRequestStatus.COMPLETED, completedAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only settled discharge can be completed')
    }
    await releaseActiveAssignment(tx, request.admissionId, 'Discharged')
    await tx.inpatientAdmission.update({
      where: { id: request.admissionId },
      data: { status: InpatientAdmissionStatus.DISCHARGED, currentBedId: null, dischargedAt: new Date() },
    })
    return tx.dischargeRequest.findUnique({
      where: { id: request.id },
      include: { admission: { include: includeAdmission() } },
    })
  })
}

export async function createInpatientMedicalRecord(admissionId: string, input: { doctorId?: string; summary: string; plan?: string }) {
  return prisma.inpatientMedicalRecord.create({
    data: { admissionId, doctorId: input.doctorId, summary: input.summary, plan: input.plan },
    include: { admission: { include: { visitMember: true } }, doctor: { include: { user: true } } },
  })
}

export async function writeInpatientAudit(userId: string | undefined, resource: string, resourceId: string, detail: string) {
  return prisma.auditLog.create({ data: { userId, action: AuditAction.UPDATE, resource, resourceId, detail } })
}
