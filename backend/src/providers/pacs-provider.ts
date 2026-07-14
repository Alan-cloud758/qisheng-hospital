export interface PacsProviderResult {
  traceNo: string
  status: 'OK'
  studyUid?: string
  imageUrl?: string
  raw: Record<string, unknown>
}

export interface PacsProvider {
  createStudy(payload: { requestNo: string; itemCodes: string[]; studyUid: string; imageUrl: string }): Promise<PacsProviderResult>
  publishReport(payload: { requestNo: string; reportId: string; studyUid?: string }): Promise<PacsProviderResult>
}

function trace(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

export class MockPacsProvider implements PacsProvider {
  async createStudy(payload: { requestNo: string; itemCodes: string[]; studyUid: string; imageUrl: string }): Promise<PacsProviderResult> {
    return { traceNo: trace('PSTUDY'), status: 'OK', studyUid: payload.studyUid, imageUrl: payload.imageUrl, raw: { action: 'createStudy', payload } }
  }

  async publishReport(payload: { requestNo: string; reportId: string; studyUid?: string }): Promise<PacsProviderResult> {
    return { traceNo: trace('PPUB'), status: 'OK', raw: { action: 'publishReport', payload } }
  }
}
