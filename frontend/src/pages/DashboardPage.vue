<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Operations Command</p>
        <h1 class="page-title">运营总览</h1>
        <p class="page-subtitle">今日门诊运营关键指标与实时数据</p>
      </div>
      <el-button @click="load" :loading="loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="margin-right:4px;vertical-align:middle;">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        刷新
      </el-button>
    </div>

    <!-- Filters -->
    <section class="panel filter-bar">
      <el-form inline @submit.prevent="load">
        <el-form-item label="日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            size="default"
          />
        </el-form-item>
        <el-form-item label="院区">
          <el-input v-model="filters.campusId" clearable placeholder="院区ID" size="default" />
        </el-form-item>
        <el-form-item label="科室">
          <el-input v-model="filters.departmentId" clearable placeholder="科室ID" size="default" />
        </el-form-item>
        <el-form-item label="医生">
          <el-input v-model="filters.doctorId" clearable placeholder="医生ID" size="default" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- Metric Cards -->
    <div class="kpi-grid">
      <article v-for="metric in metrics" :key="metric.label" class="kpi-card" :style="{ '--accent': metric.color }">
        <div class="kpi-icon" :style="{ background: metric.bgColor }">
          <span v-html="metric.icon"></span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">{{ metric.label }}</span>
          <strong class="kpi-value">{{ metric.value }}</strong>
        </div>
      </article>
    </div>

    <!-- Two-column grids -->
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-header">
          <h2>门诊漏斗</h2>
          <span class="panel-badge">{{ outpatient.total }} 总计</span>
        </div>
        <div class="funnel">
          <div v-for="step in outpatientRows" :key="step.label" class="funnel-item">
            <div class="funnel-bar-bg">
              <div class="funnel-bar" :style="{ width: funnelPercent(step.value) + '%' }"></div>
            </div>
            <span class="funnel-label">{{ step.label }}</span>
            <strong class="funnel-value">{{ step.value }}</strong>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>队列压力</h2>
          <span class="panel-badge panel-badge-warning">{{ queue.totalWaiting }} 等待</span>
        </div>
        <el-table :data="queue.items" stripe empty-text="暂无队列压力" size="small">
          <el-table-column label="医生" prop="doctorName" min-width="100" />
          <el-table-column label="科室" prop="departmentName" min-width="100" />
          <el-table-column label="等待" prop="waiting" width="70" align="center" />
          <el-table-column label="叫号" prop="called" width="70" align="center" />
          <el-table-column label="跳过" prop="skipped" width="70" align="center" />
        </el-table>
      </section>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-header">
          <h2>收入趋势</h2>
          <span class="panel-badge panel-badge-success">¥{{ revenue.total }}</span>
        </div>
        <el-table :data="revenue.trend" stripe empty-text="暂无收入" size="small">
          <el-table-column label="日期" prop="date" min-width="120" />
          <el-table-column label="净收入" prop="amount" min-width="120">
            <template #default="{ row }">
              <span style="font-weight:600;color:var(--color-success);">¥{{ row.amount }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>科室负载</h2>
        </div>
        <div class="dept-load-list">
          <div v-for="dept in departmentLoadRows" :key="dept.departmentId" class="dept-load-item">
            <div class="dept-load-info">
              <strong>{{ dept.departmentName }}</strong>
              <span>{{ dept.registrationCount }} 挂号 / {{ dept.waitingCount }} 候诊</span>
            </div>
            <div class="dept-load-bar-bg">
              <div
                class="dept-load-bar"
                :style="{ width: Math.round(dept.completionRate * 100) + '%' }"
                :class="{
                  'bar-high': dept.completionRate >= 0.8,
                  'bar-mid': dept.completionRate >= 0.5 && dept.completionRate < 0.8,
                  'bar-low': dept.completionRate < 0.5,
                }"
              ></div>
            </div>
            <span class="dept-load-rate">{{ dept.completionRateText }}</span>
          </div>
          <el-empty v-if="departmentLoadRows.length === 0" description="暂无科室负载" :image-size="60" />
        </div>
      </section>
    </div>

    <div class="dashboard-grid single">
      <section class="panel">
        <div class="panel-header">
          <h2>药房库存预警</h2>
          <span v-if="pharmacyAlerts.critical" class="panel-badge panel-badge-danger">{{ pharmacyAlerts.critical }} 严重</span>
        </div>
        <el-table :data="pharmacyAlerts.items" stripe empty-text="暂无库存预警" size="small">
          <el-table-column label="药品" prop="drugName" min-width="160" />
          <el-table-column label="类型" prop="type" width="120" />
          <el-table-column label="级别" width="100">
            <template #default="{ row }">
              <span class="badge" :class="row.level === 'CRITICAL' ? 'badge-danger' : 'badge-warning'">
                {{ row.level === 'CRITICAL' ? '严重' : '警告' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <!-- Work items -->
    <section class="panel">
      <div class="panel-header">
        <h2>待办事项</h2>
      </div>
      <div class="work-items-grid">
        <div
          v-for="item in workItems"
          :key="item.title"
          class="work-item"
          :class="{
            'work-item-danger': item.status === '预警',
            'work-item-warning': item.status === '关注' || item.status === '待处理',
            'work-item-ok': item.status === '正常',
          }"
        >
          <div class="work-item-status">
            <span class="badge" :class="{
              'badge-danger': item.status === '预警',
              'badge-warning': item.status === '关注' || item.status === '待处理',
              'badge-success': item.status === '正常',
            }">{{ item.status }}</span>
          </div>
          <p class="work-item-title">{{ item.title }}</p>
          <span class="work-item-workspace">{{ item.workspace }}</span>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchDashboardOutpatient,
  fetchDashboardOverview,
  fetchDashboardPharmacyAlerts,
  fetchDashboardQueuePressure,
  fetchDashboardRevenue,
  type DashboardOverview,
  type OutpatientDashboard,
  type PharmacyAlertsDashboard,
  type QueuePressureDashboard,
  type RevenueDashboard,
} from '../api/hospital'

