import { describe, expect, it, vi } from 'vitest'
import { createOutpatientWorkflowService } from './outpatient-workflow'

function createRepo(overrides = {}) {
  return {
    findRegistration: vi.fn().mockResolvedValue({ id: 'reg-1', status: 'BOOKED', doctorId: 'doctor-1' }),
    updateRegistration: vi.fn().mockResolvedValue({ id: 'reg-1', status: 'CHECKED_IN' }),
    findPaymentOrder: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PENDING' }),
    updatePaymentOrder: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PAID' }),
    findPrescription: vi.fn().mockResolvedValue({ id: 'rx-1', status: 'SUBMITTED' }),
    updatePrescription: vi.fn().mockResolvedValue({ id: 'rx-1', status: 'REVIEWED' }),
    findEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', status: 'OPEN' }),
    createEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', status: 'OPEN' }),
    updateEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', status: 'COMPLETED' }),
    upsertMedicalRecord: vi.fn().mockResolvedValue({ id: 'record-1' }),
    createDiagnosis: vi.fn().mockResolvedValue({ id: 'diag-1' }),
    createMedicalOrder: vi.fn().mockResolvedValue({ id: 'order-1' }),
    createPrescription: vi.fn().mockResolvedValue({ id: 'rx-2', status: 'SUBMITTED' }),
    releaseRegistrationSlot: vi.fn().mockResolvedValue({ id: 'slot-1', status: 'AVAILABLE' }),
    ...overrides,
  }
}

describe('outpatient workflow service', () => {
  it('checks in booked registration', async () => {
    const repo = createRepo()
    const service = createOutpatientWorkflowService(repo)

    const result = await service.checkInRegistration('reg-1')

    expect(result.status).toBe('CHECKED_IN')
    expect(repo.updateRegistration).toHaveBeenCalledWith('reg-1', expect.objectContaining({ status: 'CHECKED_IN' }))
  })

  it('marks pending payment as paid', async () => {
    const repo = createRepo()
    const service = createOutpatientWorkflowService(repo)

    const result = await service.payOrder('pay-1')

    expect(result.status).toBe('PAID')
    expect(repo.updatePaymentOrder).toHaveBeenCalledWith('pay-1', expect.objectContaining({ status: 'PAID' }))
  })
})
