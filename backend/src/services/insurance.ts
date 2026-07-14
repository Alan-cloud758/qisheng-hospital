import { InsuranceCategory, InsuranceSettlementSource, InsuranceStatus, PaymentStatus } from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { MockInsuranceProvider, type InsuranceProvider } from '../providers/insurance-provider'

const defaultProvider = new MockInsuranceProvider()

class InsuranceProviderCallError extends Error {
  action: string
  request: Record<string, unknown>
  response: Record<string, unknown>
  settlementId?: string
  originalError: unknown

  constructor(error: unknown, input: { action: string; request: Record<string, unknown>; settlementId?: string }) {
    super(error instanceof Error ? error.message : String(error))
    this.name = 'InsuranceProviderCallError'
    this.action = input.action
    this.request = input.request
    this.response = providerErrorResponse(error)
    this.settlementId = input.settlementId
    this.originalError = error
  }
}

export function calculateInsuranceSplit(input: { amount: number; category: string; ratio: number; selfPayFirstRatio: number }) {
  const ratio = clampRatio(input.ratio)
  const selfPayFirstRatio = clampRatio(input.selfPayFirstRatio)
  if (input.category === InsuranceCategory.C) {
    return { insuranceAmount: 0, selfPayAmount: roundMoney(input.amount) }
  }

  const selfPayFirst = input.category === InsuranceCategory.B ? input.amount * selfPayFirstRatio : 0
  const coveredBase = Math.max(input.amount - selfPayFirst, 0)
  const insuranceAmount = roundMoney(coveredBase * ratio)
  return { insuranceAmount, selfPayAmount: roundMoney(input.amount - insuranceAmount) }
}

