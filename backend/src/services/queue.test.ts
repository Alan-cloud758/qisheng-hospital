import { describe, expect, it } from 'vitest'
import { assertCanEnterQueue, assertTicketBelongsToDoctor, estimateWaitMinutes, nextQueueNumber } from './queue'

describe('queue rules', () => {
  it('assigns next queue number', () => {
    expect(nextQueueNumber([{ queueNo: 1 }, { queueNo: 2 }])).toBe(3)
  })

  it('estimates wait time', () => {
    expect(estimateWaitMinutes(4, 8)).toBe(32)
  })

  it('allows queue only after check-in', () => {
    expect(() => assertCanEnterQueue('CHECKED_IN')).not.toThrow()
    expect(() => assertCanEnterQueue('BOOKED')).toThrow('Only checked-in registrations can enter queue')
  })

  it('rejects queue ticket operations for another doctor', () => {
    expect(() => assertTicketBelongsToDoctor({ doctorId: 'doctor-a' }, 'doctor-b')).toThrow('Queue ticket does not belong to current doctor')
  })
})
