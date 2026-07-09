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
