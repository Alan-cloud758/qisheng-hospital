import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InsuranceStatus, PaymentStatus } from '../generated/prisma/enums'

const { mockTx, mockPrismaProviderLog } = vi.hoisted(() => ({
  mockTx: {
  paymentOrder: { findUnique: vi.fn() },
  insuranceCatalogMapping: { findMany: vi.fn() },
  insuranceSettlement: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  insuranceProviderLog: { create: vi.fn() },
  },
  mockPrismaProviderLog: { create: vi.fn() },
}))
let createdSettlement: Record<string, unknown>

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
    insuranceProviderLog: mockPrismaProviderLog,
  },
}))

import { prisma } from '../lib/prisma'
import { assertCanReverseSettlement, calculateInsuranceSplit, offsetRefund, preSettleOrder, reverseSettlement, settleOrder } from './insurance'

function activeProfile(overrides: Record<string, unknown> = {}) {
  return { id: 'profile-1', isActive: true, reimbursementRatio: 0.7, selfPayFirstRatio: 0, updatedAt: new Date(), ...overrides }
}

describe('mock insurance settlement rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation((callback) => callback(mockTx as never))
    mockPrismaProviderLog.create.mockReset()
    mockTx.insuranceCatalogMapping.findMany.mockResolvedValue([])
    mockTx.insuranceSettlement.findFirst.mockResolvedValue(null)
    mockTx.insuranceSettlement.findUnique.mockResolvedValue(null)
    mockTx.insuranceSettlement.updateMany.mockResolvedValue({ count: 1 })
    createdSettlement = {}
    mockTx.insuranceSettlement.create.mockImplementation(async (input) => {
      createdSettlement = { id: 'settlement-1', ...input.data, items: input.data.items.create }
      return createdSettlement
    })
    mockTx.insuranceSettlement.update.mockImplementation(async (input) => {
      createdSettlement = { ...createdSettlement, ...input.data, id: input.where.id }
      return createdSettlement
    })
  })

  it('calculates class A reimbursement by ratio', () => {
    expect(calculateInsuranceSplit({ amount: 100, category: 'A', ratio: 0.7, selfPayFirstRatio: 0 })).toEqual({
      insuranceAmount: 70,
      selfPayAmount: 30,
    })
  })

  it('calculates class C as self-pay', () => {
    expect(calculateInsuranceSplit({ amount: 100, category: 'C', ratio: 0.7, selfPayFirstRatio: 0 })).toEqual({
      insuranceAmount: 0,
      selfPayAmount: 100,
    })
  })

  it('allows reverse only for settled records', () => {
    expect(() => assertCanReverseSettlement('SETTLED')).not.toThrow()
    expect(() => assertCanReverseSettlement('PRE_SETTLED')).toThrow('Only settled insurance records can be reversed')
  })

  it('uses order amount when payment order has no item rows', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PENDING,
      businessType: 'REGISTRATION',
      title: 'Registration fee',
      items: [],
      user: { insuranceProfiles: [activeProfile()] },
    })

    const settlement = await preSettleOrder('pay-1')

    expect(settlement.totalAmount).toBe(100)
    expect(settlement.insuranceAmount).toBe(70)
    expect(settlement.selfPayAmount).toBe(30)
  })

  it('rejects insurance settlement for non-pending payment orders', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PAID,
      businessType: 'REGISTRATION',
      items: [],
      user: { insuranceProfiles: [activeProfile()] },
    })

    await expect(preSettleOrder('pay-1')).rejects.toThrow('Only pending payment orders can use insurance settlement')
    expect(mockTx.insuranceSettlement.create).not.toHaveBeenCalled()
  })

  it('returns existing active settlement without creating another one', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PENDING,
      businessType: 'REGISTRATION',
      items: [],
      user: { insuranceProfiles: [activeProfile()] },
    })
    mockTx.insuranceSettlement.findFirst.mockResolvedValue({ id: 'settlement-existing', status: InsuranceStatus.PRE_SETTLED })

    const settlement = await preSettleOrder('pay-1')

    expect(settlement.id).toBe('settlement-existing')
    expect(mockTx.insuranceSettlement.create).not.toHaveBeenCalled()
  })

  it('matches catalog mapping by payment item name when item type is generic', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PENDING,
      businessType: 'OUTPATIENT',
      title: 'Outpatient fees',
      items: [{ itemName: 'LAB001', itemType: 'OUTPATIENT', amount: 100 }],
      user: { insuranceProfiles: [activeProfile({ reimbursementRatio: 0.5 })] },
    })
    mockTx.insuranceCatalogMapping.findMany.mockResolvedValue([
      { id: 'mapping-1', feeItemCode: 'LAB001', category: 'A', reimbursementRatio: 0.8, selfPayFirstRatio: 0 },
    ])

    const settlement = await preSettleOrder('pay-1')

    expect(settlement.insuranceAmount).toBe(80)
    expect(settlement.items[0]).toMatchObject({ mappingId: 'mapping-1', category: 'A', insuranceAmount: 80 })
  })

  it('prefers specific payment item name mapping over broad item type mapping', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PENDING,
      businessType: 'INPATIENT',
      title: 'Inpatient fees',
      items: [{ itemName: 'BED001', itemType: 'INPATIENT', amount: 100 }],
      user: { insuranceProfiles: [activeProfile({ reimbursementRatio: 0.5 })] },
    })
    mockTx.insuranceCatalogMapping.findMany.mockResolvedValue([
      { id: 'mapping-broad', feeItemCode: 'INPATIENT', category: 'B', reimbursementRatio: 0.4, selfPayFirstRatio: 0 },
      { id: 'mapping-specific', feeItemCode: 'BED001', category: 'A', reimbursementRatio: 0.8, selfPayFirstRatio: 0 },
    ])

    const settlement = await preSettleOrder('pay-1')

    expect(settlement.insuranceAmount).toBe(80)
    expect(settlement.items[0]).toMatchObject({ mappingId: 'mapping-specific', category: 'A', insuranceAmount: 80 })
  })

  it('writes failed provider logs before bubbling provider errors', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PENDING,
      businessType: 'REGISTRATION',
      title: 'Registration fee',
      items: [],
      user: { insuranceProfiles: [activeProfile()] },
    })
    const provider = {
      preSettle: vi.fn().mockRejectedValue(new Error('provider unavailable')),
      settle: vi.fn(),
      reverse: vi.fn(),
      refundOffset: vi.fn(),
    }

    await expect(preSettleOrder('pay-1', provider)).rejects.toThrow('provider unavailable')

    expect(mockPrismaProviderLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'preSettle',
        success: false,
        response: expect.objectContaining({ message: 'provider unavailable' }),
      }),
    })
  })

  it('claims pre-settlement before provider settle to prevent duplicate settlement calls', async () => {
    mockTx.insuranceSettlement.findFirst.mockResolvedValue({
      id: 'settlement-1',
      settlementNo: 'INS001',
      status: InsuranceStatus.PRE_SETTLED,
      totalAmount: 100,
      insuranceAmount: 70,
      selfPayAmount: 30,
      paymentOrder: { status: PaymentStatus.PENDING },
    })
    mockTx.insuranceSettlement.updateMany.mockResolvedValue({ count: 0 })
    const provider = {
      preSettle: vi.fn(),
      settle: vi.fn(),
      reverse: vi.fn(),
      refundOffset: vi.fn(),
    }

    await expect(settleOrder('pay-1', provider)).rejects.toThrow('Insurance settlement status changed, please retry')

    expect(provider.settle).not.toHaveBeenCalled()
  })

  it('rejects settling an existing pre-settlement when payment order is no longer pending', async () => {
    mockTx.insuranceSettlement.findFirst.mockResolvedValue({
      id: 'settlement-1',
      settlementNo: 'INS001',
      status: InsuranceStatus.PRE_SETTLED,
      totalAmount: 100,
      insuranceAmount: 70,
      selfPayAmount: 30,
      paymentOrder: { status: PaymentStatus.PAID },
    })

    await expect(settleOrder('pay-1')).rejects.toThrow('Only pending payment orders can use insurance settlement')
    expect(mockTx.insuranceSettlement.updateMany).not.toHaveBeenCalled()
  })

  it('does not call provider when another request already claimed the active settlement', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      amount: 100,
      status: PaymentStatus.PENDING,
      businessType: 'REGISTRATION',
      title: 'Registration fee',
      items: [],
      user: { insuranceProfiles: [activeProfile()] },
    })
    mockTx.insuranceSettlement.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'settlement-existing', status: InsuranceStatus.PRE_SETTLED })
    mockTx.insuranceSettlement.create.mockRejectedValue({ code: 'P2002' })
    const provider = {
      preSettle: vi.fn(),
      settle: vi.fn(),
      reverse: vi.fn(),
      refundOffset: vi.fn(),
    }

    const settlement = await preSettleOrder('pay-1', provider)

    expect(settlement.id).toBe('settlement-existing')
    expect(provider.preSettle).not.toHaveBeenCalled()
  })

  it('writes failed provider logs for existing settlement actions', async () => {
    mockTx.insuranceSettlement.findFirst.mockResolvedValue({
      id: 'settlement-1',
      settlementNo: 'INS001',
      status: InsuranceStatus.PRE_SETTLED,
      totalAmount: 100,
      insuranceAmount: 70,
      selfPayAmount: 30,
      paymentOrder: { status: PaymentStatus.PENDING },
    })
    const provider = {
      preSettle: vi.fn(),
      settle: vi.fn().mockRejectedValue(new Error('settle down')),
      reverse: vi.fn(),
      refundOffset: vi.fn(),
    }

    await expect(settleOrder('pay-1', provider)).rejects.toThrow('settle down')

    expect(mockPrismaProviderLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ settlementId: 'settlement-1', action: 'settle', success: false }),
    })
  })

  it('writes failed provider logs for reverse and refund offset', async () => {
    mockTx.insuranceSettlement.findUnique
      .mockResolvedValueOnce({
        id: 'settlement-1',
        settlementNo: 'INS001',
        providerTraceNo: 'TRACE001',
        status: InsuranceStatus.SETTLED,
        paymentOrder: { status: PaymentStatus.PENDING },
      })
      .mockResolvedValueOnce({ id: 'settlement-1', settlementNo: 'INS001', status: InsuranceStatus.SETTLED })

    await expect(
      reverseSettlement('settlement-1', {
        preSettle: vi.fn(),
        settle: vi.fn(),
        reverse: vi.fn().mockRejectedValue(new Error('reverse down')),
        refundOffset: vi.fn(),
      }),
    ).rejects.toThrow('reverse down')

    await expect(
      offsetRefund('settlement-1', 20, {
        preSettle: vi.fn(),
        settle: vi.fn(),
        reverse: vi.fn(),
        refundOffset: vi.fn().mockRejectedValue(new Error('offset down')),
      }),
    ).rejects.toThrow('offset down')

    expect(mockPrismaProviderLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ settlementId: 'settlement-1', action: 'reverse', success: false }),
    })
    expect(mockPrismaProviderLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ settlementId: 'settlement-1', action: 'refundOffset', success: false }),
    })
  })

  it('claims reverse before calling provider to prevent duplicate reversals', async () => {
    mockTx.insuranceSettlement.findUnique.mockResolvedValue({
      id: 'settlement-1',
      settlementNo: 'INS001',
      providerTraceNo: 'TRACE001',
      status: InsuranceStatus.SETTLED,
      paymentOrder: { status: PaymentStatus.PENDING },
    })
    mockTx.insuranceSettlement.updateMany.mockResolvedValue({ count: 0 })
    const provider = {
      preSettle: vi.fn(),
      settle: vi.fn(),
      reverse: vi.fn(),
      refundOffset: vi.fn(),
    }

    await expect(reverseSettlement('settlement-1', provider)).rejects.toThrow('Insurance settlement status changed, please retry')

    expect(provider.reverse).not.toHaveBeenCalled()
  })

  it('rejects reversing settled insurance after the payment order is no longer pending', async () => {
    mockTx.insuranceSettlement.findUnique.mockResolvedValue({
      id: 'settlement-1',
      settlementNo: 'INS001',
      providerTraceNo: 'TRACE001',
      status: InsuranceStatus.SETTLED,
      paymentOrder: { status: PaymentStatus.PAID },
    })

    await expect(reverseSettlement('settlement-1')).rejects.toThrow('Only pending payment orders can reverse insurance settlement')
    expect(mockTx.insuranceSettlement.updateMany).not.toHaveBeenCalled()
  })
})
