<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Surgery Management</p>
        <h1 class="page-title">手术管理工作台</h1>
        <p class="page-subtitle">管理手术申请、手术排班、手术开始和完成。</p>
      </div>
      <el-button @click="loadAll" :loading="loading">刷新</el-button>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="手术申请" name="requests">
        <div style="margin-bottom:12px;">
          <el-button type="primary" @click="openCreateRequest">新建申请</el-button>
        </div>
        <el-table v-loading="loading" :data="requests" border stripe>
          <el-table-column label="申请号" prop="requestNo" min-width="150" />
          <el-table-column label="患者" min-width="100">
            <template #default="{ row }">{{ row.patientName || row.patient?.realName || '-' }}</template>
          </el-table-column>
          <el-table-column label="手术名称" prop="surgeryName" min-width="160" />
          <el-table-column label="术者" min-width="100">
            <template #default="{ row }">{{ row.surgeonName || row.surgeon?.user?.displayName || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <span class="badge" :class="requestStatusClass(row.status)">{{ requestStatusLabel(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button size="small" type="primary" :disabled="row.status === 'SCHEDULED' || row.status === 'COMPLETED'" @click="openSchedule(row)">排班</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="手术排班" name="schedules">
        <el-table v-loading="loading" :data="schedules" border stripe>
          <el-table-column label="手术名称" prop="surgeryName" min-width="160">
            <template #default="{ row }">{{ row.surgeryName || row.request?.surgeryName || '-' }}</template>
          </el-table-column>
          <el-table-column label="患者" min-width="100">
            <template #default="{ row }">{{ row.patientName || row.request?.patientName || '-' }}</template>
          </el-table-column>
          <el-table-column label="手术室" min-width="120">
            <template #default="{ row }">{{ row.roomName || row.room?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="计划时间" min-width="170">
            <template #default="{ row }">{{ formatDate(row.scheduledAt || row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <span class="badge" :class="scheduleStatusClass(row.status)">{{ scheduleStatusLabel(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button size="small" type="primary" :disabled="row.status !== 'SCHEDULED'" @click="startSurgery(row.id)">开始手术</el-button>
              <el-button size="small" type="success" :disabled="row.status !== 'IN_PROGRESS'" @click="completeSurgery(row.id)">完成手术</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Create Request Dialog -->
    <el-dialog v-model="requestDialogVisible" title="新建手术申请" width="520px">
      <el-form :model="requestForm" label-width="90px">
        <el-form-item label="患者ID" required>
          <el-input v-model="requestForm.patientId" placeholder="患者ID" />
        </el-form-item>
        <el-form-item label="手术名称" required>
          <el-input v-model="requestForm.surgeryName" placeholder="手术名称" />
        </el-form-item>
        <el-form-item label="术者ID">
          <el-input v-model="requestForm.surgeonId" placeholder="术者医生ID" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="requestForm.note" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="requestDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRequest">提交</el-button>
      </template>
    </el-dialog>

    <!-- Schedule Dialog -->
    <el-dialog v-model="scheduleDialogVisible" title="手术排班" width="520px">
      <el-form :model="scheduleForm" label-width="90px">
        <el-form-item label="手术室" required>
          <el-select v-model="scheduleForm.roomId" placeholder="选择手术室" style="width:100%">
            <el-option v-for="room in rooms" :key="room.id" :label="room.name" :value="room.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划时间" required>
          <el-date-picker v-model="scheduleForm.scheduledAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" placeholder="选择时间" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitSchedule">确认排班</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '../api/client'

interface SurgeryRequest {
  id: string
  requestNo?: string
  surgeryName?: string
  patientName?: string
  patient?: { realName?: string }
  surgeonName?: string
  surgeon?: { user?: { displayName?: string } }
  status: string
}

interface SurgeryRoom {
  id: string
  name: string
}

interface SurgerySchedule {
  id: string
  surgeryName?: string
  patientName?: string
  request?: { surgeryName?: string; patientName?: string }
  roomName?: string
  room?: { name?: string }
  scheduledAt?: string
  startTime?: string
  status: string
}

