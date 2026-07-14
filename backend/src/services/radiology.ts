import { ImagingAppointmentStatus, ImagingReportStatus, ImagingRequestStatus, InsuranceSettlementSource } from '../generated/prisma/enums'
import type { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'
import { MockPacsProvider, type PacsProvider } from '../providers/pacs-provider'

const defaultProvider = new MockPacsProvider()

export function assertCanPublishImagingReport(status: string) {
  if (status !== ImagingReportStatus.REVIEWED) {
    throw new Error('Only reviewed imaging reports can be published')
  }
}

export function nextStudyUid(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `1.2.826.0.1.3680043.10.543.${day}.${now.getTime()}.${Math.floor(Math.random() * 10000)}`
}

export function mockImageUrl(studyId: string) {
  return `/mock-pacs/studies/${studyId}/viewer`
}

function nextImagingRequestNo(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '')
  return `PACS${day}${now.getTime()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`
}

async function logProvider(
  tx: Prisma.TransactionClient,
  input: { requestId?: string; action: string; request: Record<string, unknown>; response: Record<string, unknown>; success?: boolean },
) {
  await tx.pacsProviderLog.create({
    data: {
      requestId: input.requestId,
      action: input.action,
      request: input.request as Prisma.InputJsonValue,
      response: input.response as Prisma.InputJsonValue,
      success: input.success ?? true,
    },
  })
}

export async function createImagingRequestForEncounter(
  encounterId: string,
  input: { itemIds: string[]; clinicalNote?: string },
  doctorId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const encounter = await tx.encounter.findUnique({ where: { id: encounterId }, include: { registration: true } })
    if (!encounter) {
      throw new Error('Encounter not found')
    }
    const items = await tx.imagingExamItem.findMany({ where: { id: { in: input.itemIds }, isActive: true } })
    if (items.length === 0) {
      throw new Error('Imaging items are required')
    }
    const requestNo = nextImagingRequestNo()
    return tx.imagingRequest.create({
      data: {
        requestNo,
        userId: encounter.registration.userId,
        visitMemberId: encounter.registration.visitMemberId,
        doctorId: doctorId ?? encounter.doctorId,
        encounterId: encounter.id,
        source: InsuranceSettlementSource.OUTPATIENT,
        clinicalNote: input.clinicalNote,
        items: { create: items.map((row) => ({ itemId: row.id })) },
        report: { create: { status: ImagingReportStatus.DRAFT } },
      },
      include: imagingRequestInclude(),
    })
  })
}

export async function createImagingRequestForInpatient(
  admissionId: string,
  input: { itemIds: string[]; clinicalNote?: string; doctorId?: string },
) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.inpatientAdmission.findUnique({ where: { id: admissionId } })
    if (!admission) {
      throw new Error('Inpatient admission not found')
    }
    const items = await tx.imagingExamItem.findMany({ where: { id: { in: input.itemIds }, isActive: true } })
    if (items.length === 0) {
      throw new Error('Imaging items are required')
    }
    const requestNo = nextImagingRequestNo()
    return tx.imagingRequest.create({
      data: {
        requestNo,
        userId: admission.userId,
        visitMemberId: admission.visitMemberId,
        doctorId: input.doctorId ?? admission.attendingDoctorId,
        admissionId: admission.id,
        source: InsuranceSettlementSource.INPATIENT,
        clinicalNote: input.clinicalNote,
        items: { create: items.map((row) => ({ itemId: row.id })) },
        report: { create: { status: ImagingReportStatus.DRAFT } },
      },
      include: imagingRequestInclude(),
    })
  })
}

export async function scheduleImaging(requestId: string, input: { scheduledAt: Date; room?: string }) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.imagingRequest.findUnique({ where: { id: requestId } })
    if (!request) {
      throw new Error('Imaging request not found')
    }
    const claimed = await tx.imagingRequest.updateMany({
      where: { id: request.id, status: ImagingRequestStatus.REQUESTED },
      data: { status: ImagingRequestStatus.SCHEDULED },
    })
    if (claimed.count !== 1) {
      throw new Error('Only requested imaging requests can be scheduled')
    }
    return tx.imagingAppointment.create({
      data: { requestId: request.id, scheduledAt: input.scheduledAt, room: input.room, status: ImagingAppointmentStatus.SCHEDULED },
      include: { request: { include: imagingRequestInclude() } },
    })
  })
}

export async function checkInImagingAppointment(appointmentId: string) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.imagingAppointment.findUnique({ where: { id: appointmentId } })
    if (!appointment) {
      throw new Error('Imaging appointment not found')
    }
    const claimed = await tx.imagingAppointment.updateMany({
      where: { id: appointment.id, status: ImagingAppointmentStatus.SCHEDULED },
      data: { status: ImagingAppointmentStatus.CHECKED_IN, checkedInAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only scheduled imaging appointments can be checked in')
    }
    const requestClaim = await tx.imagingRequest.updateMany({
      where: { id: appointment.requestId, status: ImagingRequestStatus.SCHEDULED },
      data: { status: ImagingRequestStatus.CHECKED_IN },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Imaging request status changed, please retry')
    }
    return tx.imagingAppointment.findUnique({ where: { id: appointment.id }, include: { request: { include: imagingRequestInclude() } } })
  })
}

