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

export async function fetchDashboardOverview(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ item: DashboardOverview }>('/admin/dashboard/overview', { params })
  return response.data.item
}

export async function fetchDashboardOutpatient(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ item: OutpatientDashboard }>('/admin/dashboard/outpatient', { params })
  return response.data.item
}

export async function fetchDashboardRevenue(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ item: RevenueDashboard }>('/admin/dashboard/revenue', { params })
  return response.data.item
}

export async function fetchDashboardPharmacyAlerts(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ item: PharmacyAlertsDashboard }>('/admin/dashboard/pharmacy-alerts', { params })
  return response.data.item
}

export async function fetchDashboardQueuePressure(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ item: QueuePressureDashboard }>('/admin/dashboard/queue-pressure', { params })
  return response.data.item
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

export interface DashboardOverview {
  registrationCount: number
  completedCount: number
  completionRate: number
  pendingPaymentCount: number
  netRevenue: number
  queueWaiting: number
}

export interface OutpatientDashboard {
  total: number
  booked: number
  checkedIn: number
  inVisit: number
  completed: number
  noShow: number
  cancelled: number
  departmentLoad: Array<{ departmentId: string; departmentName: string; registrationCount: number; completedCount: number; waitingCount: number; completionRate: number }>
}

export interface RevenueDashboard {
  total: number
  trend: Array<{ date: string; amount: number }>
}

export interface QueuePressureDashboard {
  totalWaiting: number
  items: Array<{ doctorName: string; departmentName: string; waiting: number; called: number; skipped: number }>
}

export interface PharmacyAlertsDashboard {
  total: number
  critical: number
  items: Array<{ drugName: string; type: string; level: string }>
}

export interface DoctorQueueItem {
  id: string
  status: string
  visitMember?: { name?: string }
  department?: { name?: string }
  slot?: { startTime?: string }
  encounter?: { id: string; status: string; prescriptions?: Array<{ id: string; status: string; rejectedReason?: string }> }
  queueTicket?: { id: string; queueNo: number; status: string }
}

export interface QueueTicket {
  id: string
  queueNo: number
  status: string
  registration?: { visitMember?: { name?: string } }
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
  const response = await apiClient.get<{ items: DoctorQueueItem[] }>('/staff/doctor/queue')
  return response.data.items
}

export async function fetchDoctorQueueTickets() {
  const response = await apiClient.get<{ items: QueueTicket[] }>('/staff/doctor/queue-tickets')
  return response.data.items
}

export async function callNextQueuePatient() {
  const response = await apiClient.post<{ item: unknown }>('/staff/doctor/queue/next', {})
  return response.data.item
}

export async function skipQueueTicket(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/queue/${id}/skip`)
  return response.data.item
}

export async function restoreQueueTicket(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/queue/${id}/restore`)
  return response.data.item
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

export async function fetchDoctorLabItems() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/doctor/lab-items')
  return response.data.items
}

export async function fetchDoctorImagingItems() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/doctor/imaging-items')
  return response.data.items
}

export async function createEncounterLabRequest(encounterId: string, data: { itemIds: string[]; clinicalNote?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/lab-requests`, data)
  return response.data.item
}

export async function createEncounterImagingRequest(encounterId: string, data: { itemIds: string[]; clinicalNote?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/encounters/${encounterId}/imaging-requests`, data)
  return response.data.item
}

export async function createInpatientLabRequest(admissionId: string, data: { itemIds: string[]; clinicalNote?: string; doctorId?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/inpatients/${admissionId}/lab-requests`, data)
  return response.data.item
}

export async function createInpatientImagingRequest(admissionId: string, data: { itemIds: string[]; clinicalNote?: string; doctorId?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/inpatients/${admissionId}/imaging-requests`, data)
  return response.data.item
}

export async function fetchLabRequests() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/lab/requests')
  return response.data.items
}

export async function collectLabSample(requestId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/lab/requests/${requestId}/collect`, {})
  return response.data.item
}

export async function receiveLabSample(sampleId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/lab/samples/${sampleId}/receive`, {})
  return response.data.item
}

