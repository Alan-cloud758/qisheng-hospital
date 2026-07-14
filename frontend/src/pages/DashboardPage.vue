<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Operations Command</p>
        <h1 class="page-title">启胜医院运营总览</h1>
        <p class="page-subtitle">集中查看今日概览、门诊漏斗、队列压力、收入趋势、库存预警和待办事项。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel dashboard-filter-panel">
      <el-form class="dashboard-filters" inline>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="院区">
          <el-input v-model="filters.campusId" clearable placeholder="院区ID" />
        </el-form-item>
        <el-form-item label="科室">
          <el-input v-model="filters.departmentId" clearable placeholder="科室ID" />
        </el-form-item>
        <el-form-item label="医生">
          <el-input v-model="filters.doctorId" clearable placeholder="医生ID" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <div class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h2>门诊漏斗</h2>
        <el-table :data="outpatientRows" border stripe>
          <el-table-column label="阶段" prop="label" />
          <el-table-column label="数量" prop="value" width="100" />
        </el-table>
      </section>

      <section class="panel">
        <h2>队列压力</h2>
        <el-table :data="queue.items" border stripe empty-text="暂无队列压力">
          <el-table-column label="医生" prop="doctorName" />
          <el-table-column label="科室" prop="departmentName" />
          <el-table-column label="等待" prop="waiting" width="80" />
          <el-table-column label="叫号" prop="called" width="80" />
          <el-table-column label="跳过" prop="skipped" width="80" />
        </el-table>
      </section>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h2>收入趋势</h2>
        <el-table :data="revenue.trend" border stripe empty-text="暂无收入">
          <el-table-column label="日期" prop="date" />
          <el-table-column label="净收入" prop="amount" width="140" />
        </el-table>
      </section>

      <section class="panel">
        <h2>科室负载</h2>
        <el-table :data="departmentLoadRows" border stripe empty-text="暂无科室负载">
          <el-table-column label="科室" prop="departmentName" />
          <el-table-column label="挂号" prop="registrationCount" width="80" />
          <el-table-column label="候诊" prop="waitingCount" width="80" />
          <el-table-column label="完成率" prop="completionRateText" width="100" />
        </el-table>
      </section>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h2>药房库存预警</h2>
        <el-table :data="pharmacyAlerts.items" border stripe empty-text="暂无库存预警">
          <el-table-column label="药品" prop="drugName" />
          <el-table-column label="类型" prop="type" width="120" />
          <el-table-column label="级别" prop="level" width="100" />
        </el-table>
      </section>
    </div>

    <section class="panel">
      <h2>待办事项</h2>
      <el-table :data="workItems" border stripe>
        <el-table-column label="事项" prop="title" />
        <el-table-column label="工作台" prop="workspace" width="160" />
        <el-table-column label="状态" prop="status" width="120" />
      </el-table>
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
} from '../api/hospital'

interface OverviewDashboard {
  registrationCount: number
  completedCount: number
  completionRate: number
  pendingPaymentCount: number
  netRevenue: number
  queueWaiting: number
}

interface OutpatientDashboard {
  total: number
  booked: number
  checkedIn: number
  inVisit: number
  completed: number
  noShow: number
  cancelled: number
  departmentLoad: Array<{ departmentId: string; departmentName: string; registrationCount: number; completedCount: number; waitingCount: number; completionRate: number }>
}

interface RevenueDashboard {
  total: number
  trend: Array<{ date: string; amount: number }>
}

interface QueuePressureDashboard {
  totalWaiting: number
  items: Array<{ doctorName: string; departmentName: string; waiting: number; called: number; skipped: number }>
}

interface PharmacyAlertsDashboard {
  total: number
  critical: number
  items: Array<{ drugName: string; type: string; level: string }>
}

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

function initialFilters(): DashboardFilterForm {
  const today = formatDate(new Date())
  return { dateRange: [today, today], campusId: '', departmentId: '', doctorId: '' }
}

const filters = ref<DashboardFilterForm>(initialFilters())
const overview = ref<OverviewDashboard>({ registrationCount: 0, completedCount: 0, completionRate: 0, pendingPaymentCount: 0, netRevenue: 0, queueWaiting: 0 })
const outpatient = ref<OutpatientDashboard>({ total: 0, booked: 0, checkedIn: 0, inVisit: 0, completed: 0, noShow: 0, cancelled: 0, departmentLoad: [] })
const revenue = ref<RevenueDashboard>({ total: 0, trend: [] })
const queue = ref<QueuePressureDashboard>({ totalWaiting: 0, items: [] })
const pharmacyAlerts = ref<PharmacyAlertsDashboard>({ total: 0, critical: 0, items: [] })

const metrics = computed(() => [
  { label: '今日挂号', value: overview.value.registrationCount },
  { label: '完成接诊', value: overview.value.completedCount },
  { label: '完成率', value: `${Math.round(overview.value.completionRate * 100)}%` },
  { label: '待收费订单', value: overview.value.pendingPaymentCount },
  { label: '净收入', value: `¥${overview.value.netRevenue}` },
  { label: '候诊人数', value: overview.value.queueWaiting },
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
  { title: `当前有 ${overview.value.pendingPaymentCount} 个待收费订单`, workspace: '收费工作台', status: overview.value.pendingPaymentCount ? '待处理' : '正常' },
  { title: `队列中还有 ${queue.value.totalWaiting} 位患者等待`, workspace: '医生工作台', status: queue.value.totalWaiting ? '关注' : '正常' },
  { title: `药房库存 ${pharmacyAlerts.value.critical} 个严重预警`, workspace: '药品库存', status: pharmacyAlerts.value.critical ? '预警' : '正常' },
])

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
  const params = dashboardParams()
  const [overviewData, outpatientData, revenueData, pharmacyData, queueData] = await Promise.all([
    fetchDashboardOverview(params),
    fetchDashboardOutpatient(params),
    fetchDashboardRevenue(params),
    fetchDashboardPharmacyAlerts(params),
    fetchDashboardQueuePressure(params),
  ])
  overview.value = overviewData as OverviewDashboard
  outpatient.value = outpatientData as OutpatientDashboard
  revenue.value = revenueData as RevenueDashboard
  pharmacyAlerts.value = pharmacyData as PharmacyAlertsDashboard
  queue.value = queueData as QueuePressureDashboard
}

function resetFilters() {
  filters.value = initialFilters()
  void load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
h2 {
  margin: 0 0 14px;
  font-size: 18px;
}

.dashboard-filter-panel {
  margin-bottom: 16px;
}

.dashboard-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
