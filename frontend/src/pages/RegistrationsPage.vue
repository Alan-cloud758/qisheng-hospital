<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Registration Desk</p>
        <h1 class="page-title">预约与签到</h1>
        <p class="page-subtitle">查看患者预约状态，并对已预约记录执行签到。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="挂号单号" prop="registrationNo" min-width="160" />
        <el-table-column label="患者" min-width="120">
          <template #default="{ row }">{{ row.visitMember?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="科室" min-width="120">
          <template #default="{ row }">{{ row.department?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="医生" min-width="120">
          <template #default="{ row }">{{ row.doctor?.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'BOOKED'" @click="checkIn(row.id)">签到</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { checkInRegistration, fetchRegistrations } from '../api/hospital'

interface RegistrationRow {
  id: string
  registrationNo: string
  status: string
  visitMember?: { name?: string }
  department?: { name?: string }
  doctor?: { user?: { displayName?: string } }
}

const loading = ref(false)
const rows = ref<RegistrationRow[]>([])

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchRegistrations()) as RegistrationRow[]
  } finally {
    loading.value = false
  }
}

async function checkIn(id: string) {
  await checkInRegistration(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>
