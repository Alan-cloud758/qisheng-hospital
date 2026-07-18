<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Operations Analytics</p>
        <h1 class="page-title">运营分析报表</h1>
        <p class="page-subtitle">收入趋势、科室/医生工作量、药品销售等运营数据分析。</p>
      </div>
      <el-button @click="loadAll" :loading="loading">刷新</el-button>
    </div>

    <!-- Date Range Filter -->
    <section class="panel filter-bar">
      <el-form inline @submit.prevent="loadAll">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAll">查询</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- Revenue KPI Cards -->
    <div class="kpi-grid">
      <article class="kpi-card" style="--accent:#16a34a;">
        <div class="kpi-icon" style="background:#f0fdf4;"><span class="kpi-icon-text">&#36;</span></div>
        <div class="kpi-body">
          <span class="kpi-label">总收入</span>
          <strong class="kpi-value">¥{{ revenueSummary.totalRevenue }}</strong>
        </div>
      </article>
      <article class="kpi-card" style="--accent:#2563eb;">
        <div class="kpi-icon" style="background:#eff6ff;"><span class="kpi-icon-text">#</span></div>
        <div class="kpi-body">
          <span class="kpi-label">总笔数</span>
          <strong class="kpi-value">{{ revenueSummary.totalCount }}</strong>
        </div>
      </article>
      <article class="kpi-card" style="--accent:#d97706;">
        <div class="kpi-icon" style="background:#fffbeb;"><span class="kpi-icon-text">~</span></div>
        <div class="kpi-body">
          <span class="kpi-label">日均收入</span>
          <strong class="kpi-value">¥{{ revenueSummary.avgDaily }}</strong>
        </div>
      </article>
    </div>

    <!-- Revenue Trend Table -->
    <section class="panel">
      <div class="panel-header">
        <h2>收入趋势</h2>
      </div>
      <el-table v-loading="loading" :data="revenueTrend" border stripe size="small">
        <el-table-column label="日期" prop="date" min-width="130" />
        <el-table-column label="收入" min-width="130">
          <template #default="{ row }">
            <span style="font-weight:600;color:var(--color-success);">¥{{ row.amount ?? row.total ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="笔数" prop="count" width="100" />
      </el-table>
    </section>

    <div class="dashboard-grid">
      <!-- Department Workload -->
      <section class="panel">
        <div class="panel-header">
          <h2>科室工作量</h2>
        </div>
        <el-table v-loading="loading" :data="departmentWorkload" border stripe size="small">
          <el-table-column label="科室" min-width="140">
            <template #default="{ row }">{{ row.departmentName || row.department?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="挂号数" width="90">
            <template #default="{ row }">{{ row.registrationCount ?? row.count ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="就诊数" width="90">
            <template #default="{ row }">{{ row.encounterCount ?? row.visits ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="收入" width="120">
            <template #default="{ row }">
              <span style="font-weight:600;color:var(--color-success);">¥{{ row.revenue ?? 0 }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <!-- Doctor Workload -->
      <section class="panel">
        <div class="panel-header">
          <h2>医生工作量</h2>
        </div>
        <el-table v-loading="loading" :data="doctorWorkload" border stripe size="small">
          <el-table-column label="医生" min-width="120">
            <template #default="{ row }">{{ row.doctorName || row.doctor?.user?.displayName || '-' }}</template>
          </el-table-column>
          <el-table-column label="科室" min-width="100">
            <template #default="{ row }">{{ row.departmentName || row.doctor?.department?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="接诊数" width="90">
            <template #default="{ row }">{{ row.encounterCount ?? row.count ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="收入" width="120">
            <template #default="{ row }">
              <span style="font-weight:600;color:var(--color-success);">¥{{ row.revenue ?? 0 }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <!-- Drug Sales -->
    <section class="panel">
      <div class="panel-header">
        <h2>药品销售排行</h2>
      </div>
      <el-table v-loading="loading" :data="drugSales" border stripe size="small">
        <el-table-column label="药品" min-width="180">
          <template #default="{ row }">{{ row.drugName || row.drug?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="规格" width="130">
          <template #default="{ row }">{{ row.spec || row.drug?.spec || '-' }}</template>
        </el-table-column>
        <el-table-column label="销售数量" width="110">
          <template #default="{ row }">{{ row.quantity ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="销售金额" width="130">
          <template #default="{ row }">
            <span style="font-weight:600;color:var(--color-success);">¥{{ row.amount ?? row.total ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="处方数" width="100">
          <template #default="{ row }">{{ row.prescriptionCount ?? 0 }}</template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { apiClient } from '../api/client'

interface RevenueItem {
  date: string
  amount?: number
  total?: number
  count?: number
}

interface WorkloadItem {
  departmentName?: string
  department?: { name?: string }
  doctorName?: string
  doctor?: { user?: { displayName?: string }; department?: { name?: string } }
  registrationCount?: number
  encounterCount?: number
  count?: number
  visits?: number
  revenue?: number
}

interface DrugSaleItem {
  drugName?: string
  drug?: { name?: string; spec?: string }
  spec?: string
  quantity?: number
  amount?: number
  total?: number
  prescriptionCount?: number
}

function getDefaultDateRange(): string[] {
  const now = new Date()
  const endDate = formatDateISO(now)
  const start = new Date(now)
  start.setDate(start.getDate() - 30)
  const startDate = formatDateISO(start)
  return [startDate, endDate]
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const loading = ref(false)
const dateRange = ref<string[]>(getDefaultDateRange())
const revenueTrend = ref<RevenueItem[]>([])
const departmentWorkload = ref<WorkloadItem[]>([])
const doctorWorkload = ref<WorkloadItem[]>([])
const drugSales = ref<DrugSaleItem[]>([])

const revenueSummary = computed(() => {
  let totalRevenue = 0
  let totalCount = 0
  for (const item of revenueTrend.value) {
    totalRevenue += item.amount ?? item.total ?? 0
    totalCount += item.count ?? 0
  }
  const days = revenueTrend.value.length || 1
  return {
    totalRevenue,
    totalCount,
    avgDaily: Math.round(totalRevenue / days),
  }
})

function toArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data
    if (Array.isArray(obj.items)) return obj.items
  }
  return []
}

async function loadAll() {
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value ?? []
    const dateParams: Record<string, string> = {}
    if (startDate) dateParams.startDate = startDate
    if (endDate) dateParams.endDate = endDate

    const [revRes, deptRes, docRes, drugRes] = await Promise.all([
      apiClient.get('/admin/analytics/revenue', { params: dateParams }),
      apiClient.get('/admin/analytics/department-workload', { params: dateParams }),
      apiClient.get('/admin/analytics/doctor-workload', { params: dateParams }),
      apiClient.get('/admin/analytics/drug-sales', { params: dateParams }),
    ])

    const revData = revRes.data
    // Revenue may come as { trend: [...] } or as an array
    if (revData && typeof revData === 'object' && !Array.isArray(revData) && Array.isArray(revData.trend)) {
      revenueTrend.value = revData.trend
    } else {
      revenueTrend.value = toArray(revData) as RevenueItem[]
    }

    departmentWorkload.value = toArray(deptRes.data) as WorkloadItem[]
    doctorWorkload.value = toArray(docRes.data) as WorkloadItem[]
    drugSales.value = toArray(drugRes.data) as DrugSaleItem[]
  } finally {
    loading.value = false
  }
}

onMounted(() => { void loadAll() })
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

.kpi-icon-text {
  font-size: 20px;
  font-weight: 700;
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

/* ── Dashboard Grid ── */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
