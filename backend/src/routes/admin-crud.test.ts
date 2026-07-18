import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { verifyPassword } from '../lib/password'
import { createToken } from '../middleware/auth'
import { hashAccountPassword, toWritableData, type AdminResourceConfig } from '../services/admin-crud'

describe('admin operability routes', () => {
  it('requires auth for paginated department management', async () => {
    const response = await request(createApp()).get('/api/admin/departments?page=1&pageSize=10')

    expect(response.status).toBe(401)
  })

  it('requires auth for department create', async () => {
    const response = await request(createApp()).post('/api/admin/departments').send({ name: '测试科室', code: 'TEST' })

    expect(response.status).toBe(401)
  })

  it('hashes account password without persisting the plain password field', async () => {
    const config = {
      writableFields: ['username', 'password'],
      beforeWrite: hashAccountPassword,
    } as AdminResourceConfig

    const data = await toWritableData(config, { username: 'operator', password: 'secret123' }, 'create')

    expect(data.username).toBe('operator')
    expect(data.password).toBeUndefined()
    expect(typeof data.passwordHash).toBe('string')
    expect(await verifyPassword('secret123', String(data.passwordHash))).toBe(true)
  })

  it('does not overwrite account password when update omits password', async () => {
    const config = {
      writableFields: ['displayName', 'password'],
      beforeWrite: hashAccountPassword,
    } as AdminResourceConfig

    const data = await toWritableData(config, { displayName: '运营员' }, 'update')

    expect(data).toEqual({ displayName: '运营员' })
  })
})

describe('admin account resource route internals', () => {
  it('queries accounts with an explicit select that excludes passwordHash', async () => {
    const prisma = await import('../lib/prisma')
    const findMany = vi.spyOn(prisma.prisma.user, 'findMany').mockResolvedValueOnce([])
    const count = vi.spyOn(prisma.prisma.user, 'count').mockResolvedValueOnce(0)
    const token = createToken({ id: 'admin-user', username: 'admin', displayName: '管理员', roles: ['ADMIN'] })

    const response = await request(createApp()).get('/api/admin/accounts?page=1&pageSize=10').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ passwordHash: expect.anything() }),
      }),
    )

    findMany.mockRestore()
    count.mockRestore()
  })
})
