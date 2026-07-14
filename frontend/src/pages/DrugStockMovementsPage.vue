<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Inventory Ledger</p>
        <h1 class="page-title">库存流水</h1>
        <p class="page-subtitle">追踪药品库存每一次数量变化和关联处方。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="药品" min-width="160">
          <template #default="{ row }">{{ row.drug?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="批号" min-width="120">
          <template #default="{ row }">{{ row.batch?.batchNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="类型" prop="type" width="110" />
        <el-table-column label="变化" prop="quantity" width="90" />
        <el-table-column label="变更前" prop="beforeQuantity" width="90" />
        <el-table-column label="变更后" prop="afterQuantity" width="90" />
        <el-table-column label="处方" prop="prescriptionId" min-width="180" />
        <el-table-column label="操作人" min-width="120">
          <template #default="{ row }">{{ row.operator?.displayName || row.operator?.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="原因" prop="reason" min-width="180" />
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchDrugStockMovements } from '../api/hospital'

interface MovementRow {
  id: string
  type: string
  quantity: number
  beforeQuantity: number
  afterQuantity: number
  prescriptionId?: string
  reason?: string
  createdAt: string
  drug?: { name?: string }
  batch?: { batchNo?: string }
  operator?: { username?: string; displayName?: string }
}

const loading = ref(false)
const rows = ref<MovementRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchDrugStockMovements()) as MovementRow[]
  } finally {
    loading.value = false
  }
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString() : '-'
}

onMounted(() => {
  void load()
})
</script>
