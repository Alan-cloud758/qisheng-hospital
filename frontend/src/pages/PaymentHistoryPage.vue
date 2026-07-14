<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Payments</p>
        <h1 class="page-title">支付记录</h1>
        <p class="page-subtitle">查看支付订单、交易和退款流水。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="订单号" prop="orderNo" min-width="160" />
        <el-table-column label="标题" prop="title" min-width="180" />
        <el-table-column label="金额" prop="amount" width="100" />
        <el-table-column label="状态" prop="status" width="110" />
        <el-table-column label="交易流水" min-width="220">
          <template #default="{ row }">
            {{ firstTransaction(row) }}
          </template>
        </el-table-column>
        <el-table-column label="退款" min-width="160">
          <template #default="{ row }">
            {{ row.refundOrders?.length || 0 }} 笔
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminPaymentOrders } from '../api/hospital'

type PaymentHistoryRow = {
  orderNo: string
  title: string
  amount: string | number
  status: string
  transactions?: Array<{ transactionNo?: string; status?: string }>
  refundOrders?: unknown[]
}

const loading = ref(false)
const rows = ref<PaymentHistoryRow[]>([])

function firstTransaction(row: PaymentHistoryRow) {
  const transaction = row.transactions?.[0]
  if (!transaction) return '-'
  return `${transaction.transactionNo || '-'} / ${transaction.status || '-'}`
}

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchAdminPaymentOrders()) as PaymentHistoryRow[]
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>
