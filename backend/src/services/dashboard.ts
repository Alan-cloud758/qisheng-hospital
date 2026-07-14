import { PaymentStatus, QueueTicketStatus, RegistrationStatus } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'
import { listStockAlerts } from './pharmacy-inventory'

export interface DashboardFilters {
  startDate?: Date
  endDate?: Date
  campusId?: string
  departmentId?: string
  doctorId?: string
}

export function calculateRate(part: number, total: number) {
  return total > 0 ? part / total : 0
}

export function netRevenue(orders: Array<{ amount: number | string | { toString(): string }; status: string }>) {
  return orders
    .filter((order) => order.status === PaymentStatus.PAID)
    .reduce((sum, order) => sum + Number(order.amount), 0)
}

function dateWhere(filters: DashboardFilters) {
  return filters.startDate || filters.endDate
    ? {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      }
    : undefined
}

function registrationWhere(filters: DashboardFilters) {
  return {
    ...(dateWhere(filters) ? { createdAt: dateWhere(filters) } : {}),
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    ...(filters.campusId ? { department: { campusId: filters.campusId } } : {}),
  }
}

function paymentRegistrationWhere(filters: DashboardFilters) {
  return {
    ...(filters.departmentId || filters.doctorId || filters.campusId
      ? {
          registration: {
            ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
            ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
            ...(filters.campusId ? { department: { campusId: filters.campusId } } : {}),
          },
        }
      : {}),
  }
}

function paymentWhere(filters: DashboardFilters) {
  return {
    ...(dateWhere(filters) ? { createdAt: dateWhere(filters) } : {}),
    ...paymentRegistrationWhere(filters),
  }
}

function paidPaymentWhere(filters: DashboardFilters) {
  return {
    ...(dateWhere(filters) ? { paidAt: dateWhere(filters) } : {}),
    ...paymentRegistrationWhere(filters),
  }
}

function queueWhere(filters: DashboardFilters) {
  return {
    ...(dateWhere(filters) ? { createdAt: dateWhere(filters) } : {}),
    ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
    ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
    ...(filters.campusId ? { department: { campusId: filters.campusId } } : {}),
  }
}

export async function getOverviewDashboard(filters: DashboardFilters = {}) {
  const where = registrationWhere(filters)
  const [registrationCount, completedCount, pendingPaymentCount, paidOrders, queueWaiting] = await Promise.all([
    prisma.registration.count({ where }),
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.COMPLETED } }),
    prisma.paymentOrder.count({ where: { ...paymentWhere(filters), status: PaymentStatus.PENDING } }),
    prisma.paymentOrder.findMany({ where: { ...paidPaymentWhere(filters), status: PaymentStatus.PAID }, select: { amount: true, status: true } }),
    prisma.queueTicket.count({ where: { ...queueWhere(filters), status: QueueTicketStatus.WAITING } }),
  ])

  return {
    registrationCount,
    completedCount,
    completionRate: calculateRate(completedCount, registrationCount),
    pendingPaymentCount,
    netRevenue: netRevenue(paidOrders),
    queueWaiting,
  }
}

