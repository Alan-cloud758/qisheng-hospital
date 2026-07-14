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

export async function fetchRegistrations(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/registrations', { params })
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

export async function fetchScheduleTemplates() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/schedule-templates')
  return response.data.items
}

export async function createScheduleTemplate(data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>('/admin/schedule-templates', data)
  return response.data.item
}

export async function generateScheduleTemplate(id: string, data: { startDate: string; endDate: string }) {
  const response = await apiClient.post<{ items: unknown[] }>(`/admin/schedule-templates/${id}/generate`, data)
  return response.data.items
}

export async function suspendSchedule(id: string, reason: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/schedules/${id}/suspend`, { reason })
  return response.data.item
}

export async function markRegistrationNoShow(id: string, reason: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/registrations/${id}/no-show`, { reason })
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

export async function fetchDoctorClinicalTemplates() {
  const response = await apiClient.get<{
    recordTemplates: unknown[]
    diagnoses: unknown[]
    orders: unknown[]
    prescriptionTemplates: unknown[]
    drugs: unknown[]
  }>('/staff/doctor/clinical-templates')
  return response.data
}

export async function applyEncounterRecordTemplate(encounterId: string, templateId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/apply-record-template`, { templateId })
  return response.data.item
}

export async function createEncounterDiagnosis(encounterId: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/diagnoses`, data)
  return response.data.item
}

export async function createEncounterOrder(encounterId: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/orders`, data)
  return response.data.item
}

export async function createPrescriptionFromTemplate(encounterId: string, templateId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/prescriptions/from-template`, { templateId })
  return response.data.item
}

export async function resubmitPrescription(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/prescriptions/${id}/resubmit`, {})
  return response.data.item
}

export async function fetchPaymentOrders() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/cashier/payment-orders')
  return response.data.items
}

export async function fetchAdminPaymentOrders() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/payment-orders')
  return response.data.items
}

export async function payOrder(id: string, payMethod = 'MOCK_CASH') {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/payment-orders/${id}/pay`, { payMethod })
  return response.data.item
}

export async function cancelPaymentOrder(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/payment-orders/${id}/cancel`)
  return response.data.item
}

export async function requestPaymentRefund(id: string, data: { amount?: number; reason: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/payment-orders/${id}/refunds`, data)
  return response.data.item
}

export async function executePaymentRefund(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/refunds/${id}/execute`)
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

export async function rejectPrescription(id: string, reason: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/prescriptions/${id}/reject`, { reason })
  return response.data.item
}

export async function dispensePrescription(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/prescriptions/${id}/dispense`)
  return response.data.item
}

export async function returnPrescription(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/prescriptions/${id}/return`)
  return response.data.item
}

export async function fetchDrugStockBatches() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/pharmacy/stock-batches')
  return response.data.items
}

export async function receiveDrugStock(data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>('/staff/pharmacy/stock-batches', data)
  return response.data.item
}

export async function adjustDrugStock(id: string, data: { quantity: number; reason: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/stock-batches/${id}/adjust`, data)
  return response.data.item
}

export async function damageDrugStock(id: string, data: { quantity: number; reason: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/pharmacy/stock-batches/${id}/damage`, data)
  return response.data.item
}

export async function fetchDrugStockMovements() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/pharmacy/stock-movements')
  return response.data.items
}

export async function fetchDrugStockAlerts() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/pharmacy/stock-alerts')
  return response.data.items
}

export async function fetchClinicalTemplateResource(resource: string) {
  const response = await apiClient.get<{ items: unknown[] }>(`/admin/${resource}`)
  return response.data.items
}

export async function createClinicalTemplateResource(resource: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/${resource}`, data)
  return response.data.item
}

export async function updateClinicalTemplateResource(resource: string, id: string, data: Record<string, unknown>) {
  const response = await apiClient.put<{ item: unknown }>(`/admin/${resource}/${id}`, data)
  return response.data.item
}
