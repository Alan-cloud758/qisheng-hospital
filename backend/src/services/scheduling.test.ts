import { describe, expect, it } from 'vitest'
import { assertCanReschedule, assertCanUseLockedSlot, computeSlotLockExpiry } from './scheduling'

describe('scheduling rules', () => {
  it('allows reschedule only before check-in', () => {
    expect(() => assertCanReschedule('BOOKED')).not.toThrow()
    expect(() => assertCanReschedule('CHECKED_IN')).toThrow('Only booked registrations can be rescheduled')
    expect(() => assertCanReschedule('COMPLETED')).toThrow('Only booked registrations can be rescheduled')
  })

  it('computes lock expiry from current time', () => {
    const now = new Date('2026-07-14T10:00:00.000Z')
    expect(computeSlotLockExpiry(now, 10).toISOString()).toBe('2026-07-14T10:10:00.000Z')
  })

  it('rejects expired slot locks', () => {
    expect(() => assertCanUseLockedSlot(new Date('2026-07-14T10:00:00.000Z'), new Date('2026-07-14T10:01:00.000Z'))).not.toThrow()
    expect(() => assertCanUseLockedSlot(new Date('2026-07-14T10:00:00.000Z'), new Date('2026-07-14T09:59:00.000Z'))).toThrow('Slot lock has expired')
  })
})
