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
      <div class="queue-toolbar">
        <strong>今日队列</strong>
        <el-button type="primary" @click="callNext">叫下一位</el-button>
      </div>
      <el-table :data="queueTickets" border>
        <el-table-column label="号码" prop="queueNo" width="80" />
        <el-table-column label="患者" min-width="120">
          <template #default="{ row }">{{ row.registration?.visitMember?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="110" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'WAITING' && row.status !== 'CALLED'" @click="skip(row.id)">跳过</el-button>
            <el-button size="small" :disabled="row.status !== 'SKIPPED'" @click="restore(row.id)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

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
            <el-button size="small" :disabled="!row.encounter || row.encounter.status !== 'OPEN'" @click="openTemplates(row)">模板</el-button>
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

    <el-drawer v-model="templateVisible" title="临床模板" size="560px">
      <section v-if="selectedEncounter" class="template-stack">
        <div>
          <h3>病历模板</h3>
          <div class="template-row">
            <el-select v-model="templateForm.recordTemplateId" filterable placeholder="选择病历模板">
              <el-option v-for="item in templateData.recordTemplates" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button type="primary" @click="applyRecord">套用</el-button>
          </div>
        </div>

        <div>
          <h3>常用诊断</h3>
          <div class="template-row">
            <el-select v-model="templateForm.diagnosisId" filterable placeholder="选择诊断">
              <el-option v-for="item in templateData.diagnoses" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button @click="addDiagnosis">添加</el-button>
          </div>
        </div>

        <div>
          <h3>常用医嘱</h3>
          <div class="template-row">
            <el-select v-model="templateForm.orderId" filterable placeholder="选择医嘱">
              <el-option v-for="item in templateData.orders" :key="item.id" :label="item.content" :value="item.id" />
            </el-select>
            <el-button @click="addOrder">添加</el-button>
          </div>
        </div>

        <div>
          <h3>检验申请</h3>
          <div class="template-row">
            <el-select v-model="templateForm.labItemIds" multiple filterable placeholder="选择检验项目">
              <el-option v-for="item in labItems" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button type="primary" @click="createLabRequest">开检验</el-button>
          </div>
        </div>

        <div>
          <h3>处方模板</h3>
          <div class="template-row">
            <el-select v-model="templateForm.prescriptionTemplateId" filterable placeholder="选择处方模板">
              <el-option v-for="item in templateData.prescriptionTemplates" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-button type="primary" @click="createPrescription">生成处方</el-button>
          </div>
        </div>

        <div>
          <h3>处方状态</h3>
          <el-table :data="selectedEncounter.prescriptions || []" border>
            <el-table-column label="处方" prop="id" min-width="160" />
            <el-table-column label="状态" prop="status" width="110" />
            <el-table-column label="驳回原因" prop="rejectedReason" min-width="160" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" :disabled="row.status !== 'REJECTED'" @click="resubmit(row.id)">重提交</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </section>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  applyEncounterRecordTemplate,
  callNextQueuePatient,
  completeEncounter,
  createEncounterDiagnosis,
  createEncounterOrder,
  createEncounterLabRequest,
  createPrescriptionFromTemplate,
  fetchDoctorClinicalTemplates,
  fetchDoctorLabItems,
  fetchDoctorQueue,
  fetchDoctorQueueTickets,
  resubmitPrescription,
  restoreQueueTicket,
  skipQueueTicket,
  startEncounter,
} from '../api/hospital'

interface TemplateRow {
  id: string
  name?: string
  code?: string
  note?: string
  type?: string
  content?: string
}

interface LabItemRow {
  id: string
  name: string
}

interface PrescriptionRow {
  id: string
  status: string
  rejectedReason?: string
}

interface DoctorQueueRow {
  id: string
  status: string
  visitMember?: { name?: string }
  department?: { name?: string }
  slot?: { startTime?: string }
  encounter?: { id: string; status: string; prescriptions?: PrescriptionRow[] }
  queueTicket?: { id: string; queueNo: number; status: string }
}

