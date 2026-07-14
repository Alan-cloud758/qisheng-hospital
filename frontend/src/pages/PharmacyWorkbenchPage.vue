<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Pharmacy Desk</p>
        <h1 class="page-title">药房工作台</h1>
        <p class="page-subtitle">审核医生提交的处方，并完成发药状态流转。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="处方ID" prop="id" min-width="180" />
        <el-table-column label="医生" min-width="120">
          <template #default="{ row }">{{ row.doctor?.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="药品数" width="100">
          <template #default="{ row }">{{ row.items?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'SUBMITTED'" @click="review(row.id)">审核</el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'REVIEWED'" @click="dispense(row.id)">发药</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { dispensePrescription, fetchPharmacyPrescriptions, reviewPrescription } from '../api/hospital'

interface PrescriptionRow {
  id: string
  status: string
  doctor?: { user?: { displayName?: string } }
  items?: unknown[]
}

const loading = ref(false)
const rows = ref<PrescriptionRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchPharmacyPrescriptions()) as PrescriptionRow[]
  } finally {
    loading.value = false
  }
}

async function review(id: string) {
  await reviewPrescription(id)
  await load()
}

async function dispense(id: string) {
  await dispensePrescription(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>
