import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('mini appointment flow', () => {
  it('lists public departments', async () => {
    const response = await request(createApp()).get('/api/public/departments')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it('requires login before creating registration', async () => {
    const response = await request(createApp()).post('/api/mini/registrations').send({
      slotId: 'slot_demo',
      visitMemberId: 'member_demo',
    })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('请先登录')
  })
})