export function assertCanReverseSettlement(status: string) {
  if (status !== InsuranceStatus.SETTLED) {
    throw new Error('Only settled insurance records can be reversed')
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function clampRatio(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 1)
}

function nextSettlementNo(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `INS${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

function sourceForOrder(order: { businessType: string }) {
  return order.businessType === 'INPATIENT' ? InsuranceSettlementSource.INPATIENT : InsuranceSettlementSource.OUTPATIENT
}

async function logProvider(
  tx: Prisma.TransactionClient,
  input: { settlementId?: string; action: string; request: Record<string, unknown>; response: Record<string, unknown>; success?: boolean },
) {
  await tx.insuranceProviderLog.create({
    data: {
      settlementId: input.settlementId,
      action: input.action,
      request: input.request as Prisma.InputJsonValue,
      response: input.response as Prisma.InputJsonValue,
      success: input.success ?? true,
    },
  })
}

async function logProviderFailure(error: InsuranceProviderCallError) {
  await prisma.insuranceProviderLog.create({
    data: {
      settlementId: error.settlementId,
      action: error.action,
      request: error.request as Prisma.InputJsonValue,
      response: error.response as Prisma.InputJsonValue,
      success: false,
    },
  })
}

async function insuranceTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
  try {
    return await prisma.$transaction(callback)
  } catch (error) {
    if (error instanceof InsuranceProviderCallError) {
      await logProviderFailure(error)
      throw error.originalError
    }
    throw error
  }
}

async function buildSettlementItems(
  tx: Prisma.TransactionClient,
  order: { title: string; amount: Prisma.Decimal | number | string; items: Array<{ itemName: string; amount: Prisma.Decimal | number | string; itemType: string }> },
  profile: { reimbursementRatio: Prisma.Decimal | number | string; selfPayFirstRatio: Prisma.Decimal | number | string },
) {
  const mappings = await tx.insuranceCatalogMapping.findMany({ where: { isActive: true } })
  const mappingByCode = new Map(mappings.map((mapping) => [mapping.feeItemCode, mapping]))
  const sourceItems = order.items.length
    ? order.items
    : [{ itemName: order.title, amount: order.amount, itemType: 'REGISTRATION' }]
  return sourceItems.map((item) => {
    const mapping = mappingByCode.get(item.itemName) ?? mappingByCode.get(item.itemType)
    const category = mapping?.category ?? InsuranceCategory.B
    const split = calculateInsuranceSplit({
      amount: Number(item.amount),
      category,
      ratio: Number(mapping?.reimbursementRatio ?? profile.reimbursementRatio),
      selfPayFirstRatio: Number(mapping?.selfPayFirstRatio ?? profile.selfPayFirstRatio),
    })
    return {
      mappingId: mapping?.id,
      itemName: item.itemName,
      category,
      amount: Number(item.amount),
      insuranceAmount: split.insuranceAmount,
      selfPayAmount: split.selfPayAmount,
    }
  })
}

async function loadOrderForInsurance(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.paymentOrder.findUnique({ where: { id: orderId }, include: { items: true, user: { include: { insuranceProfiles: true } } } })
  if (!order) {
    throw new Error('Payment order not found')
  }
  if (order.status !== PaymentStatus.PENDING) {
    throw new Error('Only pending payment orders can use insurance settlement')
  }
  const profile = [...order.user.insuranceProfiles].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()).find((item) => item.isActive)
  if (!profile) {
    throw new Error('Active insurance profile not found')
  }
  return { order, profile }
}

async function createSettlement(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: InsuranceStatus,
  provider: InsuranceProvider,
) {
  const { order, profile } = await loadOrderForInsurance(tx, orderId)
  const existing = await tx.insuranceSettlement.findFirst({
    where: { paymentOrderId: order.id, status: { in: [InsuranceStatus.PRE_SETTLED, InsuranceStatus.SETTLED] } },
    include: { items: true, profile: true, paymentOrder: true },
  })
  if (existing) {
    return existing
  }

  const items = await buildSettlementItems(tx, order, profile)
  const totalAmount = roundMoney(items.reduce((sum, item) => sum + item.amount, 0))
  const insuranceAmount = roundMoney(items.reduce((sum, item) => sum + item.insuranceAmount, 0))
  const selfPayAmount = roundMoney(totalAmount - insuranceAmount)
  const settlementNo = nextSettlementNo()
  const activeKey = order.id
  const payload = { settlementNo, totalAmount, insuranceAmount, selfPayAmount }
  const action = status === InsuranceStatus.SETTLED ? 'settle' : 'preSettle'

  let settlement: Awaited<ReturnType<typeof tx.insuranceSettlement.create>>
  try {
    settlement = await tx.insuranceSettlement.create({
      data: {
        settlementNo,
        paymentOrderId: order.id,
        profileId: profile.id,
        source: sourceForOrder(order),
        status,
        activeKey,
        totalAmount,
        insuranceAmount,
        selfPayAmount,
        items: { create: items },
      },
      include: { items: true, profile: true, paymentOrder: true },
    })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      const active = await tx.insuranceSettlement.findFirst({
        where: { paymentOrderId: order.id, status: { in: [InsuranceStatus.PRE_SETTLED, InsuranceStatus.SETTLED] } },
        include: { items: true, profile: true, paymentOrder: true },
      })
      if (active) return active
    }
    throw error
  }

  let result: Awaited<ReturnType<InsuranceProvider['preSettle']>>
  try {
    result = status === InsuranceStatus.SETTLED ? await provider.settle(payload) : await provider.preSettle(payload)
  } catch (error) {
    throw new InsuranceProviderCallError(error, { action, request: payload })
  }

  const item = await tx.insuranceSettlement.update({
    where: { id: settlement.id },
    data: { providerTraceNo: result.traceNo },
    include: { items: true, profile: true, paymentOrder: true },
  })
  await logProvider(tx, { settlementId: item.id, action, request: payload, response: result.raw })
  return item
}

function providerErrorResponse(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { message: error.message, name: error.name }
  }
  return { message: String(error) }
}

export async function preSettleOrder(orderId: string, provider: InsuranceProvider = defaultProvider) {
  return insuranceTransaction((tx) => createSettlement(tx, orderId, InsuranceStatus.PRE_SETTLED, provider))
}

export async function settleOrder(orderId: string, provider: InsuranceProvider = defaultProvider) {
  return insuranceTransaction(async (tx) => {
    const existing = await tx.insuranceSettlement.findFirst({
      where: { paymentOrderId: orderId, status: InsuranceStatus.PRE_SETTLED },
      include: { items: true, profile: true, paymentOrder: true },
    })
    if (!existing) {
      return createSettlement(tx, orderId, InsuranceStatus.SETTLED, provider)
    }
    if (existing.paymentOrder.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payment orders can use insurance settlement')
    }

    const claimed = await tx.insuranceSettlement.updateMany({
      where: { id: existing.id, status: InsuranceStatus.PRE_SETTLED },
      data: { status: InsuranceStatus.SETTLED },
    })
    if (claimed.count !== 1) {
      throw new Error('Insurance settlement status changed, please retry')
    }
    const payload = {
      settlementNo: existing.settlementNo,
      totalAmount: Number(existing.totalAmount),
      insuranceAmount: Number(existing.insuranceAmount),
      selfPayAmount: Number(existing.selfPayAmount),
    }
    let result: Awaited<ReturnType<InsuranceProvider['settle']>>
    try {
      result = await provider.settle(payload)
    } catch (error) {
      throw new InsuranceProviderCallError(error, { settlementId: existing.id, action: 'settle', request: payload })
    }
    const item = await tx.insuranceSettlement.update({
      where: { id: existing.id },
      data: { providerTraceNo: result.traceNo },
      include: { items: true, profile: true, paymentOrder: true },
    })
    await logProvider(tx, { settlementId: item.id, action: 'settle', request: payload, response: result.raw })
    return item
  })
}

export async function reverseSettlement(settlementId: string, provider: InsuranceProvider = defaultProvider) {
  return insuranceTransaction(async (tx) => {
    const settlement = await tx.insuranceSettlement.findUnique({ where: { id: settlementId }, include: { items: true, paymentOrder: true } })
    if (!settlement) {
      throw new Error('Insurance settlement not found')
    }
    assertCanReverseSettlement(settlement.status)
    if (settlement.paymentOrder.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payment orders can reverse insurance settlement')
    }
    const request = { settlementNo: settlement.settlementNo, traceNo: settlement.providerTraceNo }
    const claimed = await tx.insuranceSettlement.updateMany({
      where: { id: settlement.id, status: InsuranceStatus.SETTLED },
      data: { status: InsuranceStatus.REVERSED, reversedAt: new Date(), activeKey: null },
    })
    if (claimed.count !== 1) {
      throw new Error('Insurance settlement status changed, please retry')
    }
    let result: Awaited<ReturnType<InsuranceProvider['reverse']>>
    try {
      result = await provider.reverse(request)
    } catch (error) {
      throw new InsuranceProviderCallError(error, { settlementId: settlement.id, action: 'reverse', request })
    }
    const item = await tx.insuranceSettlement.update({
      where: { id: settlement.id },
      data: { providerTraceNo: result.traceNo },
      include: { items: true, paymentOrder: true },
    })
    await logProvider(tx, { settlementId: item.id, action: 'reverse', request: { settlementNo: settlement.settlementNo }, response: result.raw })
    return item
  })
}

export async function offsetRefund(settlementId: string, amount: number, provider: InsuranceProvider = defaultProvider) {
  return insuranceTransaction(async (tx) => {
    const settlement = await tx.insuranceSettlement.findUnique({ where: { id: settlementId } })
    if (!settlement) {
      throw new Error('Insurance settlement not found')
    }
    const request = { settlementNo: settlement.settlementNo, amount }
    let result: Awaited<ReturnType<InsuranceProvider['refundOffset']>>
    try {
      result = await provider.refundOffset(request)
    } catch (error) {
      throw new InsuranceProviderCallError(error, { settlementId: settlement.id, action: 'refundOffset', request })
    }
    const item = await tx.insuranceSettlement.update({
      where: { id: settlement.id },
      data: { status: InsuranceStatus.REFUND_OFFSET, providerTraceNo: result.traceNo, activeKey: null },
      include: { items: true, paymentOrder: true },
    })
    await logProvider(tx, { settlementId: item.id, action: 'refundOffset', request, response: result.raw })
    return item
  })
}

export async function insuranceForOrder(orderId: string, userId?: string) {
  const order = await prisma.paymentOrder.findFirst({
    where: { id: orderId, ...(userId ? { userId } : {}) },
    include: { insuranceSettlements: { include: { items: true, profile: true }, orderBy: { createdAt: 'desc' } } },
  })
  if (!order) {
    throw new Error('Payment order not found')
  }
  return order.insuranceSettlements[0] ?? null
}
