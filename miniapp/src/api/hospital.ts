import { request } from './client'

export interface DepartmentSummary {
  id: string
  name: string
  code: string
  description: string | null
  doctors: Array<{ id: string; name: string; title: string; specialties: string }>
}

export interface DoctorScheduleSlot {
  id: string
  scheduleId: string
  doctorId: string
  doctorName: string
  departmentName: string
  startAt: string
  endAt: string
  fee: number
  status: string
}

export function fetchDepartments() {
  return request<{ items: DepartmentSummary[] }>('/public/departments')
}

export function fetchDoctorSlots(doctorId: string) {
  return request<{ items: DoctorScheduleSlot[] }>('/public/doctors/' + doctorId + '/slots')
}
