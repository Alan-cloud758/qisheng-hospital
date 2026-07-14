import { describe, expect, it } from 'vitest'
import { findDuplicateDrugIds, validatePrescriptionDraft } from './clinical-quality'

describe('clinical quality helpers', () => {
  it('detects duplicate prescription drugs', () => {
    expect(findDuplicateDrugIds([{ drugId: 'a' }, { drugId: 'b' }, { drugId: 'a' }])).toEqual(['a'])
  })

  it('rejects empty prescription quantity and usage fields', () => {
    expect(() => validatePrescriptionDraft([{ drugId: 'drug-1', quantity: 0, dosage: '', usage: '' }])).toThrow(
      'Prescription item quantity, dosage, and usage are required',
    )
  })

  it('rejects empty prescription drafts', () => {
    expect(() => validatePrescriptionDraft([])).toThrow('Prescription item quantity, dosage, and usage are required')
  })
})
