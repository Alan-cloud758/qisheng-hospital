<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Cashier Desk</p>
        <h1 class="page-title">收费工作台</h1>
        <p class="page-subtitle">处理挂号、诊查和处方产生的待支付订单。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="订单号" prop="orderNo" min-width="160" />
        <el-table-column label="标题" prop="title" min-width="220" />
        <el-table-column label="金额" prop="amount" width="100" />
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" :disabled="row.status !== 'PENDING'" @click="pay(row.id)">模拟收费</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchPaymentOrders, payOrder } from '../api/hospital'

interface PaymentOrderRow {
  id: string
  orderNo: string
  title: string
  amount: string | number
  status: string
}

const loading = ref(false)
const rows = ref<PaymentOrderRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchPaymentOrders()) as PaymentOrderRow[]
  } finally {
    loading.value = false
  }
}

async function pay(id: string) {
  await payOrder(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>
