import { describe, expect, it } from 'vitest'
import { parseDateRange, parsePagination } from './pagination'

describe('pagination helpers', () => {
  it('normalizes page and pageSize safely', () => {
    expect(parsePagination({ page: '2', pageSize: '20' })).toEqual({ page: 2, pageSize: 20, skip: 20, take: 20 })
    expect(parsePagination({ page: '-1', pageSize: '999' })).toEqual({ page: 1, pageSize: 100, skip: 0, take: 100 })
  })

  it('parses optional date ranges', () => {
    const range = parseDateRange({ startDate: '2026-07-01', endDate: '2026-07-14' })
    expect(range.gte?.toISOString().slice(0, 10)).toBe('2026-07-01')
    expect(range.lte?.toISOString().slice(0, 10)).toBe('2026-07-14')
  })
})
