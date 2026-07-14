import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminResourcePage from '../pages/AdminResourcePage.vue'
import CashierWorkbenchPage from '../pages/CashierWorkbenchPage.vue'
import ClinicalTemplatesPage from '../pages/ClinicalTemplatesPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import DoctorWorkbenchPage from '../pages/DoctorWorkbenchPage.vue'
import DrugStockMovementsPage from '../pages/DrugStockMovementsPage.vue'
import DrugStockPage from '../pages/DrugStockPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import ModuleListPage from '../pages/ModuleListPage.vue'
import PaymentHistoryPage from '../pages/PaymentHistoryPage.vue'
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

const adminResourcePage = (
  path: string,
  title: string,
  subtitle: string,
  resource: string,
  columns: Array<{ key: string; label: string }>,
  fields: Array<{ key: string; label: string; required?: boolean; type?: 'text' | 'number' | 'textarea' | 'boolean' }>,
  toggleable = true,
  eyebrow = 'Master Data',
) => ({
  path,
  component: AdminResourcePage,
  props: { eyebrow, title, subtitle, resource, columns, fields, toggleable },
})

export const routes: RouteRecordRaw[] = [
  { path: '/login', component: LoginPage },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: DashboardPage },
      adminResourcePage('accounts', '账号管理', '维护员工、医生和患者账号基础信息。', 'accounts', [
        { key: 'username', label: '账号' },
        { key: 'displayName', label: '姓名' },
        { key: 'status', label: '状态' },
        { key: 'roles', label: '角色数' },
      ], [
        { key: 'username', label: '账号', required: true },
        { key: 'displayName', label: '姓名', required: true },
        { key: 'phone', label: '电话' },
        { key: 'email', label: '邮箱' },
        { key: 'password', label: '初始密码' },
        { key: 'status', label: '状态' },
      ]),
      adminResourcePage('roles', '角色权限', '维护系统角色基础配置。', 'roles', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '名称' },
        { key: 'description', label: '说明' },
        { key: 'permissions', label: '权限数' },
      ], [
        { key: 'code', label: '编码', required: true },
        { key: 'name', label: '名称', required: true },
        { key: 'description', label: '说明' },
      ], false),
      adminResourcePage('menus', '菜单配置', '维护后台导航菜单。', 'menus', [
        { key: 'title', label: '菜单' },
        { key: 'path', label: '路径' },
        { key: 'sortOrder', label: '排序' },
      ], [
        { key: 'code', label: '编码', required: true },
        { key: 'title', label: '菜单', required: true },
        { key: 'path', label: '路径', required: true },
        { key: 'icon', label: '图标' },
        { key: 'sortOrder', label: '排序', type: 'number' },
      ]),
      adminResourcePage('departments', '科室管理', '维护科室基础信息和排序。', 'departments', [
        { key: 'name', label: '科室' },
        { key: 'code', label: '编码' },
        { key: 'campus.name', label: '院区' },
        { key: 'sortOrder', label: '排序' },
      ], [
        { key: 'campusId', label: '院区ID', required: true },
        { key: 'name', label: '科室', required: true },
        { key: 'code', label: '编码', required: true },
        { key: 'summary', label: '简介', type: 'textarea' },
        { key: 'sortOrder', label: '排序', type: 'number' },
      ]),
      adminResourcePage('campuses', '院区管理', '维护院区、地址和诊室覆盖。', 'campuses', [
        { key: 'name', label: '院区' },
        { key: 'address', label: '地址' },
        { key: 'phone', label: '电话' },
        { key: 'departments', label: '科室数' },
      ], [
        { key: 'name', label: '院区', required: true },
        { key: 'address', label: '地址', required: true },
        { key: 'phone', label: '电话' },
      ]),
      adminResourcePage('clinic-rooms', '诊室管理', '维护诊室所在院区、楼层和科室。', 'clinic-rooms', [
        { key: 'name', label: '诊室' },
        { key: 'department.name', label: '科室' },
        { key: 'campus.name', label: '院区' },
        { key: 'floor', label: '楼层' },
      ], [
        { key: 'campusId', label: '院区ID', required: true },
        { key: 'departmentId', label: '科室ID', required: true },
        { key: 'name', label: '诊室', required: true },
        { key: 'floor', label: '楼层' },
      ]),
      adminResourcePage('doctors', '医生档案', '维护医生职称、科室、专长和挂号费。', 'doctors', [
        { key: 'user.displayName', label: '医生' },
        { key: 'department.name', label: '科室' },
        { key: 'title', label: '职称' },
        { key: 'specialty', label: '专长' },
      ], [
        { key: 'userId', label: '用户ID', required: true },
        { key: 'departmentId', label: '科室ID', required: true },
        { key: 'employeeNo', label: '工号', required: true },
        { key: 'title', label: '职称', required: true },
        { key: 'specialty', label: '专长', required: true },
        { key: 'consultationFee', label: '挂号费', type: 'number' },
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
      { path: 'clinical-templates', component: ClinicalTemplatesPage },
      { path: 'cashier', component: CashierWorkbenchPage },
      { path: 'payment-history', component: PaymentHistoryPage },
      adminResourcePage('fee-items', '费用项目', '维护门诊收费项目配置。', 'fee-items', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '名称' },
        { key: 'amount', label: '金额' },
      ], [
        { key: 'code', label: '编码', required: true },
        { key: 'name', label: '名称', required: true },
        { key: 'amount', label: '金额', required: true, type: 'number' },
      ]),
      { path: 'pharmacy', component: PharmacyWorkbenchPage },
      { path: 'drug-stock', component: DrugStockPage },
      { path: 'drug-stock-movements', component: DrugStockMovementsPage },
      adminResourcePage('drugs', '药品目录', '维护药品规格、单位和价格。', 'drugs', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '药品' },
        { key: 'spec', label: '规格' },
        { key: 'price', label: '价格' },
        { key: 'minStock', label: '最低库存' },
      ], [
        { key: 'code', label: '编码', required: true },
        { key: 'name', label: '药品', required: true },
        { key: 'spec', label: '规格', required: true },
        { key: 'unit', label: '单位', required: true },
        { key: 'price', label: '价格', required: true, type: 'number' },
        { key: 'minStock', label: '最低库存', type: 'number' },
        { key: 'requiresBatch', label: '批次管理', type: 'boolean' },
      ]),
      modulePage('prescriptions', '处方列表', '查看处方状态和药品明细。', 'prescriptions', [
        { key: 'doctor.user.displayName', label: '医生' },
        { key: 'status', label: '状态' },
        { key: 'items', label: '药品数' },
        { key: 'note', label: '备注' },
      ]),
      adminResourcePage('announcements', '公告配置', '维护患者端公告。', 'announcements', [
        { key: 'title', label: '标题' },
        { key: 'content', label: '内容' },
        { key: 'publishedAt', label: '发布时间' },
      ], [
        { key: 'title', label: '标题', required: true },
        { key: 'content', label: '内容', required: true, type: 'textarea' },
        { key: 'publishedAt', label: '发布时间' },
      ]),
      adminResourcePage('dictionaries', '数据字典', '维护运营字典分类。', 'dictionaries', [
        { key: 'code', label: '编码' },
        { key: 'name', label: '名称' },
        { key: 'description', label: '说明' },
        { key: 'items', label: '条目数' },
      ], [
        { key: 'code', label: '编码', required: true },
        { key: 'name', label: '名称', required: true },
        { key: 'description', label: '说明' },
      ], false),
      adminResourcePage('dictionary-items', '字典条目', '维护运营字典条目。', 'dictionary-items', [
        { key: 'category.name', label: '分类' },
        { key: 'code', label: '编码' },
        { key: 'label', label: '名称' },
        { key: 'sortOrder', label: '排序' },
      ], [
        { key: 'categoryId', label: '分类ID', required: true },
        { key: 'code', label: '编码', required: true },
        { key: 'label', label: '名称', required: true },
        { key: 'sortOrder', label: '排序', type: 'number' },
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
