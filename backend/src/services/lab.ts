import { InsuranceSettlementSource, LabReportStatus, LabRequestStatus, LabSampleStatus } from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { MockLabProvider, type LabProvider } from '../providers/lab-provider'

const defaultProvider = new MockLabProvider()

export function abnormalFlag(value: number, low?: number | null, high?: number | null) {
  if (typeof high === 'number' && value > high) return 'HIGH'
  if (typeof low === 'number' && value < low) return 'LOW'
  return 'NORMAL'
}

export function assertCanPublishLabReport(status: string) {
  if (status !== LabReportStatus.REVIEWED) {
    throw new Error('Only reviewed lab reports can be published')
  }
}

export function nextLabBarcode(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `LAB${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

function nextLabRequestNo(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `LIS${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

async function logProvider(
  tx: Prisma.TransactionClient,
  input: { requestId?: string; action: string; request: Record<string, unknown>; response: Record<string, unknown>; success?: boolean },
) {
  await tx.labProviderLog.create({
    data: {
      requestId: input.requestId,
      action: input.action,
      request: input.request as Prisma.InputJsonValue,
      response: input.response as Prisma.InputJsonValue,
      success: input.success ?? true,
    },
  })
}

export async function createLabRequestForEncounter(
  encounterId: string,
  input: { itemIds: string[]; clinicalNote?: string },
  doctorId?: string,
  provider: LabProvider = defaultProvider,
) {
  return prisma.$transaction(async (tx) => {
    const encounter = await tx.encounter.findUnique({ where: { id: encounterId }, include: { registration: true } })
    if (!encounter) {
      throw new Error('Encounter not found')
    }
    const items = await tx.labTestItem.findMany({ where: { id: { in: input.itemIds }, isActive: true } })
    if (items.length === 0) {
      throw new Error('Lab items are required')
    }
    const requestNo = nextLabRequestNo()
    const item = await tx.labRequest.create({
      data: {
        requestNo,
        userId: encounter.registration.userId,
        visitMemberId: encounter.registration.visitMemberId,
        doctorId: doctorId ?? encounter.doctorId,
        encounterId: encounter.id,
        source: InsuranceSettlementSource.OUTPATIENT,
        clinicalNote: input.clinicalNote,
        items: { create: items.map((row) => ({ itemId: row.id })) },
        report: { create: { status: LabReportStatus.DRAFT } },
      },
      include: labRequestInclude(),
    })
    const result = await provider.submitRequest({ requestNo, itemCodes: items.map((row) => row.code) })
    await logProvider(tx, { requestId: item.id, action: 'submitRequest', request: { requestNo, itemIds: input.itemIds }, response: result.raw })
    return item
  })
}

export async function createLabRequestForInpatient(
  admissionId: string,
  input: { itemIds: string[]; clinicalNote?: string; doctorId?: string },
  provider: LabProvider = defaultProvider,
) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.inpatientAdmission.findUnique({ where: { id: admissionId } })
    if (!admission) {
      throw new Error('Inpatient admission not found')
    }
    const items = await tx.labTestItem.findMany({ where: { id: { in: input.itemIds }, isActive: true } })
    if (items.length === 0) {
      throw new Error('Lab items are required')
    }
    const requestNo = nextLabRequestNo()
    const item = await tx.labRequest.create({
      data: {
        requestNo,
        userId: admission.userId,
        visitMemberId: admission.visitMemberId,
        doctorId: input.doctorId ?? admission.attendingDoctorId,
        admissionId: admission.id,
        source: InsuranceSettlementSource.INPATIENT,
        clinicalNote: input.clinicalNote,
        items: { create: items.map((row) => ({ itemId: row.id })) },
        report: { create: { status: LabReportStatus.DRAFT } },
      },
      include: labRequestInclude(),
    })
    const result = await provider.submitRequest({ requestNo, itemCodes: items.map((row) => row.code) })
    await logProvider(tx, { requestId: item.id, action: 'submitRequest', request: { requestNo, itemIds: input.itemIds }, response: result.raw })
    return item
  })
}

