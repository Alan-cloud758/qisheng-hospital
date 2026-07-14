import { describe, expect, it } from 'vitest'
import { parseLabResultPayload } from './lab'

describe('lab route payload parsing', () => {
  it('keeps blank optional numeric fields undefined', () => {
    const payload = parseLabResultPayload({
      results: [
        {
          itemId: 'item-1',
          resultValue: '6',
          numericValue: '',
          referenceLow: null,
          referenceHigh: '',
        },
      ],
    })

    expect(payload.results[0]).toMatchObject({
      itemId: 'item-1',
      resultValue: '6',
      numericValue: undefined,
      referenceLow: undefined,
      referenceHigh: undefined,
    })
  })
})
