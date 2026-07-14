import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LabReportStatus, LabRequestStatus, LabSampleStatus } from '../generated/prisma/enums'

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    labSample: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    labRequest: { update: vi.fn(), updateMany: vi.fn() },
    labReport: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    labResult: { deleteMany: vi.fn(), createMany: vi.fn() },
  },
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}))

import { abnormalFlag, assertCanPublishLabReport, nextLabBarcode, recordLabResults, rejectSample } from './lab'

describe('lab workflow rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.labSample.update.mockImplementation(async (input) => ({ id: input.where.id, ...input.data }))
    mockTx.labReport.update.mockImplementation(async (input) => ({ id: input.where.id, ...input.data }))
    mockTx.labReport.updateMany.mockResolvedValue({ count: 1 })
    mockTx.labRequest.updateMany.mockResolvedValue({ count: 1 })
    mockTx.labSample.updateMany.mockResolvedValue({ count: 1 })
  })

  it('marks abnormal results outside reference range', () => {
    expect(abnormalFlag(12, 4, 10)).toBe('HIGH')
    expect(abnormalFlag(2, 4, 10)).toBe('LOW')
    expect(abnormalFlag(6, 4, 10)).toBe('NORMAL')
  })

  it('allows publishing only reviewed reports', () => {
    expect(() => assertCanPublishLabReport('REVIEWED')).not.toThrow()
    expect(() => assertCanPublishLabReport('DRAFT')).toThrow('Only reviewed lab reports can be published')
  })

  it('generates lab barcode prefix', () => {
    expect(nextLabBarcode(new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^LAB20260714/)
  })

  it('rejects samples only before the request is resulted', async () => {
    mockTx.labSample.findUnique.mockResolvedValue({
      id: 'sample-1',
      requestId: 'request-1',
      status: LabSampleStatus.RECEIVED,
      request: { status: LabRequestStatus.REVIEWED },
    })

    await expect(rejectSample('sample-1', 'bad sample')).rejects.toThrow('Only collected or received samples before result can be rejected')
    expect(mockTx.labSample.update).not.toHaveBeenCalled()
  })

  it('claims sample rejection before moving request to rejected', async () => {
    mockTx.labSample.findUnique.mockResolvedValue({
      id: 'sample-1',
      requestId: 'request-1',
      status: LabSampleStatus.RECEIVED,
      request: { status: LabRequestStatus.SAMPLE_RECEIVED, report: { status: LabReportStatus.DRAFT } },
    })
    mockTx.labSample.updateMany.mockResolvedValue({ count: 0 })

    await expect(rejectSample('sample-1', 'bad sample')).rejects.toThrow('Lab sample status changed, please retry')
    expect(mockTx.labRequest.update).not.toHaveBeenCalled()
  })

  it('claims result recording before replacing results', async () => {
    mockTx.labReport.findUnique.mockResolvedValue({
      id: 'report-1',
      requestId: 'request-1',
      status: LabReportStatus.RESULTED,
      request: { id: 'request-1', status: LabRequestStatus.RESULTED, items: [{ itemId: 'item-1' }] },
    })
    mockTx.labReport.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      recordLabResults('report-1', {
        results: [{ itemId: 'item-1', resultValue: '6', numericValue: 6 }],
      }),
    ).rejects.toThrow('Lab report status changed, please retry')

    expect(mockTx.labResult.deleteMany).not.toHaveBeenCalled()
  })

  it('claims request status before replacing lab results', async () => {
    mockTx.labReport.findUnique.mockResolvedValue({
      id: 'report-1',
      requestId: 'request-1',
      status: LabReportStatus.DRAFT,
      request: { id: 'request-1', status: LabRequestStatus.SAMPLE_RECEIVED, items: [{ itemId: 'item-1' }] },
    })
    mockTx.labReport.updateMany.mockResolvedValue({ count: 1 })
    mockTx.labRequest.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      recordLabResults('report-1', {
        results: [{ itemId: 'item-1', resultValue: '6', numericValue: 6 }],
      }),
    ).rejects.toThrow('Lab request status changed, please retry')

    expect(mockTx.labResult.deleteMany).not.toHaveBeenCalled()
  })

  it('requires result rows to match the requested lab items exactly', async () => {
    mockTx.labReport.findUnique.mockResolvedValue({
      id: 'report-1',
      requestId: 'request-1',
      status: LabReportStatus.DRAFT,
      request: {
        id: 'request-1',
        status: LabRequestStatus.SAMPLE_RECEIVED,
        items: [{ itemId: 'item-1' }, { itemId: 'item-2' }],
      },
    })

    await expect(
      recordLabResults('report-1', {
        results: [{ itemId: 'item-1', resultValue: '6', numericValue: 6 }],
      }),
    ).rejects.toThrow('Lab results must match requested items')

    await expect(
      recordLabResults('report-1', {
        results: [
          { itemId: 'item-1', resultValue: '6', numericValue: 6 },
          { itemId: 'item-3', resultValue: '8', numericValue: 8 },
        ],
      }),
    ).rejects.toThrow('Lab results must match requested items')
  })
})