export async function completeImagingStudy(appointmentId: string, provider: PacsProvider = defaultProvider) {
  return prisma.$transaction(async (tx) => {
    const appointment = await tx.imagingAppointment.findUnique({
      where: { id: appointmentId },
      include: { request: { include: { items: { include: { item: true } } } } },
    })
    if (!appointment) {
      throw new Error('Imaging appointment not found')
    }
    const appointmentClaim = await tx.imagingAppointment.updateMany({
      where: { id: appointment.id, status: ImagingAppointmentStatus.CHECKED_IN },
      data: { status: ImagingAppointmentStatus.COMPLETED, completedAt: new Date() },
    })
    if (appointmentClaim.count !== 1) {
      throw new Error('Only checked-in imaging appointments can be completed')
    }
    const requestClaim = await tx.imagingRequest.updateMany({
      where: { id: appointment.requestId, status: ImagingRequestStatus.CHECKED_IN },
      data: { status: ImagingRequestStatus.COMPLETED },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Imaging request status changed, please retry')
    }
    const studyUid = nextStudyUid()
    const imageUrl = mockImageUrl(appointment.requestId)
    const result = await provider.createStudy({
      requestNo: appointment.request.requestNo,
      itemCodes: appointment.request.items.map((row) => row.item.code),
      studyUid,
      imageUrl,
    })
    const study = await tx.imagingStudy.create({
      data: {
        requestId: appointment.requestId,
        studyUid: result.studyUid ?? studyUid,
        imageUrl: result.imageUrl ?? imageUrl,
        modality: appointment.request.items[0]?.item.modality,
      },
      include: { request: { include: imagingRequestInclude() } },
    })
    await logProvider(tx, { requestId: appointment.requestId, action: 'createStudy', request: { appointmentId }, response: result.raw })
    return study
  })
}

export async function recordImagingReport(reportId: string, input: { findings: string; impression: string }) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.imagingReport.findUnique({ where: { id: reportId }, include: { request: true } })
    if (!report) {
      throw new Error('Imaging report not found')
    }
    const claimed = await tx.imagingReport.updateMany({
      where: { id: report.id, status: { in: [ImagingReportStatus.DRAFT, ImagingReportStatus.REPORTED] } },
      data: { status: ImagingReportStatus.REPORTED, findings: input.findings, impression: input.impression },
    })
    if (claimed.count !== 1) {
      throw new Error('Imaging report status changed, please retry')
    }
    const requestClaim = await tx.imagingRequest.updateMany({
      where: { id: report.requestId, status: { in: [ImagingRequestStatus.COMPLETED, ImagingRequestStatus.REPORTED] } },
      data: { status: ImagingRequestStatus.REPORTED },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Imaging request status changed, please retry')
    }
    return tx.imagingReport.findUnique({ where: { id: report.id }, include: imagingReportInclude() })
  })
}

export async function reviewImagingReport(reportId: string, reviewerId?: string) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.imagingReport.findUnique({ where: { id: reportId } })
    if (!report) {
      throw new Error('Imaging report not found')
    }
    const claimed = await tx.imagingReport.updateMany({
      where: { id: report.id, status: ImagingReportStatus.REPORTED },
      data: { status: ImagingReportStatus.REVIEWED, reviewedAt: new Date(), reviewerId },
    })
    if (claimed.count !== 1) {
      throw new Error('Only reported imaging reports can be reviewed')
    }
    const requestClaim = await tx.imagingRequest.updateMany({
      where: { id: report.requestId, status: ImagingRequestStatus.REPORTED },
      data: { status: ImagingRequestStatus.REVIEWED },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Imaging request status changed, please retry')
    }
    return tx.imagingReport.findUnique({ where: { id: report.id }, include: imagingReportInclude() })
  })
}

export async function publishImagingReport(reportId: string, provider: PacsProvider = defaultProvider) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.imagingReport.findUnique({ where: { id: reportId }, include: { request: { include: { study: true } } } })
    if (!report) {
      throw new Error('Imaging report not found')
    }
    assertCanPublishImagingReport(report.status)
    const claimed = await tx.imagingReport.updateMany({
      where: { id: report.id, status: ImagingReportStatus.REVIEWED },
      data: { status: ImagingReportStatus.PUBLISHED, publishedAt: new Date() },
    })
    if (claimed.count !== 1) {
      throw new Error('Only reviewed imaging reports can be published')
    }
    const requestClaim = await tx.imagingRequest.updateMany({
      where: { id: report.requestId, status: ImagingRequestStatus.REVIEWED },
      data: { status: ImagingRequestStatus.PUBLISHED },
    })
    if (requestClaim.count !== 1) {
      throw new Error('Imaging request status changed, please retry')
    }
    const result = await provider.publishReport({ requestNo: report.request.requestNo, reportId: report.id, studyUid: report.request.study?.studyUid })
    await logProvider(tx, { requestId: report.requestId, action: 'publishReport', request: { reportId }, response: result.raw })
    return tx.imagingReport.findUnique({ where: { id: report.id }, include: imagingReportInclude() })
  })
}

export async function getPublishedImagingReportsForPatient(userId: string) {
  return prisma.imagingReport.findMany({
    where: { status: ImagingReportStatus.PUBLISHED, request: { userId } },
    include: imagingReportInclude(),
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })
}

export function imagingRequestInclude() {
  return {
    user: true,
    doctor: { include: { user: true, department: true } },
    encounter: true,
    admission: true,
    items: { include: { item: true } },
    appointment: true,
    study: true,
    report: true,
  } satisfies Prisma.ImagingRequestInclude
}

export function imagingReportInclude() {
  return {
    request: { include: imagingRequestInclude() },
  } satisfies Prisma.ImagingReportInclude
}
