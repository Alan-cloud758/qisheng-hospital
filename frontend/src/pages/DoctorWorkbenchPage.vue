<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Doctor Workspace</p>
        <h1 class="page-title">门诊医生工作台</h1>
        <p class="page-subtitle">查看待接诊队列，开始接诊并完成门诊记录。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="患者" min-width="120">
          <template #default="{ row }">{{ row.visitMember?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="科室" min-width="120">
          <template #default="{ row }">{{ row.department?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="号源时间" min-width="180">
          <template #default="{ row }">{{ row.slot?.startTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'CHECKED_IN'" @click="start(row.id)">开始接诊</el-button>
            <el-button
              size="small"
              type="success"
              :disabled="!row.encounter || row.encounter.status !== 'OPEN'"
              @click="complete(row.encounter.id)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { completeEncounter, fetchDoctorQueue, startEncounter } from '../api/hospital'

interface DoctorQueueRow {
  id: string
  status: string
  visitMember?: { name?: string }
  department?: { name?: string }
  slot?: { startTime?: string }
  encounter?: { id: string; status: string }
}

const loading = ref(false)
const rows = ref<DoctorQueueRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchDoctorQueue()) as DoctorQueueRow[]
  } finally {
    loading.value = false
  }
}

async function start(id: string) {
  await startEncounter(id)
  await load()
}

async function complete(id: string) {
  await completeEncounter(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>