interface QueueTicketRow {
  id: string
  queueNo: number
  status: string
  registration?: { visitMember?: { name?: string } }
}

const loading = ref(false)
const rows = ref<DoctorQueueRow[]>([])
const queueTickets = ref<QueueTicketRow[]>([])
const labItems = ref<LabItemRow[]>([])
const templateVisible = ref(false)
const selectedEncounter = ref<DoctorQueueRow['encounter'] | null>(null)
const selectedEncounterId = ref('')
const templateData = reactive({
  recordTemplates: [] as TemplateRow[],
  diagnoses: [] as TemplateRow[],
  orders: [] as TemplateRow[],
  prescriptionTemplates: [] as TemplateRow[],
})
const templateForm = reactive({
  recordTemplateId: '',
  diagnosisId: '',
  orderId: '',
  labItemIds: [] as string[],
  prescriptionTemplateId: '',
})

async function load() {
  loading.value = true
  try {
    const [queue, tickets, templates, lab] = await Promise.all([fetchDoctorQueue(), fetchDoctorQueueTickets(), fetchDoctorClinicalTemplates(), fetchDoctorLabItems()])
    rows.value = queue as DoctorQueueRow[]
    queueTickets.value = tickets as QueueTicketRow[]
    labItems.value = lab as LabItemRow[]
    templateData.recordTemplates = templates.recordTemplates as TemplateRow[]
    templateData.diagnoses = templates.diagnoses as TemplateRow[]
    templateData.orders = templates.orders as TemplateRow[]
    templateData.prescriptionTemplates = templates.prescriptionTemplates as TemplateRow[]
    if (selectedEncounterId.value) {
      selectedEncounter.value = rows.value.find((row) => row.encounter?.id === selectedEncounterId.value)?.encounter ?? null
    }
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

async function callNext() {
  await callNextQueuePatient()
  await load()
}

async function skip(id: string) {
  await skipQueueTicket(id)
  await load()
}

async function restore(id: string) {
  await restoreQueueTicket(id)
  await load()
}

function openTemplates(row: DoctorQueueRow) {
  selectedEncounter.value = row.encounter ?? null
  selectedEncounterId.value = row.encounter?.id ?? ''
  templateVisible.value = true
}

function selectedDiagnosis() {
  return templateData.diagnoses.find((item) => item.id === templateForm.diagnosisId)
}

function selectedOrder() {
  return templateData.orders.find((item) => item.id === templateForm.orderId)
}

async function applyRecord() {
  if (!selectedEncounter.value || !templateForm.recordTemplateId) return
  await applyEncounterRecordTemplate(selectedEncounter.value.id, templateForm.recordTemplateId)
  await load()
}

async function addDiagnosis() {
  if (!selectedEncounter.value) return
  const item = selectedDiagnosis()
  if (!item) return
  await createEncounterDiagnosis(selectedEncounter.value.id, { code: item.code, name: item.name, note: item.note })
  await load()
}

async function addOrder() {
  if (!selectedEncounter.value) return
  const item = selectedOrder()
  if (!item) return
  await createEncounterOrder(selectedEncounter.value.id, { type: item.type, content: item.content })
  await load()
}

async function createLabRequest() {
  if (!selectedEncounter.value || templateForm.labItemIds.length === 0) return
  await createEncounterLabRequest(selectedEncounter.value.id, { itemIds: templateForm.labItemIds })
  templateForm.labItemIds = []
  await load()
}

async function createPrescription() {
  if (!selectedEncounter.value || !templateForm.prescriptionTemplateId) return
  await createPrescriptionFromTemplate(selectedEncounter.value.id, templateForm.prescriptionTemplateId)
  await load()
}

async function resubmit(id: string) {
  await resubmitPrescription(id)
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.template-stack {
  display: grid;
  gap: 22px;
}

.template-stack h3 {
  margin: 0 0 10px;
}

.template-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.queue-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>
