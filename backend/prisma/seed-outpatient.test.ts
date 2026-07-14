import { describe, expect, it } from 'vitest'
import { outpatientSeedPlan } from './seed'

describe('outpatient seed plan', () => {
  it('contains enough sample records for full outpatient demos', () => {
    expect(outpatientSeedPlan.campuses.length).toBeGreaterThanOrEqual(2)
    expect(outpatientSeedPlan.departments.length).toBeGreaterThanOrEqual(12)
    expect(outpatientSeedPlan.doctors.length).toBeGreaterThanOrEqual(20)
    expect(outpatientSeedPlan.patientUsers.length).toBeGreaterThanOrEqual(15)
    expect(outpatientSeedPlan.drugs.length).toBeGreaterThanOrEqual(30)
    expect(outpatientSeedPlan.feeItems.length).toBeGreaterThanOrEqual(15)
    expect(outpatientSeedPlan.announcements.length).toBeGreaterThanOrEqual(10)
    expect(outpatientSeedPlan.dictionaryCategories.length).toBeGreaterThanOrEqual(5)
  })
})
