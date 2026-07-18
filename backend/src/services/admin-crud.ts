import type { NextFunction, Response, Router } from 'express'
import { AuditAction, UserStatus } from '../generated/prisma/enums'
import { hashPassword } from '../lib/password'
import { writeAuditLog } from './audit'
import { parseKeyword, parsePagination } from './pagination'
import { ServiceError } from './service-error'

export type AdminListResult<T> = {
  items: T[]
  pagination: { page: number; pageSize: number; total: number }
}

export type AdminDelegate = {
  findMany(args: Record<string, unknown>): Promise<unknown[]>
  count(args: Record<string, unknown>): Promise<number>
  create(args: Record<string, unknown>): Promise<unknown>
  update(args: Record<string, unknown>): Promise<unknown>
  findUnique?(args: Record<string, unknown>): Promise<unknown | null>
}

export type AdminResourceConfig = {
  delegate: AdminDelegate
  searchableFields: string[]
  writableFields: string[]
  include?: Record<string, unknown>
  select?: Record<string, unknown>
  orderBy?: Record<string, unknown> | Array<Record<string, unknown>>
  activeField?: 'isActive' | 'status'
  createDefaults?: Record<string, unknown>
  beforeWrite?: (data: Record<string, unknown>, body: Record<string, unknown>, mode: 'create' | 'update') => Record<string, unknown> | Promise<Record<string, unknown>>
}

export function buildContainsFilter(keyword: string | undefined, fields: string[]) {
  if (!keyword) return undefined

  return {
    OR: fields.map((field) => ({ [field]: { contains: keyword } })),
  }
}

export function toPaginationResult<T>(items: T[], total: number, page: number, pageSize: number): AdminListResult<T> {
  return { items, pagination: { page, pageSize, total } }
}

export async function hashAccountPassword(data: Record<string, unknown>, body: Record<string, unknown>, mode: 'create' | 'update') {
  const next = { ...data }
  const password = typeof body.password === 'string' ? body.password.trim() : ''

  delete next.password

  if (password) {
    next.passwordHash = await hashPassword(password)
  } else if (mode === 'create') {
    next.passwordHash = await hashPassword('Qisheng@123456')
  }

  return next
}

export async function toWritableData(config: AdminResourceConfig, body: Record<string, unknown>, mode: 'create' | 'update') {
  const data: Record<string, unknown> = mode === 'create' ? { ...config.createDefaults } : {}

  for (const field of config.writableFields) {
    if (field in body) {
      data[field] = body[field]
    }
  }

  return config.beforeWrite ? await config.beforeWrite(data, body, mode) : data
}

function queryShape(config: AdminResourceConfig) {
  return config.select ? { select: config.select } : { include: config.include }
}

function sendServiceError(error: unknown, next: NextFunction, res: Response) {
  if (error instanceof ServiceError) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }
  next(error)
}

export function registerAdminResourceRoutes(router: Router, resources: Record<string, AdminResourceConfig>) {
  for (const [resource, config] of Object.entries(resources)) {
    router.get(`/${resource}`, async (req, res, next) => {
      try {
        const { page, pageSize, skip, take } = parsePagination(req.query)
        const where = buildContainsFilter(parseKeyword(req.query), config.searchableFields)
        const [items, total] = await Promise.all([
          config.delegate.findMany({ where, ...queryShape(config), orderBy: config.orderBy, skip, take }),
          config.delegate.count({ where }),
        ])

        res.json(toPaginationResult(items, total, page, pageSize))
      } catch (error) {
        next(error)
      }
    })

    router.post(`/${resource}`, async (req, res, next) => {
      try {
        const data = await toWritableData(config, req.body ?? {}, 'create')
        const item = await config.delegate.create({ data, ...queryShape(config) })

        await writeAuditLog({
          userId: req.user?.id,
          action: AuditAction.CREATE,
          resource,
          resourceId: typeof item === 'object' && item && 'id' in item ? String(item.id) : undefined,
          detail: `Created ${resource}`,
          ip: req.ip,
        })

        res.status(201).json({ item })
      } catch (error) {
        next(error)
      }
    })

    router.put(`/${resource}/:id`, async (req, res, next) => {
      try {
        const data = await toWritableData(config, req.body ?? {}, 'update')
        const item = await config.delegate.update({ where: { id: req.params.id }, data, ...queryShape(config) })

        await writeAuditLog({
          userId: req.user?.id,
          action: AuditAction.UPDATE,
          resource,
          resourceId: req.params.id,
          detail: `Updated ${resource}`,
          ip: req.ip,
        })

        res.json({ item })
      } catch (error) {
        next(error)
      }
    })

    router.post(`/${resource}/:id/toggle-active`, async (req, res, next) => {
      try {
        if (!config.activeField || !config.delegate.findUnique) {
          throw new ServiceError('This resource does not support enable or disable', 400)
        }

        const existing = (await config.delegate.findUnique({ where: { id: req.params.id } })) as Record<string, unknown> | null
        if (!existing) {
          throw new ServiceError('Resource not found', 404)
        }

        const data =
          config.activeField === 'status'
            ? { status: existing.status === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE }
            : { isActive: !existing.isActive }

        const normalizedData = config.beforeWrite ? await config.beforeWrite(data, { ...existing, ...data }, 'update') : data
        const item = await config.delegate.update({ where: { id: req.params.id }, data: normalizedData, ...queryShape(config) })

        await writeAuditLog({
          userId: req.user?.id,
          action: AuditAction.UPDATE,
          resource,
          resourceId: req.params.id,
          detail: `Toggled ${resource}`,
          ip: req.ip,
        })

        res.json({ item })
      } catch (error) {
        sendServiceError(error, next, res)
      }
    })
  }
}