interface DashboardFilterForm {
  dateRange: string[]
  campusId: string
  departmentId: string
  doctorId: string
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const FILTER_STORAGE_KEY = 'qisheng_dashboard_filters'

function initialFilters(): DashboardFilterForm {
  const today = formatDate(new Date())
  const defaults: DashboardFilterForm = { dateRange: [today, today], campusId: '', departmentId: '', doctorId: '' }
  try {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<DashboardFilterForm>
      return { ...defaults, ...parsed, dateRange: parsed.dateRange ?? defaults.dateRange }
    }
  } catch { /* ignore */ }
  return defaults
}

function saveFilters() {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters.value))
  } catch { /* ignore */ }
}

const loading = ref(false)
const filters = ref<DashboardFilterForm>(initialFilters())
const overview = ref<DashboardOverview>({ registrationCount: 0, completedCount: 0, completionRate: 0, pendingPaymentCount: 0, netRevenue: 0, queueWaiting: 0 })
const outpatient = ref<OutpatientDashboard>({ total: 0, booked: 0, checkedIn: 0, inVisit: 0, completed: 0, noShow: 0, cancelled: 0, departmentLoad: [] })
const revenue = ref<RevenueDashboard>({ total: 0, trend: [] })
const queue = ref<QueuePressureDashboard>({ totalWaiting: 0, items: [] })
const pharmacyAlerts = ref<PharmacyAlertsDashboard>({ total: 0, critical: 0, items: [] })

const ICONS = {
  registration: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  completed:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  rate:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  payment:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  revenue:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  queue:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
}

const metrics = computed(() => [
  { label: '今日挂号', value: overview.value.registrationCount, icon: ICONS.registration, color: '#0d9488', bgColor: '#f0fdfa' },
  { label: '完成接诊', value: overview.value.completedCount, icon: ICONS.completed, color: '#16a34a', bgColor: '#f0fdf4' },
  { label: '完成率', value: `${Math.round(overview.value.completionRate * 100)}%`, icon: ICONS.rate, color: '#2563eb', bgColor: '#eff6ff' },
  { label: '待收费订单', value: overview.value.pendingPaymentCount, icon: ICONS.payment, color: '#d97706', bgColor: '#fffbeb' },
  { label: '净收入', value: `¥${overview.value.netRevenue}`, icon: ICONS.revenue, color: '#16a34a', bgColor: '#f0fdf4' },
  { label: '候诊人数', value: overview.value.queueWaiting, icon: ICONS.queue, color: '#dc2626', bgColor: '#fef2f2' },
])

const outpatientRows = computed(() => [
  { label: '预约', value: outpatient.value.booked },
  { label: '签到', value: outpatient.value.checkedIn },
  { label: '接诊中', value: outpatient.value.inVisit },
  { label: '完成', value: outpatient.value.completed },
  { label: '爽约', value: outpatient.value.noShow },
  { label: '取消', value: outpatient.value.cancelled },
])

const departmentLoadRows = computed(() =>
  outpatient.value.departmentLoad.map((item) => ({
    ...item,
    completionRateText: `${Math.round(item.completionRate * 100)}%`,
  })),
)

