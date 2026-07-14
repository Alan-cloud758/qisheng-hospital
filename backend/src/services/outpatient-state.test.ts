import { describe, expect, it } from 'vitest'
import {
  assertCanCancelRegistration,
  assertCanCheckInRegistration,
  assertCanCompleteEncounter,
  assertCanDispensePrescription,
  assertCanPayOrder,
  assertCanReviewPrescription,
  assertCanStartEncounter,
} from './outpatient-state'

describe('outpatient state transitions', () => {
  it('allows legal outpatient transitions and rejects illegal ones', () => {
    expect(() => assertCanCancelRegistration('BOOKED')).not.toThrow()
    expect(() => assertCanCheckInRegistration('BOOKED')).not.toThrow()
    expect(() => assertCanStartEncounter('CHECKED_IN')).not.toThrow()
    expect(() => assertCanCompleteEncounter('OPEN')).not.toThrow()
    expect(() => assertCanPayOrder('PENDING')).not.toThrow()
    expect(() => assertCanReviewPrescription('SUBMITTED')).not.toThrow()
    expect(() => assertCanDispensePrescription('REVIEWED')).not.toThrow()

    expect(() => assertCanCancelRegistration('COMPLETED')).toThrow('Only booked registrations can be cancelled')
  })
})
