import {
  assertCanCancelRegistration,
  assertCanCheckInRegistration,
  assertCanCompleteEncounter,
  assertCanDispensePrescription,
  assertCanPayOrder,
  assertCanReviewPrescription,
  assertCanStartEncounter,
} from './outpatient-state'

type EntityWithStatus = { id: string; status: string; doctorId?: string }

export interface OutpatientWorkflowRepository {
  findRegistration(id: string): Promise<EntityWithStatus | null>
  updateRegistration(id: string, data: Record<string, unknown>): Promise<unknown>
  releaseRegistrationSlot(id: string): Promise<unknown>
  findPaymentOrder(id: string): Promise<EntityWithStatus | null>
  updatePaymentOrder(id: string, data: Record<string, unknown>): Promise<unknown>
  findPrescription(id: string): Promise<EntityWithStatus | null>
  updatePrescription(id: string, data: Record<string, unknown>): Promise<unknown>
  findEncounter(id: string): Promise<EntityWithStatus | null>
  createEncounter(data: Record<string, unknown>): Promise<unknown>
  updateEncounter(id: string, data: Record<string, unknown>): Promise<unknown>
  upsertMedicalRecord(encounterId: string, data: Record<string, unknown>): Promise<unknown>
  createDiagnosis(data: Record<string, unknown>): Promise<unknown>
  createMedicalOrder(data: Record<string, unknown>): Promise<unknown>
  createPrescription(data: Record<string, unknown>): Promise<unknown>
}

function requireEntity<T>(entity: T | null, message: string): T {
  if (!entity) {
    throw new Error(message)
  }

  return entity
}

export function createOutpatientWorkflowService(repo: OutpatientWorkflowRepository) {
  return {
    async cancelRegistration(id: string) {
      const registration = requireEntity(await repo.findRegistration(id), 'Registration not found')
      assertCanCancelRegistration(registration.status)
      const result = await repo.updateRegistration(id, { status: 'CANCELLED', cancelledAt: new Date() })
      await repo.releaseRegistrationSlot(id)
      return result
    },

    async checkInRegistration(id: string) {
      const registration = requireEntity(await repo.findRegistration(id), 'Registration not found')
      assertCanCheckInRegistration(registration.status)
      return repo.updateRegistration(id, { status: 'CHECKED_IN', checkedInAt: new Date() })
    },

    async startEncounter(registrationId: string) {
      const registration = requireEntity(await repo.findRegistration(registrationId), 'Registration not found')
      assertCanStartEncounter(registration.status)
      await repo.updateRegistration(registrationId, { status: 'IN_VISIT' })
      return repo.createEncounter({
        registrationId,
        doctorId: registration.doctorId,
        status: 'OPEN',
        startedAt: new Date(),
      })
    },

    async saveRecord(encounterId: string, data: { summary: string; advice?: string }) {
      return repo.upsertMedicalRecord(encounterId, data)
    },

    async addDiagnosis(encounterId: string, data: { code?: string; name: string; note?: string }) {
      return repo.createDiagnosis({ encounterId, ...data })
    },

    async addMedicalOrder(encounterId: string, data: { type: string; content: string }) {
      return repo.createMedicalOrder({ encounterId, ...data })
    },

    async submitPrescription(encounterId: string, data: { doctorId: string; note?: string; items?: unknown[] }) {
      return repo.createPrescription({ encounterId, status: 'SUBMITTED', ...data })
    },

    async completeEncounter(id: string) {
      const encounter = requireEntity(await repo.findEncounter(id), 'Encounter not found')
      assertCanCompleteEncounter(encounter.status)
      return repo.updateEncounter(id, { status: 'COMPLETED', completedAt: new Date() })
    },

    async payOrder(id: string) {
      const order = requireEntity(await repo.findPaymentOrder(id), 'Payment order not found')
      assertCanPayOrder(order.status)
      return repo.updatePaymentOrder(id, { status: 'PAID', paidAt: new Date() })
    },

    async reviewPrescription(id: string) {
      const prescription = requireEntity(await repo.findPrescription(id), 'Prescription not found')
      assertCanReviewPrescription(prescription.status)
      return repo.updatePrescription(id, { status: 'REVIEWED' })
    },

    async dispensePrescription(id: string) {
      const prescription = requireEntity(await repo.findPrescription(id), 'Prescription not found')
      assertCanDispensePrescription(prescription.status)
      return repo.updatePrescription(id, { status: 'DISPENSED' })
    },
  }
}