export async function rejectLabSample(sampleId: string, reason: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/lab/samples/${sampleId}/reject`, { reason })
  return response.data.item
}

export async function recordLabResults(reportId: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/lab/reports/${reportId}/results`, data)
  return response.data.item
}

export async function reviewLabReport(reportId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/lab/reports/${reportId}/review`, {})
  return response.data.item
}

export async function publishLabReport(reportId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/lab/reports/${reportId}/publish`, {})
  return response.data.item
}

export async function fetchImagingRequests() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/radiology/requests')
  return response.data.items
}

export async function scheduleImagingRequest(requestId: string, data: { scheduledAt: string; room?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/radiology/requests/${requestId}/schedule`, data)
  return response.data.item
}

export async function checkInImagingAppointment(appointmentId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/radiology/appointments/${appointmentId}/check-in`, {})
  return response.data.item
}

export async function completeImagingStudy(appointmentId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/radiology/appointments/${appointmentId}/complete`, {})
  return response.data.item
}

export async function recordImagingReport(reportId: string, data: { findings: string; impression: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/radiology/reports/${reportId}/record`, data)
  return response.data.item
}

export async function reviewImagingReport(reportId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/radiology/reports/${reportId}/review`, {})
  return response.data.item
}

export async function publishImagingReport(reportId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/radiology/reports/${reportId}/publish`, {})
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

export async function fetchInsuranceProviderLogs() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/insurance-provider-logs')
  return response.data.items
}

export async function fetchInsuranceSettlements() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/insurance-settlements')
  return response.data.items
}

export async function preSettleInsurance(orderId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/payment-orders/${orderId}/insurance/pre-settle`, {})
  return response.data.item
}

export async function settleInsurance(orderId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/payment-orders/${orderId}/insurance/settle`, {})
  return response.data.item
}

export async function reverseInsuranceSettlement(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/cashier/insurance-settlements/${id}/reverse`, {})
  return response.data.item
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

export async function fetchNurseAdmissions() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/nurse/admissions')
  return response.data.items
}

export async function fetchNurseBeds() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/nurse/beds')
  return response.data.items
}

export async function createInpatientAdmission(data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>('/staff/nurse/admissions', data)
  return response.data.item
}

export async function assignInpatientBed(id: string, data: { bedId: string; reason?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nurse/admissions/${id}/assign-bed`, data)
  return response.data.item
}

export async function transferInpatientBed(id: string, data: { bedId: string; reason?: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nurse/admissions/${id}/transfer-bed`, data)
  return response.data.item
}

export async function approveDischarge(id: string, data: { approvalNote?: string } = {}) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nurse/discharges/${id}/approve`, data)
  return response.data.item
}

export async function settleDischarge(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nurse/discharges/${id}/settle`, {})
  return response.data.item
}

export async function completeDischarge(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nurse/discharges/${id}/complete`, {})
  return response.data.item
}

export async function fetchDoctorInpatients() {
  const response = await apiClient.get<{ items: unknown[] }>('/staff/doctor/inpatients')
  return response.data.items
}

export async function createInpatientOrder(id: string, data: { doctorId?: string; type: string; content: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/inpatients/${id}/orders`, data)
  return response.data.item
}

export async function requestInpatientDischarge(id: string, data: { reason: string }) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/doctor/inpatients/${id}/discharge-request`, data)
  return response.data.item
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

// ═══════════════════════════════════════════════
// 体检管理
// ═══════════════════════════════════════════════

export async function fetchExamPackages() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/exam/packages')
  return response.data.items
}

export async function fetchExamOrders(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<PaginatedItems>('/admin/exam/orders', { params })
  return response.data
}

export async function submitExamResult(itemId: string, data: { resultValue: string; numericValue?: number; unit?: string; abnormalFlag?: string }) {
  const response = await apiClient.put<{ item: unknown }>(`/admin/exam/order-items/${itemId}/result`, data)
  return response.data.item
}

export async function completeExamOrder(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/exam/orders/${id}/complete`)
  return response.data.item
}

export async function reportExamOrder(id: string, summary: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/exam/orders/${id}/report`, { summary })
  return response.data.item
}

