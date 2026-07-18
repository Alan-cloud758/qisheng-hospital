<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Reports</p>
        <h1 class="page-title">报表中心</h1>
        <p class="page-subtitle">查看各类运营、临床和管理报表。</p>
      </div>
      <div class="date-filter">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="loadReport" />
        <el-button type="primary" @click="loadReport">查询</el-button>
      </div>
    </div>

    <div class="reports-layout">
      <el-menu :default-active="activeReport" @select="onSelect" class="report-sidebar">
        <el-menu-item-group title="运营报表">
          <el-menu-item index="daily">日运营概览</el-menu-item>
          <el-menu-item index="monthly">月度统计</el-menu-item>
          <el-menu-item index="revenue">收入构成</el-menu-item>
          <el-menu-item index="queue">候诊时间</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="科室 & 医生">
          <el-menu-item index="department">科室工作量</el-menu-item>
          <el-menu-item index="doctor">医生工作量</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="药品 & 耗材">
          <el-menu-item index="drug">药品销售</el-menu-item>
          <el-menu-item index="consumable">耗材消耗</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="医保 & 住院">
          <el-menu-item index="insurance">医保结算</el-menu-item>
          <el-menu-item index="inpatient">住院统计</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="检验 & 影像">
          <el-menu-item index="lab">检验统计</el-menu-item>
          <el-menu-item index="imaging">影像统计</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="手术">
          <el-menu-item index="surgery">手术统计</el-menu-item>
        </el-menu-item-group>
      </el-menu>

      <section class="panel report-content" v-loading="loading">
        <h2>{{ reportTitle }}</h2>
        <el-table :data="reportData" border stripe>
          <el-table-column v-for="col in columns" :key="col.key" :label="col.label" :prop="col.key" :min-width="col.width || 120" show-overflow-tooltip />
        </el-table>
        <el-empty v-if="!loading && !reportData.length" description="暂无数据" />
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { apiClient } from '../api/client'

interface ColumnDef { key: string; label: string; width?: number }

const loading = ref(false)
const activeReport = ref('daily')
const dateRange = ref<[string, string] | null>(null)
const reportData = ref<Record<string, unknown>[]>([])

const reportMeta: Record<string, { title: string; endpoint: string; columns: ColumnDef[] }> = {
  daily: { title: '日运营概览', endpoint: '/admin/reports/daily', columns: [{ key: 'date', label: '日期' }, { key: 'registrations', label: '挂号数' }, { key: 'completed', label: '完成数' }, { key: 'revenue', label: '收入(元)' }] },
  monthly: { title: '月度统计', endpoint: '/admin/reports/monthly', columns: [{ key: 'month', label: '月份' }, { key: 'registrations', label: '挂号数' }, { key: 'revenue', label: '收入(元)' }, { key: 'avgDaily', label: '日均挂号' }] },
  revenue: { title: '收入构成', endpoint: '/admin/reports/revenue-breakdown', columns: [{ key: 'category', label: '类别' }, { key: 'amount', label: '金额(元)' }, { key: 'ratio', label: '占比', width: 80 }] },
  queue: { title: '候诊时间', endpoint: '/admin/reports/queue-time', columns: [{ key: 'department', label: '科室' }, { key: 'avgWaitMin', label: '平均候诊(分)' }, { key: 'maxWaitMin', label: '最长候诊(分)' }, { key: 'patientCount', label: '患者数' }] },
  department: { title: '科室工作量', endpoint: '/admin/reports/department-workload', columns: [{ key: 'departmentName', label: '科室' }, { key: 'registrationCount', label: '挂号数' }, { key: 'completedCount', label: '完成数' }, { key: 'completionRate', label: '完成率', width: 90 }] },
  doctor: { title: '医生工作量', endpoint: '/admin/reports/doctor-workload', columns: [{ key: 'doctorName', label: '医生' }, { key: 'departmentName', label: '科室' }, { key: 'encounterCount', label: '接诊数' }, { key: 'prescriptionCount', label: '处方数' }] },
  drug: { title: '药品销售', endpoint: '/admin/reports/drug-sales', columns: [{ key: 'drugName', label: '药品' }, { key: 'totalQuantity', label: '销量' }, { key: 'totalAmount', label: '金额(元)' }] },
  consumable: { title: '耗材消耗', endpoint: '/admin/reports/consumable-usage', columns: [{ key: 'itemName', label: '耗材' }, { key: 'quantity', label: '消耗量' }, { key: 'amount', label: '金额(元)' }] },
  insurance: { title: '医保结算', endpoint: '/admin/reports/insurance', columns: [{ key: 'provider', label: '医保类型' }, { key: 'settlementCount', label: '结算笔数' }, { key: 'totalAmount', label: '总金额' }, { key: 'insurancePay', label: '医保支付' }, { key: 'selfPay', label: '自付' }] },
  inpatient: { title: '住院统计', endpoint: '/admin/reports/inpatient', columns: [{ key: 'month', label: '月份' }, { key: 'admissionCount', label: '入院数' }, { key: 'dischargeCount', label: '出院数' }, { key: 'avgStayDays', label: '平均住院日' }, { key: 'bedOccupancy', label: '床位使用率' }] },
  lab: { title: '检验统计', endpoint: '/admin/reports/lab', columns: [{ key: 'itemName', label: '检验项目' }, { key: 'requestCount', label: '申请数' }, { key: 'completedCount', label: '完成数' }, { key: 'avgTurnaround', label: '平均周转(小时)' }] },
  imaging: { title: '影像统计', endpoint: '/admin/reports/imaging', columns: [{ key: 'examType', label: '检查类型' }, { key: 'requestCount', label: '申请数' }, { key: 'completedCount', label: '完成数' }, { key: 'avgTurnaround', label: '平均周转(小时)' }] },
  surgery: { title: '手术统计', endpoint: '/admin/reports/surgery', columns: [{ key: 'month', label: '月份' }, { key: 'totalSurgeries', label: '手术台次' }, { key: 'emergencyCount', label: '急诊手术' }, { key: 'avgDurationMin', label: '平均时长(分)' }] },
}

const reportTitle = computed(() => reportMeta[activeReport.value]?.title || '')

const columns = computed(() => reportMeta[activeReport.value]?.columns || [])

function onSelect(index: string) {
  activeReport.value = index
  loadReport()
}

async function loadReport() {
  const meta = reportMeta[activeReport.value]
  if (!meta) return
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (dateRange.value) { params.startDate = dateRange.value[0]; params.endDate = dateRange.value[1] }
    const { data } = await apiClient.get(meta.endpoint, { params })
    reportData.value = data.items || data.rows || data || []
  } catch { reportData.value = [] } finally { loading.value = false }
}

onMounted(() => { void loadReport() })
</script>

<style scoped>
.reports-layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
.report-sidebar { border-right: 1px solid var(--el-border-color); }
.report-content h2 { margin: 0 0 12px; font-size: 18px; }
.date-filter { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
</style>
