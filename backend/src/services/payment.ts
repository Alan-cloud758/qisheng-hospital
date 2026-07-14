import { AuditAction, PaymentStatus, RefundStatus } from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { MockPaymentProvider, type PaymentProvider } from '../providers/payment-provider'
import { offsetRefund } from './insurance'

const defaultProvider = new MockPaymentProvider()

export function assertCanCancelOrder(status: string) {
  if (status !== PaymentStatus.PENDING) {
    throw new Error('Only pending payment orders can be cancelled')
  }
}

export function assertCanRefundOrder(status: string) {
  if (status !== PaymentStatus.PAID) {
    throw new Error('Only paid payment orders can be refunded')
  }
}

export function createMockTransactionNo(prefix: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `${prefix}${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

export async function recalculateOrderAmount(orderId: string) {
  const items = await prisma.paymentOrderItem.findMany({ where: { paymentOrderId: orderId } })
  const amount = items.reduce((sum, item) => sum + Number(item.amount), 0)
  return prisma.paymentOrder.update({ where: { id: orderId }, data: { amount } })
}

export async function mockPayOrder(orderId: string, payMethod = 'MOCK_CASH', userId?: string, provider: PaymentProvider = defaultProvider) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { id: orderId }, include: { items: true, insuranceSettlements: true } })
    if (!order) {
      throw new Error('Payment order not found')
    }
    if (order.insuranceSettlements.some((settlement) => settlement.status === 'PRE_SETTLED')) {
      throw new Error('Settle or reverse insurance before payment')
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { id: order.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.PAID, paidAt: new Date(), payMethod },
    })

    if (claimed.count !== 1) {
      throw new Error('Only pending orders can be paid')
    }

    const result = await provider.pay({ orderNo: order.orderNo, amount: order.amount.toString(), payMethod })
    const transactionNo = createMockTransactionNo('PAY')

    await tx.paymentTransaction.create({
      data: {
        paymentOrderId: order.id,
        transactionNo,
        providerTradeNo: result.providerTradeNo,
        payMethod,
        amount: order.amount,
        status: result.status,
        raw: result.raw as Prisma.InputJsonValue,
      },
    })

    const item = await tx.paymentOrder.findUnique({
      where: { id: order.id },
      include: { items: true, transactions: true, refundOrders: true, registration: true },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.PAY, resource: 'payment-order', resourceId: order.id, detail: `Mock paid ${order.orderNo}` },
    })

    return item!
  })
}

export async function cancelPaymentOrder(orderId: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new Error('Payment order not found')
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { id: order.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.CANCELLED, cancelledAt: new Date() },
    })

    if (claimed.count !== 1) {
      throw new Error('Only pending payment orders can be cancelled')
    }

    const item = await tx.paymentOrder.findUnique({
      where: { id: order.id },
      include: { items: true, transactions: true, refundOrders: true, registration: true },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.CANCEL, resource: 'payment-order', resourceId: order.id, detail: `Cancelled ${order.orderNo}` },
    })

    return item!
  })
}

export async function requestRefund(orderId: string, input: { amount?: number; reason: string }, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new Error('Payment order not found')
    }

    assertCanRefundOrder(order.status)

    const existingRefunds = await tx.refundOrder.findMany({ where: { paymentOrderId: order.id } })
    if (existingRefunds.some((refund) => refund.status === RefundStatus.REQUESTED || refund.status === RefundStatus.SUCCESS)) {
      throw new Error('Payment order already has an active refund')
    }

    const amount = input.amount ?? Number(order.amount)
    if (amount !== Number(order.amount)) {
      throw new Error('Only full refunds are supported')
    }

    const claimed = await tx.paymentOrder.updateMany({
      where: { id: order.id, status: PaymentStatus.PAID, refundLockedAt: null },
      data: { refundLockedAt: new Date() },
    })

    if (claimed.count !== 1) {
      throw new Error('Payment order already has an active refund')
    }

    const item = await tx.refundOrder.create({
      data: {
        paymentOrderId: order.id,
        refundNo: createMockTransactionNo('REF'),
        amount,
        reason: input.reason,
        requestedById: userId,
      },
      include: { paymentOrder: true, transactions: true },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.CREATE, resource: 'refund-order', resourceId: item.id, detail: `Requested refund for ${order.orderNo}` },
    })

    return item
  })
}

export async function executeRefund(refundId: string, userId?: string, provider: PaymentProvider = defaultProvider) {
  const item = await prisma.$transaction(async (tx) => {
    const refund = await tx.refundOrder.findUnique({ where: { id: refundId }, include: { paymentOrder: true } })
    if (!refund) {
      throw new Error('Refund order not found')
    }

    const claimed = await tx.refundOrder.updateMany({
      where: { id: refund.id, status: RefundStatus.REQUESTED },
      data: { status: RefundStatus.SUCCESS, executedAt: new Date() },
    })

    if (claimed.count !== 1) {
      throw new Error('Only requested refunds can be executed')
    }

    const result = await provider.refund({ refundNo: refund.refundNo, amount: refund.amount.toString(), reason: refund.reason })

    await tx.refundTransaction.create({
      data: {
        refundOrderId: refund.id,
        transactionNo: createMockTransactionNo('RFT'),
        providerRefundNo: result.providerRefundNo,
        amount: refund.amount,
        status: result.status,
        raw: result.raw as Prisma.InputJsonValue,
      },
    })

    const item = await tx.refundOrder.findUnique({
      where: { id: refund.id },
      include: { paymentOrder: { include: { insuranceSettlements: true } }, transactions: true },
    })

    await tx.paymentOrder.update({
      where: { id: refund.paymentOrderId },
      data: { status: PaymentStatus.REFUNDED, refundedAt: new Date(), refundLockedAt: null },
    })

    await tx.auditLog.create({
      data: { userId, action: AuditAction.UPDATE, resource: 'refund-order', resourceId: refund.id, detail: `Executed refund ${refund.refundNo}` },
    })

    return item!
  })

  const settledInsurance = item.paymentOrder.insuranceSettlements.filter((settlement) => settlement.status === 'SETTLED')
  for (const settlement of settledInsurance) {
    try {
      await offsetRefund(settlement.id, Number(settlement.insuranceAmount))
    } catch {
      // The refund has already been committed; offsetRefund logs provider failures for operations follow-up.
    }
  }

  return item
}