export async function getOutpatientDashboard(filters: DashboardFilters = {}) {
  const where = registrationWhere(filters)
  const [booked, checkedIn, inVisit, completed, noShow, cancelled, registrations, waitingTickets] = await Promise.all([
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.BOOKED } }),
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.CHECKED_IN } }),
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.IN_VISIT } }),
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.COMPLETED } }),
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.NO_SHOW } }),
    prisma.registration.count({ where: { ...where, status: RegistrationStatus.CANCELLED } }),
    prisma.registration.findMany({
      where,
      select: { departmentId: true, status: true, department: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.queueTicket.findMany({
      where: { ...queueWhere(filters), status: QueueTicketStatus.WAITING },
      select: { departmentId: true, department: { select: { name: true } } },
    }),
  ])
  const total = booked + checkedIn + inVisit + completed + noShow + cancelled
  const departmentGroups = new Map<
    string,
    { departmentId: string; departmentName: string; registrationCount: number; completedCount: number; waitingCount: number }
  >()

  for (const registration of registrations) {
    const item = departmentGroups.get(registration.departmentId) ?? {
      departmentId: registration.departmentId,
      departmentName: registration.department.name,
      registrationCount: 0,
      completedCount: 0,
      waitingCount: 0,
    }
    item.registrationCount++
    if (registration.status === RegistrationStatus.COMPLETED) item.completedCount++
    departmentGroups.set(registration.departmentId, item)
  }

  for (const ticket of waitingTickets) {
    const item = departmentGroups.get(ticket.departmentId) ?? {
      departmentId: ticket.departmentId,
      departmentName: ticket.department.name,
      registrationCount: 0,
      completedCount: 0,
      waitingCount: 0,
    }
    item.waitingCount++
    departmentGroups.set(ticket.departmentId, item)
  }

  const departmentLoad = [...departmentGroups.values()]
    .map((item) => ({ ...item, completionRate: calculateRate(item.completedCount, item.registrationCount) }))
    .sort((left, right) => right.registrationCount - left.registrationCount || right.waitingCount - left.waitingCount || left.departmentName.localeCompare(right.departmentName))

  return { total, booked, checkedIn, inVisit, completed, noShow, cancelled, completionRate: calculateRate(completed, total), departmentLoad }
}

export async function getRevenueDashboard(filters: DashboardFilters = {}) {
  const orders = await prisma.paymentOrder.findMany({
    where: { ...paidPaymentWhere(filters), status: PaymentStatus.PAID },
    orderBy: { paidAt: 'asc' },
    select: { amount: true, status: true, createdAt: true, paidAt: true },
  })

  const byDate = new Map<string, number>()
  for (const order of orders) {
    if (!order.paidAt) continue
    const day = formatDateKey(order.paidAt)
    byDate.set(day, (byDate.get(day) ?? 0) + Number(order.amount))
  }

  return {
    total: netRevenue(orders),
    trend: [...byDate.entries()].map(([date, amount]) => ({ date, amount })),
  }
}

export async function getPharmacyAlertsDashboard(filters: DashboardFilters = {}) {
  const alerts = await listStockAlerts()
  // Stock alerts are inventory-wide; organization filters have no model relationship to apply here.
  void filters
  return {
    scope: 'hospital-wide',
    total: alerts.length,
    critical: alerts.filter((alert) => alert.level === 'CRITICAL').length,
    items: alerts.slice(0, 20),
  }
}

export async function getQueuePressureDashboard(filters: DashboardFilters = {}) {
  const tickets = await prisma.queueTicket.findMany({
    where: {
      status: { in: [QueueTicketStatus.WAITING, QueueTicketStatus.CALLED, QueueTicketStatus.SKIPPED] },
      ...queueWhere(filters),
    },
    include: { doctor: { include: { user: true } }, department: true },
    orderBy: [{ doctorId: 'asc' }, { queueNo: 'asc' }],
  })
  const grouped = new Map<string, { doctorName: string; departmentName: string; waiting: number; called: number; skipped: number }>()

  for (const ticket of tickets) {
    const item = grouped.get(ticket.doctorId) ?? {
      doctorName: ticket.doctor.user.displayName,
      departmentName: ticket.department.name,
      waiting: 0,
      called: 0,
      skipped: 0,
    }
    if (ticket.status === QueueTicketStatus.WAITING) item.waiting++
    if (ticket.status === QueueTicketStatus.CALLED) item.called++
    if (ticket.status === QueueTicketStatus.SKIPPED) item.skipped++
    grouped.set(ticket.doctorId, item)
  }

  return { items: [...grouped.values()], totalWaiting: tickets.filter((ticket) => ticket.status === QueueTicketStatus.WAITING).length }
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
