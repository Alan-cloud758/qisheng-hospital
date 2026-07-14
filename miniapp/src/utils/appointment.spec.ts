import { describe, expect, it } from 'vitest'
import { formatAppointmentWindow, lockCountdownText } from './appointment'

describe('formatAppointmentWindow', () => {
  it('formats appointment start and end time for patient cards', () => {
    expect(formatAppointmentWindow('2026-07-10T01:00:00.000Z', '2026-07-10T01:30:00.000Z')).toContain('01:00-01:30')
  })

  it('formats slot lock countdown', () => {
    expect(lockCountdownText(new Date('2026-07-14T10:00:00.000Z'), '2026-07-14T10:10:05.000Z')).toBe('10:05')
    expect(lockCountdownText(new Date('2026-07-14T10:00:00.000Z'), '2026-07-14T09:59:00.000Z')).toBe('锁号已过期')
  })
})
