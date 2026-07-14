<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Insurance Provider</p>
        <h1 class="page-title">医保接口日志</h1>
        <p class="page-subtitle">查看模拟医保 provider 的预结算、结算、冲正和退款抵扣请求。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="动作" prop="action" width="120" />
        <el-table-column label="结算号" min-width="180">
          <template #default="{ row }">{{ row.settlement?.settlementNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="订单" min-width="160">
          <template #default="{ row }">{{ row.settlement?.paymentOrder?.orderNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">{{ row.settlement?.status || '-' }}</template>
        </el-table-column>
        <el-table-column label="成功" width="80">
          <template #default="{ row }">{{ row.success ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchInsuranceProviderLogs } from '../api/hospital'

interface InsuranceLogRow {
  id: string
  action: string
  success: boolean
  createdAt: string
  settlement?: { settlementNo?: string; status?: string; paymentOrder?: { orderNo?: string } }
}

const loading = ref(false)
const rows = ref<InsuranceLogRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchInsuranceProviderLogs()) as InsuranceLogRow[]
  } finally {
    loading.value = false
  }
}

function formatDate(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

onMounted(() => {
  void load()
})
</script>
