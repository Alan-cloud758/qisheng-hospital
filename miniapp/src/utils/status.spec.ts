import { describe, expect, it } from 'vitest'
import { prescriptionStatusText, registrationStatusText } from './status'

describe('patient status labels', () => {
  it('maps registration and prescription statuses', () => {
    expect(registrationStatusText('CHECKED_IN')).toBe('已签到')
    expect(prescriptionStatusText('DISPENSED')).toBe('已发药')
  })
})
