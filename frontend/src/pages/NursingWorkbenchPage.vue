<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Nursing Station</p>
        <h1 class="page-title">护理工作站</h1>
        <p class="page-subtitle">查看住院患者列表、记录生命体征、护理评估和执行医嘱。</p>
      </div>
      <el-button @click="loadPatients" :loading="loading">刷新</el-button>
    </div>

    <div class="nursing-layout">
      <!-- Patient List -->
      <section class="panel patient-list-panel">
        <h2 style="margin:0 0 12px;font-size:var(--text-lg);">住院患者</h2>
        <el-input v-model="patientSearch" clearable placeholder="搜索患者姓名" style="margin-bottom:12px;" />
        <div class="patient-list">
          <div
            v-for="p in filteredPatients"
            :key="p.id"
            class="patient-item"
            :class="{ 'patient-item-active': selectedPatientId === p.id }"
            @click="selectPatient(p)"
          >
            <div class="patient-name">{{ p.patientName || p.patient?.realName || '未知' }}</div>
            <div class="patient-bed">{{ p.bedNo || p.bed?.bedNo || '-' }}</div>
          </div>
          <el-empty v-if="filteredPatients.length === 0" description="暂无患者" :image-size="48" />
        </div>
      </section>

      <!-- Detail Panel -->
      <section class="panel detail-panel">
        <template v-if="!selectedPatientId">
          <el-empty description="请从左侧选择患者" :image-size="80" />
        </template>
        <template v-else>
          <div class="patient-header">
            <h2>{{ selectedPatientName }} - {{ selectedBedNo }}</h2>
          </div>

          <el-tabs v-model="detailTab">
            <!-- Vital Signs -->
            <el-tab-pane label="生命体征" name="vitals">
              <div style="margin-bottom:12px;">
                <el-button type="primary" size="small" @click="openVitalDialog">记录体征</el-button>
              </div>
              <el-table :data="vitalSigns" border size="small" v-loading="detailLoading">
                <el-table-column label="体温(℃)" prop="temperature" width="90" />
                <el-table-column label="脉搏" prop="pulse" width="80" />
                <el-table-column label="呼吸" prop="respiration" width="80" />
                <el-table-column label="血压(mmHg)" width="120">
                  <template #default="{ row }">{{ row.systolicBP }}/{{ row.diastolicBP }}</template>
                </el-table-column>
                <el-table-column label="血氧(%)" prop="oxygenSaturation" width="90" />
                <el-table-column label="记录时间" min-width="170">
                  <template #default="{ row }">{{ formatDate(row.recordedAt || row.createdAt) }}</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- Assessments -->
            <el-tab-pane label="护理评估" name="assessments">
              <div style="margin-bottom:12px;">
                <el-button type="primary" size="small" @click="openAssessmentDialog">新建评估</el-button>
              </div>
              <el-table :data="assessments" border size="small" v-loading="detailLoading">
                <el-table-column label="类型" prop="type" width="120" />
                <el-table-column label="评分" prop="score" width="80" />
                <el-table-column label="内容" prop="content" min-width="200" show-overflow-tooltip />
                <el-table-column label="护士" min-width="100">
                  <template #default="{ row }">{{ row.nurseName || row.nurse?.user?.displayName || '-' }}</template>
                </el-table-column>
                <el-table-column label="时间" min-width="170">
                  <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- Executions -->
            <el-tab-pane label="医嘱执行" name="executions">
              <el-table :data="executions" border size="small" v-loading="detailLoading">
                <el-table-column label="医嘱内容" prop="orderContent" min-width="200" show-overflow-tooltip />
                <el-table-column label="类型" prop="type" width="100" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <span class="badge" :class="row.status === 'EXECUTED' ? 'badge-success' : 'badge-warning'">
                      {{ row.status === 'EXECUTED' ? '已执行' : '待执行' }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="计划时间" min-width="170">
                  <template #default="{ row }">{{ formatDate(row.scheduledAt) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button size="small" type="primary" :disabled="row.status === 'EXECUTED'" @click="executeOrder(row.id)">执行</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </template>
      </section>
    </div>

    <!-- Vital Signs Dialog -->
    <el-dialog v-model="vitalDialogVisible" title="记录生命体征" width="480px">
      <el-form :model="vitalForm" label-width="90px">
        <el-form-item label="体温(℃)">
          <el-input-number v-model="vitalForm.temperature" :min="30" :max="45" :precision="1" :step="0.1" />
        </el-form-item>
        <el-form-item label="脉搏(次/分)">
          <el-input-number v-model="vitalForm.pulse" :min="0" :max="300" />
        </el-form-item>
        <el-form-item label="呼吸(次/分)">
          <el-input-number v-model="vitalForm.respiration" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="收缩压(mmHg)">
          <el-input-number v-model="vitalForm.systolicBP" :min="0" :max="300" />
        </el-form-item>
        <el-form-item label="舒张压(mmHg)">
          <el-input-number v-model="vitalForm.diastolicBP" :min="0" :max="200" />
        </el-form-item>
        <el-form-item label="血氧(%)">
          <el-input-number v-model="vitalForm.oxygenSaturation" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vitalDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVitals">保存</el-button>
      </template>
    </el-dialog>

    <!-- Assessment Dialog -->
    <el-dialog v-model="assessmentDialogVisible" title="新建护理评估" width="480px">
      <el-form :model="assessmentForm" label-width="80px">
        <el-form-item label="类型" required>
          <el-select v-model="assessmentForm.type" placeholder="选择评估类型" style="width:100%">
            <el-option label="入院评估" value="ADMISSION" />
            <el-option label="跌倒风险" value="FALL_RISK" />
            <el-option label="压疮风险" value="PRESSURE_ULCER" />
            <el-option label="疼痛评估" value="PAIN" />
            <el-option label="营养评估" value="NUTRITION" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="assessmentForm.score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="assessmentForm.content" type="textarea" :rows="4" placeholder="评估内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assessmentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAssessment">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '../api/client'

interface Admission {
  id: string
  patientName?: string
  patient?: { realName?: string }
  bedNo?: string
  bed?: { bedNo?: string }
}

interface VitalSign {
  id: string
  temperature?: number
  pulse?: number
  respiration?: number
  systolicBP?: number
  diastolicBP?: number
  oxygenSaturation?: number
  recordedAt?: string
  createdAt?: string
}

interface Assessment {
  id: string
  type?: string
  score?: number
  content?: string
  nurseName?: string
  nurse?: { user?: { displayName?: string } }
  createdAt?: string
}

interface Execution {
  id: string
  orderContent?: string
  type?: string
  status: string
  scheduledAt?: string
}

const loading = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)
const patients = ref<Admission[]>([])
const patientSearch = ref('')
const selectedPatientId = ref('')
const selectedPatientName = ref('')
const selectedBedNo = ref('')
const detailTab = ref('vitals')

