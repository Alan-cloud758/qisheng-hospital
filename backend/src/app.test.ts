import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

describe('app health checks', () => {
  it('returns process health', async () => {
    const response = await request(createApp()).get('/healthz')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true, service: 'qisheng-hospital-backend' })
  })

  it('returns readiness shape', async () => {
    const response = await request(createApp()).get('/readyz')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ ok: true, database: 'configured' })
  })
})
