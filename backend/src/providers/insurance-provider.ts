export interface InsuranceProviderPayload {
  settlementNo: string
  totalAmount: number
  insuranceAmount: number
  selfPayAmount: number
}

export interface InsuranceProviderResult {
  traceNo: string
  status: 'OK'
  raw: Record<string, unknown>
}

export interface InsuranceProvider {
  preSettle(payload: InsuranceProviderPayload): Promise<InsuranceProviderResult>
  settle(payload: InsuranceProviderPayload): Promise<InsuranceProviderResult>
  reverse(payload: { settlementNo: string; traceNo?: string | null }): Promise<InsuranceProviderResult>
  refundOffset(payload: { settlementNo: string; amount: number }): Promise<InsuranceProviderResult>
}

function trace(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

export class MockInsuranceProvider implements InsuranceProvider {
  async preSettle(payload: InsuranceProviderPayload): Promise<InsuranceProviderResult> {
    return { traceNo: trace('IPRE'), status: 'OK', raw: { action: 'preSettle', payload } }
  }

  async settle(payload: InsuranceProviderPayload): Promise<InsuranceProviderResult> {
    return { traceNo: trace('ISET'), status: 'OK', raw: { action: 'settle', payload } }
  }

  async reverse(payload: { settlementNo: string; traceNo?: string | null }): Promise<InsuranceProviderResult> {
    return { traceNo: trace('IREV'), status: 'OK', raw: { action: 'reverse', payload } }
  }

  async refundOffset(payload: { settlementNo: string; amount: number }): Promise<InsuranceProviderResult> {
    return { traceNo: trace('IOFF'), status: 'OK', raw: { action: 'refundOffset', payload } }
  }
}
