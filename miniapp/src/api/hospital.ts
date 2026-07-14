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
}

export interface DoctorScheduleSlot {
  id: string
  date: string
  startTime: string
  endTime: string
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
}

export interface Announcement {
  id: string
  title: string
  content: string
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

export function cancelRegistration(id: string) {
  return request<{ item: Registration }>('/mini/registrations/' + id + '/cancel', { method: 'POST' })
}

export function fetchRegistrations() {
  return request<{ items: Registration[] }>('/mini/registrations')
}

export function fetchVisitRecords() {
  return request<{ items: unknown[] }>('/mini/visit-records')
}
