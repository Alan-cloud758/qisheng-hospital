import { describe, expect, it, vi } from 'vitest'
import { writeAuditLog } from './audit'
import { AuditAction } from '../generated/prisma/enums'

describe('writeAuditLog', () => {
  it('calls prisma.auditLog.create with correct data', async () => {
    const prisma = await import('../lib/prisma')
    const createSpy = vi.spyOn(prisma.prisma.auditLog, 'create').mockResolvedValueOnce({
      id: 'test-audit-1',
      userId: 'user-1',
      action: AuditAction.LOGIN,
      resource: 'User',
      resourceId: 'user-1',
      detail: 'User logged in',
      ip: '127.0.0.1',
      createdAt: new Date(),
    })

    const result = await writeAuditLog({
      userId: 'user-1',
      action: AuditAction.LOGIN,
      resource: 'User',
      resourceId: 'user-1',
      detail: 'User logged in',
      ip: '127.0.0.1',
    })

    expect(createSpy).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: AuditAction.LOGIN,
        resource: 'User',
        resourceId: 'user-1',
        detail: 'User logged in',
        ip: '127.0.0.1',
      },
    })
    expect(result.id).toBe('test-audit-1')

    createSpy.mockRestore()
  })

  it('works with minimal required fields only', async () => {
    const prisma = await import('../lib/prisma')
    const createSpy = vi.spyOn(prisma.prisma.auditLog, 'create').mockResolvedValueOnce({
      id: 'test-audit-2',
      action: AuditAction.CREATE,
      resource: 'Department',
      createdAt: new Date(),
    })

    await writeAuditLog({
      action: AuditAction.CREATE,
      resource: 'Department',
    })

    expect(createSpy).toHaveBeenCalledWith({
      data: {
        userId: undefined,
        action: AuditAction.CREATE,
        resource: 'Department',
        resourceId: undefined,
        detail: undefined,
        ip: undefined,
      },
    })

    createSpy.mockRestore()
  })
})
