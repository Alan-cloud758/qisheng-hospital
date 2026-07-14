import { describe, expect, it } from 'vitest'
import { optionalNumber } from './lab-workbench'

describe('lab workbench helpers', () => {
  it('does not convert blank optional numbers to zero', () => {
    expect(optionalNumber(null)).toBeUndefined()
    expect(optionalNumber('')).toBeUndefined()
    expect(optionalNumber(undefined)).toBeUndefined()
    expect(optionalNumber('6.5')).toBe(6.5)
  })
})
