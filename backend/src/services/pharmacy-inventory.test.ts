import { describe, expect, it } from 'vitest'
import { assertBatchCanDispense, assertHasDispenseMovements, chooseDispenseBatches, sumDispensableQuantity } from './pharmacy-inventory'

describe('pharmacy inventory rules', () => {
  it('uses earliest valid expiry batches first', () => {
    const batches = chooseDispenseBatches(
      [
        { id: 'late', quantity: 10, expiresAt: new Date('2027-01-01') },
        { id: 'early', quantity: 5, expiresAt: new Date('2026-08-01') },
      ],
      7,
      new Date('2026-07-14'),
    )

    expect(batches).toEqual([
      { batchId: 'early', quantity: 5 },
      { batchId: 'late', quantity: 2 },
    ])
  })

  it('rejects expired batches', () => {
    expect(() => assertBatchCanDispense(new Date('2026-07-01'), new Date('2026-07-14'))).toThrow(
      'Expired stock batch cannot be dispensed',
    )
  })

  it('excludes expired batches from available stock totals', () => {
    expect(
      sumDispensableQuantity(
        [
          { id: 'expired', quantity: 10, expiresAt: new Date('2026-07-01') },
          { id: 'usable', quantity: 3, expiresAt: new Date('2026-08-01') },
        ],
        new Date('2026-07-14'),
      ),
    ).toBe(3)
  })

  it('rejects returning a prescription without dispense movements', () => {
    expect(() => assertHasDispenseMovements([])).toThrow('Prescription has no dispensed stock movements')
  })
})
