import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { createToken } from '../middleware/auth'

function adminToken() {
  return createToken({ id: 'test-admin', username: 'admin', displayName: 'Test Admin', roles: ['ADMIN'] })
}

function nurseToken() {
  return createToken({ id: 'test-nurse', username: 'nurse', displayName: 'Test Nurse', roles: ['NURSE'] })
}

describe('nurse routes', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(createApp()).get('/api/staff/nurse/admissions')
    expect(response.status).toBe(401)
  })

  it('rejects non-nurse roles', async () => {
    const doctorToken = createToken({ id: 'test-doc', username: 'doc', displayName: 'Test Doc', roles: ['DOCTOR'] })
    const response = await request(createApp())
      .get('/api/staff/nurse/admissions')
      .set('Authorization', `Bearer ${doctorToken}`)
    expect(response.status).toBe(403)
  })

  it('allows ADMIN to list admissions', async () => {
    const response = await request(createApp())
      .get('/api/staff/nurse/admissions')
      .set('Authorization', `Bearer ${adminToken()}`)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('items')
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it('allows NURSE to list beds', async () => {
    const response = await request(createApp())
      .get('/api/staff/nurse/beds')
      .set('Authorization', `Bearer ${nurseToken()}`)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('items')
  })

  it('rejects admission creation with missing fields', async () => {
    const response = await request(createApp())
      .post('/api/staff/nurse/admissions')
      .set('Authorization', `Bearer ${nurseToken()}`)
      .send({})
    expect(response.status).toBe(400)
  })
})
