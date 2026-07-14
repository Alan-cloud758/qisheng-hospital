export interface LabProviderResult {
  traceNo: string
  status: 'OK'
  raw: Record<string, unknown>
}

export interface LabProvider {
  submitRequest(payload: { requestNo: string; itemCodes: string[] }): Promise<LabProviderResult>
  publishReport(payload: { requestNo: string; reportId: string }): Promise<LabProviderResult>
}

function trace(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

export class MockLabProvider implements LabProvider {
  async submitRequest(payload: { requestNo: string; itemCodes: string[] }): Promise<LabProviderResult> {
    return { traceNo: trace('LREQ'), status: 'OK', raw: { action: 'submitRequest', payload } }
  }

  async publishReport(payload: { requestNo: string; reportId: string }): Promise<LabProviderResult> {
    return { traceNo: trace('LPUB'), status: 'OK', raw: { action: 'publishReport', payload } }
  }
}