const loading = ref(false)
const submitting = ref(false)
const activeTab = ref('requests')
const requests = ref<SurgeryRequest[]>([])
const schedules = ref<SurgerySchedule[]>([])
const rooms = ref<SurgeryRoom[]>([])

const requestDialogVisible = ref(false)
const scheduleDialogVisible = ref(false)
const schedulingRequestId = ref('')

const requestForm = reactive({ patientId: '', surgeryName: '', surgeonId: '', note: '' })
const scheduleForm = reactive({ roomId: '', scheduledAt: '' })

function formatDate(val?: string) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

function requestStatusClass(s: string) {
  const map: Record<string, string> = { PENDING: 'badge-warning', APPROVED: 'badge-info', SCHEDULED: 'badge-success', REJECTED: 'badge-danger' }
  return map[s] ?? 'badge-muted'
}

function requestStatusLabel(s: string) {
  const map: Record<string, string> = { PENDING: '待审批', APPROVED: '已批准', SCHEDULED: '已排班', REJECTED: '已拒绝' }
  return map[s] ?? s
}

function scheduleStatusClass(s: string) {
  const map: Record<string, string> = { SCHEDULED: 'badge-info', IN_PROGRESS: 'badge-warning', COMPLETED: 'badge-success' }
  return map[s] ?? 'badge-muted'
}

function scheduleStatusLabel(s: string) {
  const map: Record<string, string> = { SCHEDULED: '待手术', IN_PROGRESS: '进行中', COMPLETED: '已完成' }
  return map[s] ?? s
}

async function loadAll() {
  loading.value = true
  try {
    const [reqRes, schedRes, roomRes] = await Promise.all([
      apiClient.get('/admin/surgery/requests'),
      apiClient.get('/admin/surgery/schedules'),
      apiClient.get('/admin/surgery/rooms'),
    ])
    requests.value = Array.isArray(reqRes.data) ? reqRes.data : (reqRes.data.data ?? reqRes.data.items ?? [])
    schedules.value = Array.isArray(schedRes.data) ? schedRes.data : (schedRes.data.data ?? schedRes.data.items ?? [])
    rooms.value = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data.data ?? roomRes.data.items ?? [])
  } finally {
    loading.value = false
  }
}

function openCreateRequest() {
  requestForm.patientId = ''
  requestForm.surgeryName = ''
  requestForm.surgeonId = ''
  requestForm.note = ''
  requestDialogVisible.value = true
}

async function submitRequest() {
  if (!requestForm.patientId || !requestForm.surgeryName) return
  submitting.value = true
  try {
    await apiClient.post('/admin/surgery/requests', requestForm)
    requestDialogVisible.value = false
    ElMessage.success('手术申请已提交')
    await loadAll()
  } finally {
    submitting.value = false
  }
}

function openSchedule(row: SurgeryRequest) {
  schedulingRequestId.value = row.id
  scheduleForm.roomId = ''
  scheduleForm.scheduledAt = ''
  scheduleDialogVisible.value = true
}

async function submitSchedule() {
  if (!scheduleForm.roomId || !scheduleForm.scheduledAt) return
  submitting.value = true
  try {
    await apiClient.post('/admin/surgery/schedules', {
      requestId: schedulingRequestId.value,
      roomId: scheduleForm.roomId,
      scheduledAt: scheduleForm.scheduledAt,
    })
    scheduleDialogVisible.value = false
    ElMessage.success('排班成功')
    await loadAll()
  } finally {
    submitting.value = false
  }
}

async function startSurgery(id: string) {
  await apiClient.post(`/admin/surgery/schedules/${id}/start`)
  ElMessage.success('手术已开始')
  await loadAll()
}

async function completeSurgery(id: string) {
  await apiClient.post(`/admin/surgery/schedules/${id}/complete`)
  ElMessage.success('手术已完成')
  await loadAll()
}

onMounted(() => { void loadAll() })
</script>

<style scoped>
.el-tabs {
  margin-bottom: var(--space-2);
}
</style>