const vitalSigns = ref<VitalSign[]>([])
const assessments = ref<Assessment[]>([])
const executions = ref<Execution[]>([])

const vitalDialogVisible = ref(false)
const assessmentDialogVisible = ref(false)

const vitalForm = reactive({
  temperature: undefined as number | undefined,
  pulse: undefined as number | undefined,
  respiration: undefined as number | undefined,
  systolicBP: undefined as number | undefined,
  diastolicBP: undefined as number | undefined,
  oxygenSaturation: undefined as number | undefined,
})

const assessmentForm = reactive({ type: '', score: undefined as number | undefined, content: '' })

const filteredPatients = computed(() => {
  const q = patientSearch.value.trim().toLowerCase()
  if (!q) return patients.value
  return patients.value.filter((p) => {
    const name = (p.patientName || p.patient?.realName || '').toLowerCase()
    return name.includes(q)
  })
})

function formatDate(val?: string) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

async function loadPatients() {
  loading.value = true
  try {
    const { data } = await apiClient.get('/staff/nurse/admissions')
    patients.value = Array.isArray(data) ? data : (data.data ?? data.items ?? [])
  } finally {
    loading.value = false
  }
}

function selectPatient(p: Admission) {
  selectedPatientId.value = p.id
  selectedPatientName.value = p.patientName || p.patient?.realName || '未知'
  selectedBedNo.value = p.bedNo || p.bed?.bedNo || '-'
}

async function loadDetail() {
  if (!selectedPatientId.value) return
  detailLoading.value = true
  try {
    const id = selectedPatientId.value
    const [vRes, aRes, eRes] = await Promise.all([
      apiClient.get(`/staff/nursing/vital-signs/${id}`),
      apiClient.get(`/staff/nursing/assessments/${id}`),
      apiClient.get(`/staff/nursing/executions/${id}`),
    ])
    vitalSigns.value = Array.isArray(vRes.data) ? vRes.data : (vRes.data.data ?? vRes.data.items ?? [])
    assessments.value = Array.isArray(aRes.data) ? aRes.data : (aRes.data.data ?? aRes.data.items ?? [])
    executions.value = Array.isArray(eRes.data) ? eRes.data : (eRes.data.data ?? eRes.data.items ?? [])
  } finally {
    detailLoading.value = false
  }
}

function openVitalDialog() {
  vitalForm.temperature = undefined
  vitalForm.pulse = undefined
  vitalForm.respiration = undefined
  vitalForm.systolicBP = undefined
  vitalForm.diastolicBP = undefined
  vitalForm.oxygenSaturation = undefined
  vitalDialogVisible.value = true
}

async function submitVitals() {
  submitting.value = true
  try {
    await apiClient.post(`/staff/nursing/vital-signs/${selectedPatientId.value}`, vitalForm)
    vitalDialogVisible.value = false
    ElMessage.success('生命体征已记录')
    await loadDetail()
  } finally {
    submitting.value = false
  }
}

function openAssessmentDialog() {
  assessmentForm.type = ''
  assessmentForm.score = undefined
  assessmentForm.content = ''
  assessmentDialogVisible.value = true
}

async function submitAssessment() {
  if (!assessmentForm.type) return
  submitting.value = true
  try {
    await apiClient.post(`/staff/nursing/assessments/${selectedPatientId.value}`, assessmentForm)
    assessmentDialogVisible.value = false
    ElMessage.success('评估已保存')
    await loadDetail()
  } finally {
    submitting.value = false
  }
}

async function executeOrder(id: string) {
  await apiClient.post(`/staff/nursing/executions/${id}/execute`)
  ElMessage.success('已执行')
  await loadDetail()
}

watch(selectedPatientId, () => {
  if (selectedPatientId.value) void loadDetail()
})

onMounted(() => { void loadPatients() })
</script>

<style scoped>
.nursing-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-4);
  min-height: 600px;
}

@media (max-width: 960px) {
  .nursing-layout {
    grid-template-columns: 1fr;
  }
}

.patient-list-panel {
  overflow-y: auto;
  max-height: 700px;
}

.patient-list {
  display: grid;
  gap: var(--space-2);
}

.patient-item {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.patient-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.patient-item-active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.patient-name {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.patient-bed {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.patient-header h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--text-lg);
  font-weight: 600;
}
</style>
