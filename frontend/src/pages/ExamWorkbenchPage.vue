<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Physical Exam</p>
        <h1 class="page-title">体检工作站</h1>
        <p class="page-subtitle">查看体检工单、录入体检结果、完成体检并生成报告。</p>
      </div>
      <el-button @click="load" :loading="loading">刷新</el-button>
    </div>

    <!-- Status Tabs -->
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待检" name="PENDING" />
      <el-tab-pane label="进行中" name="IN_PROGRESS" />
      <el-tab-pane label="已完成" name="COMPLETED" />
    </el-tabs>

    <!-- Orders Table -->
    <section class="panel">
      <el-table v-loading="loading" :data="orders" border stripe>
        <el-table-column label="工单号" prop="orderNo" min-width="160" />
        <el-table-column label="患者" min-width="100">
          <template #default="{ row }">{{ row.patientName || row.patient?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="套餐" min-width="140">
          <template #default="{ row }">{{ row.packageName || row.examPackage?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span class="badge" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" min-width="170">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button size="small" type="primary" :disabled="row.status === 'COMPLETED'" @click="openResult(row)">录入结果</el-button>
            <el-button size="small" type="success" :disabled="row.status === 'COMPLETED'" @click="completeOrder(row.id)">完成体检</el-button>
            <el-button size="small" :disabled="row.status !== 'COMPLETED'" @click="generateReport(row.id)">生成报告</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- Result Dialog -->
    <el-dialog v-model="resultVisible" title="录入体检结果" width="680px">
      <el-table :data="resultItems" border>
        <el-table-column label="项目" min-width="160">
          <template #default="{ row }">{{ row.itemName }}</template>
        </el-table-column>
        <el-table-column label="结果值" width="180">
          <template #default="{ row }"><el-input v-model="row.resultValue" placeholder="输入结果" /></template>
        </el-table-column>
        <el-table-column label="参考范围" width="130">
          <template #default="{ row }">{{ row.referenceRange || '-' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="resultVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResult">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { apiClient } from '../api/client'

interface ExamOrderItem {
  id: string
  itemName: string
  resultValue?: string
  referenceRange?: string
}

interface ExamOrder {
  id: string
  orderNo: string
  status: string
  patientName?: string
  patient?: { realName?: string }
  packageName?: string
  examPackage?: { name?: string }
  createdAt?: string
  items?: ExamOrderItem[]
}

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('')
const orders = ref<ExamOrder[]>([])
const resultVisible = ref(false)
const selectedOrderId = ref('')
const resultItems = ref<Array<{ itemId: string; itemName: string; resultValue: string; referenceRange: string }>>([])

function statusClass(status: string) {
  const map: Record<string, string> = { PENDING: 'badge-warning', IN_PROGRESS: 'badge-info', COMPLETED: 'badge-success' }
  return map[status] ?? 'badge-muted'
}

function statusLabel(status: string) {
  const map: Record<string, string> = { PENDING: '待检', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[status] ?? status
}

function formatDate(val?: string) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (activeTab.value) params.status = activeTab.value
    const { data } = await apiClient.get('/admin/exam/orders', { params })
    orders.value = Array.isArray(data) ? data : (data.data ?? data.items ?? [])
  } finally {
    loading.value = false
  }
}

function onTabChange() {
  void load()
}

function openResult(row: ExamOrder) {
  selectedOrderId.value = row.id
  resultItems.value = (row.items ?? []).map((item) => ({
    itemId: item.id,
    itemName: item.itemName,
    resultValue: item.resultValue ?? '',
    referenceRange: item.referenceRange ?? '',
  }))
  resultVisible.value = true
}

async function submitResult() {
  submitting.value = true
  try {
    for (const item of resultItems.value) {
      if (item.resultValue) {
        await apiClient.put(`/admin/exam/order-items/${item.itemId}/result`, { resultValue: item.resultValue })
      }
    }
    resultVisible.value = false
    ElMessage.success('结果录入成功')
    await load()
  } finally {
    submitting.value = false
  }
}

async function completeOrder(id: string) {
  await ElMessageBox.confirm('确定完成该体检工单？', '确认')
  await apiClient.post(`/admin/exam/orders/${id}/complete`)
  ElMessage.success('体检已完成')
  await load()
}

async function generateReport(id: string) {
  await apiClient.post(`/admin/exam/orders/${id}/report`)
  ElMessage.success('报告生成成功')
}

onMounted(() => { void load() })
</script>

<style scoped>
.el-tabs {
  margin-bottom: var(--space-2);
}
</style>
