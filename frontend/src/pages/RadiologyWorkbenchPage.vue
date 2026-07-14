<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">PACS Workbench</p>
        <h1 class="page-title">影像工作台</h1>
        <p class="page-subtitle">处理影像申请、预约签到、检查完成、报告录入、审核与发布。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="申请号" prop="requestNo" min-width="170" />
        <el-table-column label="患者" min-width="120">
          <template #default="{ row }">{{ row.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="来源" prop="source" width="110" />
        <el-table-column label="状态" prop="status" width="130" />
        <el-table-column label="项目" min-width="220">
          <template #default="{ row }">{{ itemNames(row).join(' / ') }}</template>
        </el-table-column>
        <el-table-column label="检查链接" min-width="180">
          <template #default="{ row }">
            <a v-if="row.study?.imageUrl" :href="row.study.imageUrl" target="_blank">{{ row.study.studyUid }}</a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="470">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'REQUESTED'" @click="openSchedule(row)">预约</el-button>
            <el-button size="small" :disabled="!row.appointment || row.appointment.status !== 'SCHEDULED'" @click="checkIn(row.appointment?.id)">签到</el-button>
            <el-button size="small" :disabled="!row.appointment || row.appointment.status !== 'CHECKED_IN'" @click="completeStudy(row.appointment?.id)">完成检查</el-button>
            <el-button size="small" type="primary" :disabled="row.status !== 'COMPLETED' && row.status !== 'REPORTED'" @click="openReport(row)">写报告</el-button>
            <el-button size="small" :disabled="row.report?.status !== 'REPORTED'" @click="review(row.report?.id)">审核</el-button>
            <el-button size="small" type="success" :disabled="row.report?.status !== 'REVIEWED'" @click="publish(row.report?.id)">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="scheduleVisible" title="预约检查" width="520px">
      <el-form label-width="86px">
        <el-form-item label="时间"><el-input v-model="scheduleForm.scheduledAt" placeholder="2026-07-14T09:00:00" /></el-form-item>
        <el-form-item label="机房"><el-input v-model="scheduleForm.room" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSchedule">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportVisible" title="录入影像报告" width="640px">
      <el-form label-width="86px">
        <el-form-item label="所见"><el-input v-model="reportForm.findings" type="textarea" /></el-form-item>
        <el-form-item label="结论"><el-input v-model="reportForm.impression" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  checkInImagingAppointment,
  completeImagingStudy,
  fetchImagingRequests,
  publishImagingReport,
  recordImagingReport,
  reviewImagingReport,
  scheduleImagingRequest,
} from '../api/hospital'

interface ImagingRequestRow {
  id: string
  requestNo: string
  status: string
  source: string
  user?: { displayName?: string }
  items?: Array<{ item?: { name: string } }>
  appointment?: { id: string; status: string }
  study?: { studyUid?: string; imageUrl?: string }
  report?: { id: string; status: string; findings?: string; impression?: string }
}

const loading = ref(false)
const rows = ref<ImagingRequestRow[]>([])
const scheduleVisible = ref(false)
const reportVisible = ref(false)
const selectedRequestId = ref('')
const selectedReportId = ref('')
const scheduleForm = reactive({ scheduledAt: '', room: '' })
const reportForm = reactive({ findings: '', impression: '' })

function itemNames(row: ImagingRequestRow) {
  return row.items?.map((item) => item.item?.name ?? '').filter(Boolean) ?? []
}

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchImagingRequests()) as ImagingRequestRow[]
  } finally {
    loading.value = false
  }
}

function openSchedule(row: ImagingRequestRow) {
  selectedRequestId.value = row.id
  scheduleForm.scheduledAt = new Date().toISOString().slice(0, 16)
  scheduleForm.room = ''
  scheduleVisible.value = true
}

async function submitSchedule() {
  if (!selectedRequestId.value || !scheduleForm.scheduledAt) return
  await scheduleImagingRequest(selectedRequestId.value, { scheduledAt: scheduleForm.scheduledAt, room: scheduleForm.room || undefined })
  scheduleVisible.value = false
  await load()
}

async function checkIn(id?: string) {
  if (!id) return
  await checkInImagingAppointment(id)
  await load()
}

async function completeStudy(id?: string) {
  if (!id) return
  await completeImagingStudy(id)
  await load()
}

function openReport(row: ImagingRequestRow) {
  selectedReportId.value = row.report?.id ?? ''
  reportForm.findings = row.report?.findings ?? ''
  reportForm.impression = row.report?.impression ?? ''
  reportVisible.value = true
}

async function submitReport() {
  if (!selectedReportId.value) return
  await recordImagingReport(selectedReportId.value, { findings: reportForm.findings, impression: reportForm.impression })
  reportVisible.value = false
  await load()
}

async function review(id?: string) {
  if (!id) return
  await reviewImagingReport(id)
  await load()
}

async function publish(id?: string) {
  if (!id) return
  await publishImagingReport(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>
