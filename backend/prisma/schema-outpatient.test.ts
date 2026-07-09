import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const schema = readFileSync('prisma/schema.prisma', 'utf8')

describe('outpatient schema expansion', () => {
  it('defines outpatient status and billing support models', () => {
    expect(schema).toContain('enum EncounterStatus')
    expect(schema).toContain('model MedicalOrder')
    expect(schema).toContain('model PaymentOrderItem')
    expect(schema).toContain('model DictionaryCategory')
    expect(schema).toContain('model DictionaryItem')
  })
})
