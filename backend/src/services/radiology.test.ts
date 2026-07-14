import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImagingAppointmentStatus, ImagingReportStatus, ImagingRequestStatus } from '../generated/prisma/enums'

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    imagingAppointment: { findUnique: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
    imagingReport: { findUnique: vi.fn(), updateMany: vi.fn() },
    imagingRequest: { update: vi.fn(), updateMany: vi.fn() },
    pacsProviderLog: { create: vi.fn() },
  },
}))

vi.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}))

import {
  assertCanPublishImagingReport,
  checkInImagingAppointment,
  mockImageUrl,
  nextStudyUid,
  publishImagingReport,
  reviewImagingReport,
} from './radiology'

describe('radiology workflow rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.imagingAppointment.updateMany.mockResolvedValue({ count: 1 })
    mockTx.imagingAppointment.findFirst.mockResolvedValue(null)
    mockTx.imagingReport.updateMany.mockResolvedValue({ count: 1 })
    mockTx.imagingRequest.update.mockResolvedValue({})
    mockTx.imagingRequest.updateMany.mockResolvedValue({ count: 1 })
    mockTx.pacsProviderLog.create.mockResolvedValue({})
  })

  it('allows publishing only reviewed imaging reports', () => {
    expect(() => assertCanPublishImagingReport('REVIEWED')).not.toThrow()
    expect(() => assertCanPublishImagingReport('DRAFT')).toThrow('Only reviewed imaging reports can be published')
  })

  it('generates deterministic mock study UID prefix', () => {
    expect(nextStudyUid(new Date('2026-07-14T00:00:00.000Z'))).toMatch(/^1\.2\.826\.0\.1\.3680043\.10\.543\.20260714/)
  })

  it('creates local mock image URL', () => {
    expect(mockImageUrl('study-1')).toBe('/mock-pacs/studies/study-1/viewer')
  })

  it('claims request status before checking in an appointment', async () => {
    mockTx.imagingAppointment.findUnique.mockResolvedValue({ id: 'appointment-1', requestId: 'request-1', status: ImagingAppointmentStatus.SCHEDULED })
    mockTx.imagingRequest.updateMany.mockResolvedValue({ count: 0 })

    await expect(checkInImagingAppointment('appointment-1')).rejects.toThrow('Imaging request status changed, please retry')
  })

  it('claims request status before reviewing a report', async () => {
    mockTx.imagingReport.findUnique.mockResolvedValue({ id: 'report-1', requestId: 'request-1', status: ImagingReportStatus.REPORTED })
    mockTx.imagingRequest.updateMany.mockResolvedValue({ count: 0 })

    await expect(reviewImagingReport('report-1')).rejects.toThrow('Imaging request status changed, please retry')
  })

  it('claims request status before publishing a report', async () => {
    mockTx.imagingReport.findUnique.mockResolvedValue({
      id: 'report-1',
      requestId: 'request-1',
      status: ImagingReportStatus.REVIEWED,
      request: { requestNo: 'PACS20260714', status: ImagingRequestStatus.REVIEWED, study: { studyUid: 'study-1' } },
    })
    mockTx.imagingRequest.updateMany.mockResolvedValue({ count: 0 })

    await expect(publishImagingReport('report-1')).rejects.toThrow('Imaging request status changed, please retry')
  })
})
