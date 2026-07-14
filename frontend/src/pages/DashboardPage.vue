<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Outpatient Command Center</p>
        <h1 class="page-title">启胜医院运营总览</h1>
        <p class="page-subtitle">集中查看科室、医生、挂号、待收费、处方和患者档案数据。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <div class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </div>

    <section class="panel">
      <h2>今日工作提醒</h2>
      <el-table :data="reminders" border stripe>
        <el-table-column label="事项" prop="title" />
        <el-table-column label="工作台" prop="workspace" width="160" />
        <el-table-column label="状态" prop="status" width="120" />
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchDashboard, type DashboardSummary } from '../api/hospital'

const summary = ref<DashboardSummary>({
  departmentCount: 0,
  doctorCount: 0,
  registrationCount: 0,
  pendingPaymentCount: 0,
  prescriptionCount: 0,
  patientCount: 0,
})

const metrics = computed(() => [
  { label: '科室数量', value: summary.value.departmentCount },
  { label: '医生档案', value: summary.value.doctorCount },
  { label: '挂号记录', value: summary.value.registrationCount },
  { label: '待收费订单', value: summary.value.pendingPaymentCount },
  { label: '处方记录', value: summary.value.prescriptionCount },
  { label: '患者档案', value: summary.value.patientCount },
])

const reminders = computed(() => [
  { title: `当前有 ${summary.value.pendingPaymentCount} 个待收费订单`, workspace: '收费工作台', status: '待处理' },
  { title: `已维护 ${summary.value.doctorCount} 位医生档案`, workspace: '医院组织', status: '正常' },
  { title: `累计 ${summary.value.registrationCount} 条挂号记录`, workspace: '排班挂号', status: '运行中' },
])

async function load() {
  summary.value = await fetchDashboard()
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
</style>
