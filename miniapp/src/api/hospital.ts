import { request } from './client'

export interface DepartmentSummary {
  id: string
  name: string
  code: string
  summary?: string | null
  campus?: { id: string; name: string }
}

export interface DoctorSummary {
  id: string
  name: string
  title: string
  specialty: string
  introduction?: string | null
  consultationFee: number
  department?: { id: string; name: string }
  isFavorite?: boolean
}

export interface DoctorScheduleSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  lockedUntil?: string | null
  fee: number
  department?: { id: string; name: string }
  clinicRoom?: { id: string; name: string; floor?: string }
}

export interface VisitMember {
  id: string
  name: string
  gender?: string
  phone?: string
  relationship: string
  isDefault: boolean
}

export interface Registration {
  id: string
  registrationNo: string
  status: string
  department?: { name: string }
  doctor?: { user?: { displayName: string } }
  visitMember?: { name: string }
  slot?: { startTime: string; endTime: string }
  paymentOrder?: { id: string; status: string; amount: string | number }
  queueTicket?: { id: string; queueNo: number; status: string; ahead?: number; waitMinutes?: number; currentQueueNo?: number }
}

export interface PatientNotification {
  id: string
  title: string
  content: string
  readAt?: string | null
  createdAt: string
}

export interface QueueTicket {
  id: string
  queueNo: number
  status: string
  ahead: number
  waitMinutes: number
  currentTicketId?: string | null
  currentQueueNo?: number
  doctor?: { user?: { displayName?: string } }
  department?: { name?: string }
  registration?: { visitMember?: { name?: string }; slot?: { startTime: string; endTime: string } }
}

export interface Announcement {
  id: string
  title: string
  content: string
}

export interface FeeOrder {
  id: string
  orderNo: string
  title: string
  amount: string | number
  status: string
  transactions?: unknown[]
  refundOrders?: unknown[]
  insurance?: InsuranceSettlement | null
}

export interface InsuranceSettlement {
  id: string
  settlementNo: string
  status: string
  insuranceAmount: string | number
  selfPayAmount: string | number
  items?: Array<{ itemName: string; category: string; insuranceAmount: string | number; selfPayAmount: string | number }>
}

export interface InpatientAdmission {
  id: string
  admissionNo: string
  status: string
  diagnosis?: string | null
  admittedAt?: string | null
  dischargedAt?: string | null
  visitMember?: { name?: string }
  attendingDoctor?: { user?: { displayName?: string }; department?: { name?: string } }
  ward?: { name?: string }
  currentBed?: { bedNo?: string; ward?: { name?: string } }
  orders?: Array<{ id: string; type: string; content: string; status: string }>
  charges?: Array<{ id: string; itemName: string; amount: string | number; status: string; paymentOrder?: { id: string; status: string } }>
  dischargeRequests?: Array<{ id: string; status: string; reason: string }>
}

export interface LabReport {
  id: string
  status: string
  summary?: string | null
  publishedAt?: string | null
  request?: {
    requestNo: string
    source: string
    items?: Array<{ item?: { name?: string } }>
  }
  results?: Array<{
    resultValue: string
    abnormalFlag: string
    item?: { name?: string; unit?: string }
  }>
}

export interface ImagingReport {
  id: string
  status: string
  findings?: string | null
  impression?: string | null
  publishedAt?: string | null
  request?: {
    requestNo: string
    source: string
    items?: Array<{ item?: { name?: string; modality?: string; bodyPart?: string } }>
    study?: { studyUid?: string; imageUrl?: string }
  }
}

export function loginPatient(username = 'patient_demo', password = 'Qisheng@123') {
  return request<{ token: string; user: unknown }>('/auth/login', {
    method: 'POST',
    data: { username, password },
  })
}

export function fetchAnnouncements() {
  return request<{ items: Announcement[] }>('/public/announcements')
}

export function fetchDepartments() {
  return request<{ items: DepartmentSummary[] }>('/public/departments')
}

export function fetchDoctors(departmentId?: string) {
  return request<{ items: DoctorSummary[] }>('/public/doctors' + (departmentId ? `?departmentId=${departmentId}` : ''))
}

export function fetchDoctorSlots(doctorId: string) {
  return request<{ items: DoctorScheduleSlot[] }>('/public/doctors/' + doctorId + '/slots')
}

export function fetchVisitMembers() {
  return request<{ items: VisitMember[] }>('/mini/visit-members')
}

export function createVisitMember(data: Partial<VisitMember>) {
  return request<{ item: VisitMember }>('/mini/visit-members', { method: 'POST', data })
}

export function setDefaultVisitMember(id: string) {
  return request<{ item: VisitMember }>('/mini/visit-members/' + id + '/default', { method: 'POST' })
}

export function createRegistration(data: { slotId: string; visitMemberId: string }) {
  return request<{ item: Registration }>('/mini/registrations', { method: 'POST', data })
}

export function lockAppointmentSlot(id: string) {
  return request<{ item: DoctorScheduleSlot }>('/mini/slots/' + id + '/lock', { method: 'POST' })
}

export function rescheduleRegistration(id: string, slotId: string) {
  return request<{ item: Registration }>('/mini/registrations/' + id + '/reschedule', { method: 'POST', data: { slotId } })
}

export function cancelRegistration(id: string) {
  return request<{ item: Registration }>('/mini/registrations/' + id + '/cancel', { method: 'POST' })
}

export function fetchRegistrations() {
  return request<{ items: Registration[] }>('/mini/registrations')
}

export function fetchNotifications() {
  return request<{ items: PatientNotification[] }>('/mini/notifications')
}

export function markNotificationRead(id: string) {
  return request<{ item: PatientNotification }>('/mini/notifications/' + id + '/read', { method: 'POST' })
}

export function fetchQueueTickets() {
  return request<{ items: QueueTicket[] }>('/mini/queue')
}

export function favoriteDoctor(id: string) {
  return request<{ item: unknown }>('/mini/doctors/' + id + '/favorite', { method: 'POST' })
}

export function unfavoriteDoctor(id: string) {
  return request<{ item: unknown }>('/mini/doctors/' + id + '/favorite', { method: 'DELETE' })
}

export function fetchVisitRecords() {
  return request<{ items: unknown[] }>('/mini/visit-records')
}

export function requestFollowUp(id: string) {
  return request<{ item: PatientNotification }>('/mini/visit-records/' + id + '/follow-up', { method: 'POST' })
}

export function fetchFees() {
  return request<{ items: FeeOrder[] }>('/mini/fees')
}

export function fetchFeeInsurance(id: string) {
  return request<{ item: InsuranceSettlement | null }>('/mini/fees/' + id + '/insurance')
}

export function fetchInpatientAdmissions() {
  return request<{ items: InpatientAdmission[] }>('/mini/inpatient')
}

export function fetchLabReports() {
  return request<{ items: LabReport[] }>('/mini/lab-reports')
}

export function fetchImagingReports() {
  return request<{ items: ImagingReport[] }>('/mini/imaging-reports')
}
