import { describe, expect, it } from 'vitest'
import { parseDashboardDate } from './admin'

describe('admin dashboard filters', () => {
  it('parses date-only dashboard ranges as local full days', () => {
    const startDate = parseDashboardDate('2026-07-14')
    const endDate = parseDashboardDate('2026-07-14', true)

    expect(startDate?.getFullYear()).toBe(2026)
    expect(startDate?.getMonth()).toBe(6)
    expect(startDate?.getDate()).toBe(14)
    expect(startDate?.getHours()).toBe(0)
    expect(startDate?.getMinutes()).toBe(0)
    expect(endDate?.getHours()).toBe(23)
    expect(endDate?.getMinutes()).toBe(59)
    expect(endDate?.getSeconds()).toBe(59)
  })
})
