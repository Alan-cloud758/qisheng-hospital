import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BedStatus, DischargeRequestStatus, InpatientAdmissionStatus, PaymentStatus } from '../generated/prisma/enums'

vi.mock('../lib/prisma', () => ({
  prisma: {
    visitMember: { findFirst: vi.fn() },
    inpatientAdmission: { create: vi.fn() },
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}))

const mockTx = {
  inpatientAdmission: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  bed: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  bedAssignment: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  dischargeRequest: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  paymentOrder: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  inpatientCharge: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
}

import { prisma } from '../lib/prisma'
import { admitPatient, assignBed, assertCanDischarge, assertCanOccupyBed, completeDischarge, nextAdmissionNo, settleDischarge } from './inpatient'

describe('inpatient rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation((callback) => callback(mockTx as never))
  })

  it('allows bed occupation only when available', () => {
    expect(() => assertCanOccupyBed('AVAILABLE')).not.toThrow()
    expect(() => assertCanOccupyBed('OCCUPIED')).toThrow('Only available beds can be assigned')
  })

  it('allows discharge only after admission', () => {
    expect(() => assertCanDischarge('ADMITTED')).not.toThrow()
    expect(() => assertCanDischarge('PENDING')).toThrow('Only admitted patients can request discharge')
  })

  it('generates inpatient admission number prefix', () => {
    expect(nextAdmissionNo(new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^IP20260714/)
  })

  it('rejects admission when visit member does not belong to patient user', async () => {
    vi.mocked(prisma.visitMember.findFirst).mockResolvedValue(null)

    await expect(admitPatient({ userId: 'user-1', visitMemberId: 'member-2' })).rejects.toThrow('Visit member does not belong to patient user')
    expect(prisma.inpatientAdmission.create).not.toHaveBeenCalled()
  })

  it('claims an available bed atomically before creating assignment', async () => {
    mockTx.inpatientAdmission.findUnique.mockResolvedValue({ id: 'admission-1', status: InpatientAdmissionStatus.PENDING, admittedAt: null, bedVersion: 0 })
    mockTx.bed.findUnique.mockResolvedValue({ id: 'bed-1', wardId: 'ward-1', status: BedStatus.AVAILABLE })
    mockTx.bedAssignment.findFirst.mockResolvedValue(null)
    mockTx.bed.updateMany.mockResolvedValue({ count: 0 })

    await expect(assignBed('admission-1', 'bed-1')).rejects.toThrow('Only available beds can be assigned')
    expect(mockTx.bedAssignment.create).not.toHaveBeenCalled()
  })

  it('claims the admission bed version before creating a new assignment', async () => {
    mockTx.inpatientAdmission.findUnique.mockResolvedValue({ id: 'admission-1', status: InpatientAdmissionStatus.ADMITTED, admittedAt: new Date(), bedVersion: 3 })
    mockTx.bed.findUnique.mockResolvedValue({ id: 'bed-2', wardId: 'ward-1', status: BedStatus.AVAILABLE })
    mockTx.bedAssignment.findFirst.mockResolvedValue(null)
    mockTx.bed.updateMany.mockResolvedValue({ count: 1 })
    mockTx.inpatientAdmission.updateMany.mockResolvedValue({ count: 0 })

    await expect(assignBed('admission-1', 'bed-2')).rejects.toThrow('Inpatient bed assignment was changed, please retry')
    expect(mockTx.bedAssignment.create).not.toHaveBeenCalled()
  })

  it('blocks discharge completion while inpatient payment orders are pending', async () => {
    mockTx.dischargeRequest.findUnique.mockResolvedValue({
      id: 'discharge-1',
      admissionId: 'admission-1',
      status: DischargeRequestStatus.SETTLED,
      admission: { id: 'admission-1' },
    })
    mockTx.paymentOrder.findMany.mockResolvedValue([{ id: 'pay-1', status: PaymentStatus.PENDING }])

    await expect(completeDischarge('discharge-1')).rejects.toThrow('Inpatient charges must be paid before discharge')
    expect(mockTx.inpatientAdmission.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: InpatientAdmissionStatus.DISCHARGED }) }))
  })

  it('carries fee item code into inpatient payment order items for insurance catalog matching', async () => {
    mockTx.dischargeRequest.findUnique.mockResolvedValueOnce({
      id: 'discharge-1',
      admissionId: 'admission-1',
      status: DischargeRequestStatus.APPROVED,
      admission: { id: 'admission-1', admissionNo: 'IP001', userId: 'user-1' },
    }).mockResolvedValueOnce({ id: 'discharge-1' })
    mockTx.dischargeRequest.updateMany.mockResolvedValue({ count: 1 })
    mockTx.inpatientCharge.findMany.mockResolvedValue([
      {
        id: 'charge-1',
        itemName: 'Bed fee',
        quantity: 1,
        unitPrice: 100,
        amount: 100,
        feeItem: { code: 'BED001' },
      },
    ])
    mockTx.paymentOrder.create.mockResolvedValue({ id: 'pay-1' })

    await settleDischarge('discharge-1')

    expect(mockTx.paymentOrder.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        items: {
          create: [expect.objectContaining({ itemType: 'BED001', itemName: 'Bed fee' })],
        },
      }),
    }))
  })
})
