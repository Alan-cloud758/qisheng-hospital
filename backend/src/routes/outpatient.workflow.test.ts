import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('outpatient workflow routes', () => {
  it('requires auth for admin check-in', async () => {
    const response = await request(createApp()).post('/api/admin/registrations/reg-demo/check-in')
    expect(response.status).toBe(401)
  })

  it('requires auth for cashier payment', async () => {
    const response = await request(createApp()).post('/api/staff/cashier/payment-orders/pay-demo/pay')
    expect(response.status).toBe(401)
  })

  it('requires auth for pharmacy review', async () => {
    const response = await request(createApp()).post('/api/staff/pharmacy/prescriptions/rx-demo/review')
    expect(response.status).toBe(401)
  })
})
