import { describe, expect, it } from 'vitest'
import { formatAppointmentWindow } from './appointment'

describe('formatAppointmentWindow', () => {
  it('formats appointment start and end time for patient cards', () => {
    expect(formatAppointmentWindow('2026-07-10T01:00:00.000Z', '2026-07-10T01:30:00.000Z')).toContain('01:00-01:30')
  })
})