const workItems = computed(() => [
  { title: `${overview.value.pendingPaymentCount} 个待收费订单`, workspace: '收费工作台', status: overview.value.pendingPaymentCount ? '待处理' : '正常' },
  { title: `队列中 ${queue.value.totalWaiting} 位患者等待`, workspace: '医生工作台', status: queue.value.totalWaiting ? '关注' : '正常' },
  { title: `药房 ${pharmacyAlerts.value.critical} 个严重库存预警`, workspace: '药品库存', status: pharmacyAlerts.value.critical ? '预警' : '正常' },
])

function funnelPercent(value: number) {
  const max = outpatient.value.total || 1
  return Math.round((value / max) * 100)
}

function dashboardParams() {
  const [startDate, endDate] = Array.isArray(filters.value.dateRange) ? filters.value.dateRange : []
  return {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(filters.value.campusId.trim() ? { campusId: filters.value.campusId.trim() } : {}),
    ...(filters.value.departmentId.trim() ? { departmentId: filters.value.departmentId.trim() } : {}),
    ...(filters.value.doctorId.trim() ? { doctorId: filters.value.doctorId.trim() } : {}),
  }
}

async function load() {
  saveFilters()
  loading.value = true
  try {
    const params = dashboardParams()
    const [overviewData, outpatientData, revenueData, pharmacyData, queueData] = await Promise.all([
      fetchDashboardOverview(params),
      fetchDashboardOutpatient(params),
      fetchDashboardRevenue(params),
      fetchDashboardPharmacyAlerts(params),
      fetchDashboardQueuePressure(params),
    ])
    overview.value = overviewData as DashboardOverview
    outpatient.value = outpatientData as OutpatientDashboard
    revenue.value = revenueData as RevenueDashboard
    pharmacyAlerts.value = pharmacyData as PharmacyAlertsDashboard
    queue.value = queueData as QueuePressureDashboard
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  localStorage.removeItem(FILTER_STORAGE_KEY)
  const today = formatDate(new Date())
  filters.value = { dateRange: [today, today], campusId: '', departmentId: '', doctorId: '' }
  void load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
/* ── Filter Bar ── */
.filter-bar {
  padding: var(--space-4) var(--space-5);
}

.filter-bar :deep(.el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: center;
}

.filter-bar :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}

.filter-bar :deep(.el-form-item__label) {
  font-size: var(--text-sm);
}


/* ── KPI Cards ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal);
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  border-color: var(--accent);
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon :deep(svg) {
  width: 22px;
  height: 22px;
  color: var(--accent);
}

.kpi-body {
  min-width: 0;
}

.kpi-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 2px;
}

.kpi-value {
  display: block;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}


/* ── Dashboard Grid ── */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.dashboard-grid.single {
  grid-template-columns: 1fr;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}


/* ── Panel header ── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.panel-header h2 {
  margin: 0;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.panel-badge-success { background: var(--color-success-bg); color: var(--color-success); }
.panel-badge-warning { background: var(--color-warning-bg); color: var(--color-warning); }
.panel-badge-danger  { background: var(--color-danger-bg);  color: var(--color-danger);  }


/* ── Funnel Chart ── */
.funnel {
  display: grid;
  gap: var(--space-2);
}

.funnel-item {
  display: grid;
  grid-template-columns: 1fr 60px 50px;
  align-items: center;
  gap: var(--space-3);
}

.funnel-bar-bg {
  height: 28px;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.funnel-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: var(--radius-sm);
  transition: width var(--transition-slow);
  min-width: 2px;
}

.funnel-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-align: right;
}

.funnel-value {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}


/* ── Department load ── */
.dept-load-list {
  display: grid;
  gap: var(--space-2);
}

.dept-load-item {
  display: grid;
  grid-template-columns: 140px 1fr 50px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.dept-load-info {
  min-width: 0;
}

.dept-load-info strong {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dept-load-info span {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.dept-load-bar-bg {
  height: 8px;
  background: var(--color-surface-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.dept-load-bar {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.bar-high { background: var(--color-success); }
.bar-mid  { background: var(--color-warning); }
.bar-low  { background: var(--color-danger); }

.dept-load-rate {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  text-align: right;
}


/* ── Work Items ── */
.work-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-3);
}

.work-item {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: all var(--transition-fast);
}

.work-item:hover {
  box-shadow: var(--shadow-sm);
}

.work-item-status {
  margin-bottom: var(--space-2);
}

.work-item-title {
  margin: 0 0 var(--space-1);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.work-item-workspace {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
</style>