export async function collectSample(requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.labRequest.findUnique({ where: { id: requestId } })
    if (!request) {
      throw new Error('Lab request not found')
    }
    const claimed = await tx.labRequest.updateMany({
      where: { id: request.id, status: LabRequestStatus.REQUESTED },
      data: { status: LabRequestStatus.SAMPLE_COLLECTED },
    })
    if (claimed.count !== 1) {
      throw new Error('Only requested lab requests can collect samples')
    }
    const sample = await tx.labSample.create({
      data: { requestId: request.id, barcode: nextLabBarcode(), status: LabSampleStatus.COLLECTED },
      include: { request: { include: labRequestInclude() } },
    })
    return sample
  })
}

export async function receiveSample(sampleId: string) {
  return prisma.$transaction(async (tx) => {
    const sample = await tx.labSample.findUnique({ where: { id: sampleId }, include: { request: true } })
    if (!sample) {
      throw new Error('Lab sample not found')
    }
    const claimed = await tx.labSample.updateMany({
      where: { id: sample.id, status: LabSampleStatus.COLLECTED },
      data: { status: LabSampleStatus.RECEIVED, receivedAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only collected samples can be received')
    }
    await tx.labRequest.update({ where: { id: sample.requestId }, data: { status: LabRequestStatus.SAMPLE_RECEIVED } })
    return tx.labSample.findUnique({ where: { id: sample.id }, include: { request: { include: labRequestInclude() } } })
  })
}

export async function rejectSample(sampleId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const sample = await tx.labSample.findUnique({ where: { id: sampleId }, include: { request: { include: { report: true } } } })
    if (!sample) {
      throw new Error('Lab sample not found')
    }
    const canRejectRequest =
      sample.request.status === LabRequestStatus.REQUESTED ||
      sample.request.status === LabRequestStatus.SAMPLE_COLLECTED ||
      sample.request.status === LabRequestStatus.SAMPLE_RECEIVED
    const reportStatus = sample.request.report?.status
    const hasResultedReport =
      reportStatus === LabReportStatus.RESULTED ||
      reportStatus === LabReportStatus.REVIEWED ||
      reportStatus === LabReportStatus.PUBLISHED
    if (!canRejectRequest || hasResultedReport) {
      throw new Error('Only collected or received samples before result can be rejected')
    }
    const sampleClaim = await tx.labSample.updateMany({
      where: { id: sample.id, status: { in: [LabSampleStatus.COLLECTED, LabSampleStatus.RECEIVED] } },
      data: { status: LabSampleStatus.REJECTED, rejectedAt: new Date(), rejectReason: reason },
    })
    if (sampleClaim.count !== 1) {
      throw new Error('Lab sample status changed, please retry')
    }
    const requestClaim = await tx.labRequest.updateMany({
      where: { id: sample.requestId, status: { in: [LabRequestStatus.REQUESTED, LabRequestStatus.SAMPLE_COLLECTED, LabRequestStatus.SAMPLE_RECEIVED] } },
      data: { status: LabRequestStatus.REJECTED },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Lab sample status changed, please retry')
    }
    return tx.labSample.findUnique({ where: { id: sample.id }, include: { request: { include: labRequestInclude() } } })
  })
}

export async function recordLabResults(
  reportId: string,
  input: { results: Array<{ itemId: string; resultValue: string; numericValue?: number; unit?: string; referenceLow?: number; referenceHigh?: number }>; summary?: string },
) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.labReport.findUnique({ where: { id: reportId }, include: { request: { include: { items: true } } } })
    if (!report) {
      throw new Error('Lab report not found')
    }
    if (report.request.status !== LabRequestStatus.SAMPLE_RECEIVED && report.request.status !== LabRequestStatus.RESULTED) {
      throw new Error('Only received samples can record results')
    }
    const requestedItemIds = new Set(report.request.items.map((item) => item.itemId))
    const resultItemIds = new Set(input.results.map((row) => row.itemId))
    if (
      requestedItemIds.size === 0 ||
      resultItemIds.size !== requestedItemIds.size ||
      input.results.length !== requestedItemIds.size ||
      input.results.some((row) => !requestedItemIds.has(row.itemId))
    ) {
      throw new Error('Lab results must match requested items')
    }
    const claimed = await tx.labReport.updateMany({
      where: { id: report.id, status: { in: [LabReportStatus.DRAFT, LabReportStatus.RESULTED] } },
      data: { status: LabReportStatus.RESULTED, summary: input.summary },
    })
    if (claimed.count !== 1) {
      throw new Error('Lab report status changed, please retry')
    }
    const requestClaim = await tx.labRequest.updateMany({
      where: { id: report.requestId, status: { in: [LabRequestStatus.SAMPLE_RECEIVED, LabRequestStatus.RESULTED] } },
      data: { status: LabRequestStatus.RESULTED },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Lab request status changed, please retry')
    }
    await tx.labResult.deleteMany({ where: { reportId: report.id } })
    await tx.labResult.createMany({
      data: input.results.map((row) => ({
        reportId: report.id,
        itemId: row.itemId,
        resultValue: row.resultValue,
        numericValue: row.numericValue,
        unit: row.unit,
        referenceLow: row.referenceLow,
        referenceHigh: row.referenceHigh,
        abnormalFlag: row.numericValue === undefined ? 'NORMAL' : abnormalFlag(row.numericValue, row.referenceLow, row.referenceHigh),
      })),
    })
    return tx.labReport.findUnique({ where: { id: report.id }, include: labReportInclude() })
  })
}

