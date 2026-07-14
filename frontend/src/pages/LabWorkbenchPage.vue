<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">LIS Workbench</p>
        <h1 class="page-title">检验工作台</h1>
        <p class="page-subtitle">处理检验申请、标本接收、结果录入、报告审核与发布。</p>
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
        <el-table-column label="状态" prop="status" width="140" />
        <el-table-column label="项目" min-width="220">
          <template #default="{ row }">{{ itemNames(row).join(' / ') }}</template>
        </el-table-column>
        <el-table-column label="条码" width="150">
          <template #default="{ row }">{{ row.sample?.barcode || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="430">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'REQUESTED'" @click="collect(row.id)">采样</el-button>
            <el-button size="small" :disabled="!row.sample || row.sample.status !== 'COLLECTED'" @click="receive(row.sample.id)">接收</el-button>
            <el-button size="small" :disabled="!canReject(row)" @click="reject(row.sample?.id)">拒收</el-button>
            <el-button size="small" type="primary" :disabled="row.status !== 'SAMPLE_RECEIVED' && row.status !== 'RESULTED'" @click="openResults(row)">录结果</el-button>
            <el-button size="small" :disabled="row.report?.status !== 'RESULTED'" @click="review(row.report?.id)">审核</el-button>
            <el-button size="small" type="success" :disabled="row.report?.status !== 'REVIEWED'" @click="publish(row.report?.id)">发布</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="resultVisible" title="录入检验结果" width="720px">
      <el-table :data="resultRows" border>
        <el-table-column label="项目" min-width="160">
          <template #default="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column label="结果" width="140">
          <template #default="{ row }"><el-input v-model="row.resultValue" /></template>
        </el-table-column>
        <el-table-column label="数值" width="130">
          <template #default="{ row }"><el-input-number v-model="row.numericValue" :controls="false" /></template>
        </el-table-column>
        <el-table-column label="单位" width="90">
          <template #default="{ row }"><el-input v-model="row.unit" /></template>
        </el-table-column>
      </el-table>
      <el-input v-model="summary" class="summary-input" type="textarea" placeholder="报告摘要" />
      <template #footer>
        <el-button @click="resultVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResults">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  collectLabSample,
  fetchLabRequests,
  publishLabReport,
  receiveLabSample,
  recordLabResults,
  rejectLabSample,
  reviewLabReport,
} from '../api/hospital'
import { optionalNumber } from './lab-workbench'

interface LabRequestRow {
  id: string
  requestNo: string
  status: string
  source: string
  user?: { displayName?: string }
  items?: Array<{ item?: { id: string; name: string; unit?: string; referenceLow?: string | number; referenceHigh?: string | number } }>
  sample?: { id: string; barcode?: string; status: string }
  report?: { id: string; status: string }
}

const loading = ref(false)
const rows = ref<LabRequestRow[]>([])
const resultVisible = ref(false)
const selectedReportId = ref('')
const summary = ref('')
const resultRows = ref<Array<{ itemId: string; name: string; resultValue: string; numericValue?: number; unit?: string; referenceLow?: number; referenceHigh?: number }>>([])

function itemNames(row: LabRequestRow) {
  return row.items?.map((item) => item.item?.name ?? '').filter(Boolean) ?? []
}

function canReject(row: LabRequestRow) {
  return (
    Boolean(row.sample) &&
    ['REQUESTED', 'SAMPLE_COLLECTED', 'SAMPLE_RECEIVED'].includes(row.status) &&
    !['RESULTED', 'REVIEWED', 'PUBLISHED'].includes(row.report?.status ?? '')
  )
}

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchLabRequests()) as LabRequestRow[]
  } finally {
    loading.value = false
  }
}

async function collect(id: string) {
  await collectLabSample(id)
  await load()
}

async function receive(id?: string) {
  if (!id) return
  await receiveLabSample(id)
  await load()
}

async function reject(id?: string) {
  if (!id) return
  await rejectLabSample(id, '标本不合格')
  await load()
}

function openResults(row: LabRequestRow) {
  selectedReportId.value = row.report?.id ?? ''
  resultRows.value = (row.items ?? []).map((item) => ({
    itemId: item.item?.id ?? '',
    name: item.item?.name ?? '',
    resultValue: '',
    numericValue: undefined,
    unit: item.item?.unit,
    referenceLow: optionalNumber(item.item?.referenceLow),
    referenceHigh: optionalNumber(item.item?.referenceHigh),
  }))
  summary.value = ''
  resultVisible.value = true
}

async function submitResults() {
  if (!selectedReportId.value) return
  await recordLabResults(selectedReportId.value, { summary: summary.value, results: resultRows.value.filter((row) => row.itemId && row.resultValue) })
  resultVisible.value = false
  await load()
}

async function review(id?: string) {
  if (!id) return
  await reviewLabReport(id)
  await load()
}

async function publish(id?: string) {
  if (!id) return
  await publishLabReport(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.summary-input {
  margin-top: 12px;
}
</style>
