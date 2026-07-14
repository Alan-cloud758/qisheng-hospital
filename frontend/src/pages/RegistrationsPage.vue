<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Registration Desk</p>
        <h1 class="page-title">预约与签到</h1>
        <p class="page-subtitle">查看患者预约状态，并对已预约记录执行签到。</p>
      </div>
      <div class="registration-actions">
        <el-select v-model="statusFilter" clearable placeholder="全部状态" @change="load">
          <el-option label="已预约" value="BOOKED" />
          <el-option label="已签到" value="CHECKED_IN" />
          <el-option label="就诊中" value="IN_VISIT" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="爽约" value="NO_SHOW" />
          <el-option label="已取消" value="CANCELLED" />
        </el-select>
        <el-button @click="load">刷新</el-button>
      </div>
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
        <el-table-column label="排队号" width="100">
          <template #default="{ row }">{{ row.queueTicket?.queueNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="改约历史" min-width="150">
          <template #default="{ row }">
            {{ changeLogText(row) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'BOOKED'" @click="checkIn(row.id)">签到</el-button>
            <el-button size="small" type="warning" :disabled="row.status !== 'BOOKED'" @click="noShow(row.id)">爽约</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { checkInRegistration, fetchRegistrations, markRegistrationNoShow } from '../api/hospital'

interface RegistrationRow {
  id: string
  registrationNo: string
  status: string
  visitMember?: { name?: string }
  department?: { name?: string }
  doctor?: { user?: { displayName?: string } }
  changeLogs?: Array<{ action: string; createdAt: string; fromSlot?: { startTime?: string }; toSlot?: { startTime?: string } }>
}

const loading = ref(false)
const rows = ref<RegistrationRow[]>([])
const statusFilter = ref('')

function changeLogText(row: RegistrationRow) {
  const logs = row.changeLogs ?? []
  if (logs.length === 0) return '-'
  const latest = logs[0]
  const fromTime = latest.fromSlot?.startTime?.slice(0, 16).replace('T', ' ') ?? '-'
  const toTime = latest.toSlot?.startTime?.slice(0, 16).replace('T', ' ') ?? '-'
  return `${logs.length} 次，最近：${fromTime} → ${toTime}`
}

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchRegistrations({ status: statusFilter.value || undefined })) as RegistrationRow[]
  } finally {
    loading.value = false
  }
}

async function checkIn(id: string) {
  await checkInRegistration(id)
  await load()
}

async function noShow(id: string) {
  await markRegistrationNoShow(id, '后台标记爽约')
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.registration-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
