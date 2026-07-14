import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentStatus } from '../generated/prisma/enums'

vi.mock('../lib/prisma', () => ({
  prisma: {
    paymentOrder: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'
import { calculateRate, getRevenueDashboard, netRevenue } from './dashboard'

describe('dashboard aggregation helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates rates safely', () => {
    expect(calculateRate(5, 10)).toBe(0.5)
    expect(calculateRate(0, 0)).toBe(0)
  })

  it('counts only paid orders as net revenue', () => {
    expect(
      netRevenue([
        { amount: 100, status: 'PAID' },
        { amount: 80, status: 'PENDING' },
        { amount: 50, status: 'REFUNDED' },
        { amount: 20, status: 'CANCELLED' },
      ]),
    ).toBe(100)
  })

  it('filters and groups paid revenue by payment time', async () => {
    vi.mocked(prisma.paymentOrder.findMany).mockResolvedValue([
      {
        amount: 100,
        status: PaymentStatus.PAID,
        createdAt: new Date('2026-07-13T10:00:00+08:00'),
        paidAt: new Date('2026-07-14T09:00:00+08:00'),
      },
    ])

    const result = await getRevenueDashboard({
      startDate: new Date(2026, 6, 14, 0, 0, 0, 0),
      endDate: new Date(2026, 6, 14, 23, 59, 59, 999),
    })

    expect(prisma.paymentOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PaymentStatus.PAID,
          paidAt: expect.objectContaining({
            gte: new Date(2026, 6, 14, 0, 0, 0, 0),
            lte: new Date(2026, 6, 14, 23, 59, 59, 999),
          }),
        }),
      }),
    )
    expect(result).toEqual({ total: 100, trend: [{ date: '2026-07-14', amount: 100 }] })
  })
})
