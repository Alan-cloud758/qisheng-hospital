import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import CashierWorkbenchPage from '../pages/CashierWorkbenchPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import DepartmentsPage from '../pages/DepartmentsPage.vue'
import DoctorWorkbenchPage from '../pages/DoctorWorkbenchPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import RegistrationsPage from '../pages/RegistrationsPage.vue'
import SchedulesPage from '../pages/SchedulesPage.vue'
import { pinia, useAuthStore } from '../stores/auth'

export const routes: RouteRecordRaw[] = [
  { path: '/login', component: LoginPage },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardPage },
      { path: 'departments', component: DepartmentsPage },
      { path: 'schedules', component: SchedulesPage },
      { path: 'registrations', component: RegistrationsPage },
      { path: 'doctor', component: DoctorWorkbenchPage },
      { path: 'cashier', component: CashierWorkbenchPage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)

  if (to.matched.some((record) => record.meta.requiresAuth) && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
