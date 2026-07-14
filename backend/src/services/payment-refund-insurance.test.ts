import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InsuranceStatus, RefundStatus } from '../generated/prisma/enums'

const mockTx = {
  refundOrder: { findUnique: vi.fn(), updateMany: vi.fn() },
  refundTransaction: { create: vi.fn() },
  paymentOrder: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  paymentTransaction: { create: vi.fn() },
  auditLog: { create: vi.fn() },
}

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}))

vi.mock('./insurance', () => ({
  offsetRefund: vi.fn(),
}))

import { offsetRefund } from './insurance'
import { executeRefund, mockPayOrder } from './payment'

describe('payment refund insurance integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.refundOrder.findUnique.mockResolvedValue({
      id: 'refund-1',
      refundNo: 'REF001',
      amount: 100,
      reason: 'patient request',
      paymentOrderId: 'pay-1',
      paymentOrder: {
        id: 'pay-1',
        insuranceSettlements: [{ id: 'ins-1', status: InsuranceStatus.SETTLED, insuranceAmount: 70 }],
      },
    })
    mockTx.refundOrder.updateMany.mockResolvedValue({ count: 1 })
    mockTx.refundOrder.findUnique.mockResolvedValueOnce({
      id: 'refund-1',
      refundNo: 'REF001',
      amount: 100,
      reason: 'patient request',
      paymentOrderId: 'pay-1',
      paymentOrder: {
        id: 'pay-1',
        insuranceSettlements: [{ id: 'ins-1', status: InsuranceStatus.SETTLED, insuranceAmount: 70 }],
      },
    }).mockResolvedValueOnce({
      id: 'refund-1',
      paymentOrder: { id: 'pay-1', insuranceSettlements: [{ id: 'ins-1', status: InsuranceStatus.SETTLED, insuranceAmount: 70 }] },
      transactions: [],
    })
  })

  it('offsets settled insurance after executing a refund', async () => {
    await executeRefund('refund-1', 'cashier-1', {
      refund: vi.fn().mockResolvedValue({ providerRefundNo: 'provider-refund-1', status: RefundStatus.SUCCESS, raw: {} }),
    })

    expect(offsetRefund).toHaveBeenCalledWith('ins-1', 70)
  })

  it('does not fail the completed refund response when insurance offset fails', async () => {
    vi.mocked(offsetRefund).mockRejectedValue(new Error('offset unavailable'))

    await expect(
      executeRefund('refund-1', 'cashier-1', {
        refund: vi.fn().mockResolvedValue({ providerRefundNo: 'provider-refund-1', status: RefundStatus.SUCCESS, raw: {} }),
      }),
    ).resolves.toMatchObject({ id: 'refund-1' })
  })

  it('rejects direct payment when an active pre-settlement exists', async () => {
    mockTx.paymentOrder.findUnique.mockResolvedValue({
      id: 'pay-1',
      orderNo: 'PAY001',
      amount: 100,
      insuranceSettlements: [{ id: 'ins-1', status: InsuranceStatus.PRE_SETTLED }],
    })

    await expect(
      mockPayOrder('pay-1', 'MOCK_CASH', 'cashier-1', {
        pay: vi.fn().mockResolvedValue({ providerTradeNo: 'provider-pay-1', status: 'SUCCESS', raw: {} }),
      }),
    ).rejects.toThrow('Settle or reverse insurance before payment')
  })
})
