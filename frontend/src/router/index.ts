import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import CashierWorkbenchPage from '../pages/CashierWorkbenchPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import DepartmentsPage from '../pages/DepartmentsPage.vue'
import DoctorWorkbenchPage from '../pages/DoctorWorkbenchPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import ModuleListPage from '../pages/ModuleListPage.vue'
import PharmacyWorkbenchPage from '../pages/PharmacyWorkbenchPage.vue'
import RegistrationsPage from '../pages/RegistrationsPage.vue'
import SchedulesPage from '../pages/SchedulesPage.vue'
import { pinia, useAuthStore } from '../stores/auth'

const modulePage = (
  path: string,
  title: string,
  subtitle: string,
  resource: string,
  columns: Array<{ key: string; label: string }>,
  eyebrow = 'Hospital Module',
) => ({
  path,
  component: ModuleListPage,
  props: { eyebrow, title, subtitle, resource, columns },
})

export const routes: RouteRecordRaw[] = [
  { path: '/login', component: LoginPage },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardPage },
      modulePage('accounts', '账号管理', '查看员工、医生和患者账号及角色绑定。', 'accounts', [
        { key: 'username', label: '账号' },
        { key: 'displayName', label: '姓名' },
        { key: 'status', label: '状态' },
        { key: 'roles', label: '角色数' },
      ]),
      modulePage('roles', '角色权限', '查看系统角色和权限配置。', 'roles', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '名称' },
        { key: 'description', label: '说明' },
        { key: 'permissions', label: '权限数' },
      ]),
      modulePage('menus', '菜单配置', '查看后台导航菜单。', 'menus', [
        { key: 'title', label: '菜单' },
        { key: 'path', label: '路径' },
        { key: 'sortOrder', label: '排序' },
      ]),
      { path: 'departments', component: DepartmentsPage },
      modulePage('campuses', '院区管理', '查看院区、地址和诊室覆盖。', 'campuses', [
        { key: 'name', label: '院区' },
        { key: 'address', label: '地址' },
        { key: 'phone', label: '电话' },
        { key: 'departments', label: '科室数' },
      ]),
      modulePage('clinic-rooms', '诊室管理', '查看诊室所在院区、楼层和科室。', 'clinic-rooms', [
        { key: 'name', label: '诊室' },
        { key: 'department.name', label: '科室' },
        { key: 'campus.name', label: '院区' },
        { key: 'floor', label: '楼层' },
      ]),
      modulePage('doctors', '医生档案', '查看医生职称、科室、专长和挂号费。', 'doctors', [
        { key: 'user.displayName', label: '医生' },
        { key: 'department.name', label: '科室' },
        { key: 'title', label: '职称' },
        { key: 'specialty', label: '专长' },
      ]),
      modulePage('patients', '患者中心', '查看患者档案和就诊人绑定。', 'patients', [
        { key: 'patientNo', label: '患者号' },
        { key: 'realName', label: '姓名' },
        { key: 'phone', label: '电话' },
        { key: 'visitMembers', label: '就诊人' },
      ]),
      modulePage('visit-members', '就诊人管理', '查看患者端维护的就诊人。', 'visit-members', [
        { key: 'name', label: '姓名' },
        { key: 'relationship', label: '关系' },
        { key: 'phone', label: '电话' },
        { key: 'patient.realName', label: '所属患者' },
      ]),
      { path: 'schedules', component: SchedulesPage },
      modulePage('slots', '号源池', '查看未来号源时间、状态和所属医生。', 'slots', [
        { key: 'schedule.doctor.user.displayName', label: '医生' },
        { key: 'schedule.department.name', label: '科室' },
        { key: 'startTime', label: '开始时间' },
        { key: 'status', label: '状态' },
      ]),
      { path: 'registrations', component: RegistrationsPage },
      modulePage('encounters', '就诊记录', '查看病历、诊断、医嘱和处方汇总。', 'encounters', [
        { key: 'registration.visitMember.name', label: '患者' },
        { key: 'doctor.user.displayName', label: '医生' },
        { key: 'status', label: '状态' },
        { key: 'diagnoses', label: '诊断数' },
      ]),
      { path: 'doctor', component: DoctorWorkbenchPage },
      { path: 'cashier', component: CashierWorkbenchPage },
      modulePage('payment-history', '支付记录', '查看全部支付订单及明细。', 'payment-orders', [
        { key: 'orderNo', label: '订单号' },
        { key: 'title', label: '标题' },
        { key: 'amount', label: '金额' },
        { key: 'status', label: '状态' },
      ]),
      modulePage('fee-items', '费用项目', '查看门诊收费项目配置。', 'fee-items', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '名称' },
        { key: 'amount', label: '金额' },
      ]),
      { path: 'pharmacy', component: PharmacyWorkbenchPage },
      modulePage('drugs', '药品目录', '查看药品规格、单位和价格。', 'drugs', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '药品' },
        { key: 'spec', label: '规格' },
        { key: 'price', label: '价格' },
      ]),
      modulePage('prescriptions', '处方列表', '查看处方状态和药品明细。', 'prescriptions', [
        { key: 'doctor.user.displayName', label: '医生' },
        { key: 'status', label: '状态' },
        { key: 'items', label: '药品数' },
        { key: 'note', label: '备注' },
      ]),
      modulePage('announcements', '公告配置', '查看患者端公告。', 'announcements', [
        { key: 'title', label: '标题' },
        { key: 'content', label: '内容' },
        { key: 'publishedAt', label: '发布时间' },
      ]),
      modulePage('dictionaries', '数据字典', '查看运营字典分类和条目。', 'dictionaries', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '名称' },
        { key: 'description', label: '说明' },
        { key: 'items', label: '条目数' },
      ]),
      modulePage('audit', '审计日志', '查看登录、支付、挂号、处方等操作记录。', 'audit-logs', [
        { key: 'action', label: '动作' },
        { key: 'resource', label: '资源' },
        { key: 'detail', label: '详情' },
        { key: 'createdAt', label: '时间' },
      ]),
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
