<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Insurance Settlement</p>
        <h1 class="page-title">医保结算记录</h1>
        <p class="page-subtitle">查看医保预结算、正式结算、冲正状态和报销拆分。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="结算号" min-width="180">
          <template #default="{ row }">{{ row.settlementNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="订单" min-width="160">
          <template #default="{ row }">{{ row.paymentOrder?.orderNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="来源" prop="source" width="110" />
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="总金额" prop="totalAmount" width="110" />
        <el-table-column label="医保支付" min-width="120">
          <template #default="{ row }">{{ row.insuranceAmount || '-' }}</template>
        </el-table-column>
        <el-table-column label="自费" min-width="100">
          <template #default="{ row }">{{ row.selfPayAmount || '-' }}</template>
        </el-table-column>
        <el-table-column label="明细数" width="90">
          <template #default="{ row }">{{ row.items?.length || 0 }}</template>
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
import { fetchInsuranceSettlements } from '../api/hospital'

interface InsuranceSettlementRow {
  id: string
  settlementNo: string
  source: string
  status: string
  totalAmount: string | number
  insuranceAmount: string | number
  selfPayAmount: string | number
  createdAt: string
  paymentOrder?: { orderNo?: string }
  items?: unknown[]
}

const loading = ref(false)
const rows = ref<InsuranceSettlementRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchInsuranceSettlements()) as InsuranceSettlementRow[]
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
