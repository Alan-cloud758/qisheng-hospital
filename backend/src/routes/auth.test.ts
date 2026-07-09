import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('auth routes', () => {
  it('rejects invalid credentials', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      username: 'missing',
      password: 'wrong',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('用户名或密码错误')
  })

  it('requires bearer token for current user', async () => {
    const response = await request(createApp()).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('请先登录')
  })
})
