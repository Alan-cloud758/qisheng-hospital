import { AuditAction } from '../generated/prisma/enums'
import { prisma } from '../lib/prisma'

export async function writeAuditLog(input: {
  userId?: string
  action: AuditAction
  resource: string
  resourceId?: string
  detail?: string
  ip?: string
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      detail: input.detail,
      ip: input.ip,
    },
  })
}