// ═══════════════════════════════════════════════
// 手术管理
// ═══════════════════════════════════════════════

export async function fetchSurgeryRequests() {
  const response = await apiClient.get<PaginatedItems>('/admin/surgery/requests')
  return response.data
}

export async function fetchOperatingRooms() {
  const response = await apiClient.get<{ items: unknown[] }>('/admin/surgery/rooms')
  return response.data.items
}

export async function createSurgeryRequest(data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>('/admin/surgery/requests', data)
  return response.data.item
}

export async function scheduleSurgery(data: { requestId: string; roomId: string; scheduledStart: string; scheduledEnd: string }) {
  const response = await apiClient.post<{ item: unknown }>('/admin/surgery/schedules', data)
  return response.data.item
}

export async function startSurgery(scheduleId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/surgery/schedules/${scheduleId}/start`)
  return response.data.item
}

export async function completeSurgery(scheduleId: string) {
  const response = await apiClient.post<{ item: unknown }>(`/admin/surgery/schedules/${scheduleId}/complete`)
  return response.data.item
}

// ═══════════════════════════════════════════════
// 护理管理
// ═══════════════════════════════════════════════

export async function fetchVitalSigns(admissionId: string) {
  const response = await apiClient.get<{ items: unknown[] }>(`/staff/nursing/vital-signs/${admissionId}`)
  return response.data.items
}

export async function recordVitalSigns(admissionId: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nursing/vital-signs/${admissionId}`, data)
  return response.data.item
}

export async function fetchNursingAssessments(admissionId: string) {
  const response = await apiClient.get<{ items: unknown[] }>(`/staff/nursing/assessments/${admissionId}`)
  return response.data.items
}

export async function createNursingAssessment(admissionId: string, data: Record<string, unknown>) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nursing/assessments/${admissionId}`, data)
  return response.data.item
}

export async function fetchNursingExecutions(admissionId: string) {
  const response = await apiClient.get<{ items: unknown[] }>(`/staff/nursing/executions/${admissionId}`)
  return response.data.items
}

export async function executeNursingTask(id: string) {
  const response = await apiClient.post<{ item: unknown }>(`/staff/nursing/executions/${id}/execute`)
  return response.data.item
}

export async function fetchShiftReports() {
  const response = await apiClient.get<PaginatedItems>('/staff/nursing/shift-reports')
  return response.data
}

// ═══════════════════════════════════════════════
// 物资耗材
// ═══════════════════════════════════════════════

export async function fetchConsumableCatalog() {
  const response = await apiClient.get<PaginatedItems>('/admin/consumables/catalog')
  return response.data
}

export async function fetchConsumableBatches() {
  const response = await apiClient.get<PaginatedItems>('/admin/consumables/batches')
  return response.data
}

export async function fetchConsumableMovements() {
  const response = await apiClient.get<PaginatedItems>('/admin/consumables/movements')
  return response.data
}

// ═══════════════════════════════════════════════
// 运营分析
// ═══════════════════════════════════════════════

export async function fetchAnalyticsRevenue(params: Record<string, unknown> = {}) {
  const response = await apiClient.get<{ total: number; trend: Array<{ date: string; amount: number }>; orderCount: number }>('/admin/analytics/revenue', { params })
  return response.data
}

export async function fetchAnalyticsDepartmentWorkload() {
  const response = await apiClient.get<{ items: Array<{ departmentId: string; departmentName: string; registrationCount: number; completedCount: number }> }>('/admin/analytics/department-workload')
  return response.data.items
}

export async function fetchAnalyticsDoctorWorkload() {
  const response = await apiClient.get<{ items: Array<{ doctorId: string; doctorName: string; departmentName: string; encounterCount: number; prescriptionCount: number }> }>('/admin/analytics/doctor-workload')
  return response.data.items
}

export async function fetchAnalyticsDrugSales() {
  const response = await apiClient.get<{ items: Array<{ drugId: string; drugName: string; totalQuantity: number; totalAmount: number }> }>('/admin/analytics/drug-sales')
  return response.data.items
}
