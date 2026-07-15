import { describe, expect, it } from 'vitest'
import { hisExpansionSeedPlan } from './seed'

describe('HIS expansion seed plan', () => {
  it('contains demo data for every expansion phase', () => {
    expect(hisExpansionSeedPlan.adminResources.departments.length).toBeGreaterThanOrEqual(16)
    expect(hisExpansionSeedPlan.scheduleTemplates.length).toBeGreaterThanOrEqual(6)
    expect(hisExpansionSeedPlan.stockBatches.length).toBeGreaterThanOrEqual(30)
    expect(hisExpansionSeedPlan.clinicalTemplates.length).toBeGreaterThanOrEqual(12)
    expect(hisExpansionSeedPlan.notifications.length).toBeGreaterThanOrEqual(10)
    expect(hisExpansionSeedPlan.wards.length).toBeGreaterThanOrEqual(4)
    expect(hisExpansionSeedPlan.insuranceProfiles.length).toBeGreaterThanOrEqual(10)
    expect(hisExpansionSeedPlan.labItems.length).toBeGreaterThanOrEqual(20)
    expect(hisExpansionSeedPlan.imagingItems.length).toBeGreaterThanOrEqual(12)
    expect(hisExpansionSeedPlan.stockMovements.length).toBeGreaterThanOrEqual(10)
    expect(hisExpansionSeedPlan.stockAlerts.length).toBeGreaterThanOrEqual(5)
    expect(hisExpansionSeedPlan.paymentTransactions.length).toBeGreaterThanOrEqual(5)
    expect(hisExpansionSeedPlan.refundOrders.length).toBeGreaterThanOrEqual(3)
    expect(hisExpansionSeedPlan.providerLogs.insurance.length).toBeGreaterThanOrEqual(5)
    expect(hisExpansionSeedPlan.providerLogs.lab.length).toBeGreaterThanOrEqual(5)
    expect(hisExpansionSeedPlan.providerLogs.pacs.length).toBeGreaterThanOrEqual(5)
  })
})