export async function reviewLabReport(reportId: string, reviewerId?: string) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.labReport.findUnique({ where: { id: reportId }, include: { request: true } })
    if (!report) {
      throw new Error('Lab report not found')
    }
    const claimed = await tx.labReport.updateMany({
      where: { id: report.id, status: LabReportStatus.RESULTED },
      data: { status: LabReportStatus.REVIEWED, reviewedAt: new Date(), reviewerId },
    })
    if (claimed.count !== 1) {
      throw new Error('Only resulted lab reports can be reviewed')
    }
    await tx.labRequest.update({ where: { id: report.requestId }, data: { status: LabRequestStatus.REVIEWED } })
    return tx.labReport.findUnique({ where: { id: report.id }, include: labReportInclude() })
  })
}

export async function publishLabReport(reportId: string, provider: LabProvider = defaultProvider) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.labReport.findUnique({ where: { id: reportId }, include: { request: true } })
    if (!report) {
      throw new Error('Lab report not found')
    }
    assertCanPublishLabReport(report.status)
    const claimed = await tx.labReport.updateMany({
      where: { id: report.id, status: LabReportStatus.REVIEWED },
      data: { status: LabReportStatus.PUBLISHED, publishedAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only reviewed lab reports can be published')
    }
    await tx.labRequest.update({ where: { id: report.requestId }, data: { status: LabRequestStatus.PUBLISHED } })
    const result = await provider.publishReport({ requestNo: report.request.requestNo, reportId: report.id })
    await logProvider(tx, { requestId: report.requestId, action: 'publishReport', request: { reportId }, response: result.raw })
    return tx.labReport.findUnique({ where: { id: report.id }, include: labReportInclude() })
  })
}

export async function getPublishedReportsForPatient(userId: string) {
  return prisma.labReport.findMany({
    where: { status: LabReportStatus.PUBLISHED, request: { userId } },
    include: labReportInclude(),
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })
}

export function labRequestInclude() {
  return {
    user: true,
    doctor: { include: { user: true, department: true } },
    encounter: true,
    admission: true,
    items: { include: { item: true } },
    sample: true,
    report: { include: { results: { include: { item: true } } } },
  } satisfies Prisma.LabRequestInclude
}

export function labReportInclude() {
  return {
    request: { include: labRequestInclude() },
    results: { include: { item: true } },
  } satisfies Prisma.LabReportInclude
}
