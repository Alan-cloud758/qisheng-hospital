import { apiClient } from './client'

export interface AuthUser {
  id: string
  username: string
  displayName: string
  roles: string[]
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface DashboardSummary {
  departmentCount: number
  doctorCount: number
  registrationCount: number
  pendingPaymentCount: number
  prescriptionCount: number
  patientCount: number
}

export async function login(username: string, password: string) {
  const response = await apiClient.post<LoginResponse>('/auth/login', { username, password })
  return response.data
}

export async function fetchDashboard() {
  const response = await apiClient.get<{ summary: DashboardSummary }>('/admin/dashboard')
  return response.data.summary
}

export async function fetchDepartments() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/departments')
  return response.data.items
}

export async function fetchDoctors() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/doctors')
  return response.data.items
}

export async function fetchRegistrations() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/registrations')
  return response.data.items
}

export interface PaginatedItems<T = unknown> {
  items: T[]
  pagination: { page: number; pageSize: number; total: number }
}

export async function fetchAdminResource(resource: string, params: Record<string, unknown> = {}) {
  const response = await apiClient.get<PaginatedItems>(`/admin/${resource}`, { params })
  return response.data
}

export async function createAdminResource(resource: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/${resource}`, data)
  return response.data.item
}

export async function updateAdminResource(resource: string, id: string, data: Record<string, unknown>) {
  const response = await apiClient.put<{ item: unknown }>(`/admin/${resource}/${id}`, data)
  return response.data.item
}

export async function toggleAdminResource(resource: string, id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/${resource}/${id}/toggle-active`)
  return response.data.item
}

export async function checkInRegistration(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/registrations/${id}/check-in`)
  return response.data.item
}

export async function fetchDoctorQueue() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/doctor/queue')
  return response.data.items
}

export async function startEncounter(registrationId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/registrations/${registrationId}/start`)
  return response.data.item
}

export async function completeEncounter(encounterId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/complete`)
  return response.data.item
}

export async function fetchPaymentOrders() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/cashier/payment-orders')
  return response.data.items
}

export async function payOrder(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/payment-orders/${id}/pay`)
  return response.data.item
}

export async function fetchPharmacyPrescriptions() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/pharmacy/prescriptions')
  return response.data.items
}

export async function reviewPrescription(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/prescriptions/${id}/review`)
  return response.data.item
}

export async function dispensePrescription(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/prescriptions/${id}/dispense`)
  return response.data.item
}
