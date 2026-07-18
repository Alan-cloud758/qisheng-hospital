import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('public routes', () => {
  it('returns department list without authentication', async () => {
    const response = await request(createApp()).get('/api/public/departments')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('items')
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it('returns announcement list without authentication', async () => {
    const response = await request(createApp()).get('/api/public/announcements')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('items')
  })

  it('returns doctor list without authentication', async () => {
    const response = await request(createApp()).get('/api/public/doctors')
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('items')
  })
})
