<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Patient 360</p>
        <h1 class="page-title">患者360°全景</h1>
        <p class="page-subtitle">查看患者全生命周期医疗记录。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section v-if="patient" class="panel patient-info">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="患者号">{{ patient.patientNo }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ patient.realName }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ patient.gender || '-' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ patient.age ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ patient.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证">{{ patient.idCard || '-' }}</el-descriptions-item>
        <el-descriptions-item label="过敏史">{{ patient.allergies || '无' }}</el-descriptions-item>
        <el-descriptions-item label="建档日期">{{ fmt(patient.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </section>

    <section class="panel">
      <el-tabs v-model="activeTab" @tab-change="loadTab">
        <el-tab-pane label="就诊记录" name="visits">
          <el-timeline v-if="visits.length">
            <el-timeline-item v-for="v in visits" :key="v.id" :timestamp="fmt(v.createdAt)" placement="top">
              <el-card shadow="never">
                <p><strong>{{ v.departmentName || '-' }}</strong> | {{ v.doctorName || '-' }}</p>
                <p>诊断: {{ v.diagnosis || '待定' }}</p>
                <el-tag :type="statusType(v.status)" size="small">{{ v.status }}</el-tag>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无就诊记录" />
        </el-tab-pane>

        <el-tab-pane label="检验报告" name="lab">
          <el-table :data="labReports" border stripe>
            <el-table-column label="项目" prop="itemName" />
            <el-table-column label="结果" prop="result" />
            <el-table-column label="参考值" prop="refRange" />
            <el-table-column label="状态" prop="status" width="100" />
            <el-table-column label="日期" width="120"><template #default="{ row }">{{ fmt(row.reportedAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="影像报告" name="imaging">
          <el-table :data="imagingReports" border stripe>
            <el-table-column label="检查类型" prop="examType" />
            <el-table-column label="部位" prop="bodyPart" />
            <el-table-column label="影像所见" prop="findings" show-overflow-tooltip />
            <el-table-column label="诊断意见" prop="impression" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" width="100" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="处方历史" name="prescriptions">
          <el-table :data="prescriptions" border stripe>
            <el-table-column label="处方号" prop="prescriptionNo" width="150" />
            <el-table-column label="医生" prop="doctorName" />
            <el-table-column label="药品数" width="80"><template #default="{ row }">{{ row.items?.length || 0 }}</template></el-table-column>
            <el-table-column label="状态" prop="status" width="100" />
            <el-table-column label="日期" width="120"><template #default="{ row }">{{ fmt(row.createdAt) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="住院记录" name="inpatient">
          <el-table :data="inpatientRecords" border stripe>
            <el-table-column label="住院号" prop="admissionNo" width="150" />
            <el-table-column label="科室" prop="departmentName" />
            <el-table-column label="床位" prop="bedNo" />
            <el-table-column label="诊断" prop="diagnosis" show-overflow-tooltip />
            <el-table-column label="入院日期" width="120"><template #default="{ row }">{{ fmt(row.admittedAt) }}</template></el-table-column>
            <el-table-column label="状态" prop="status" width="100" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="体检记录" name="exam">
          <el-table :data="examRecords" border stripe>
            <el-table-column label="体检套餐" prop="packageName" />
            <el-table-column label="体检日期" width="120"><template #default="{ row }">{{ fmt(row.examDate) }}</template></el-table-column>
            <el-table-column label="结论" prop="summary" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" width="100" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '../api/client'

defineProps<{ patientId?: string }>()

const route = useRoute()
const pid = (route.params.patientId as string) || (route.query.patientId as string) || ''

const activeTab = ref('visits')
const patient = ref<Record<string, unknown> | null>(null)
const visits = ref<Record<string, unknown>[]>([])
const labReports = ref<Record<string, unknown>[]>([])
const imagingReports = ref<Record<string, unknown>[]>([])
const prescriptions = ref<Record<string, unknown>[]>([])
const inpatientRecords = ref<Record<string, unknown>[]>([])
const examRecords = ref<Record<string, unknown>[]>([])

function fmt(v?: string) { return v ? v.replace('T', ' ').slice(0, 16) : '-' }
function statusType(s?: string) { return s === 'COMPLETED' ? 'success' : s === 'CANCELLED' ? 'info' : 'warning' }

async function loadPatient() {
  if (!pid) return
  const { data } = await apiClient.get(`/admin/patients/${pid}`)
  patient.value = data.item || data
}

async function loadTab() {
  if (!pid) return
  const map: Record<string, { url: string; setter: (v: unknown[]) => void }> = {
    visits: { url: `/admin/patients/${pid}/visits`, setter: v => { visits.value = v as Record<string, unknown>[] } },
    lab: { url: `/admin/patients/${pid}/lab-reports`, setter: v => { labReports.value = v as Record<string, unknown>[] } },
    imaging: { url: `/admin/patients/${pid}/imaging-reports`, setter: v => { imagingReports.value = v as Record<string, unknown>[] } },
    prescriptions: { url: `/admin/patients/${pid}/prescriptions`, setter: v => { prescriptions.value = v as Record<string, unknown>[] } },
    inpatient: { url: `/admin/patients/${pid}/admissions`, setter: v => { inpatientRecords.value = v as Record<string, unknown>[] } },
    exam: { url: `/admin/patients/${pid}/exam-orders`, setter: v => { examRecords.value = v as Record<string, unknown>[] } },
  }
  const cfg = map[activeTab.value]
  if (!cfg) return
  try {
    const { data } = await apiClient.get(cfg.url)
    cfg.setter(data.items || data || [])
  } catch { cfg.setter([]) }
}

async function load() {
  await Promise.all([loadPatient(), loadTab()])
}

onMounted(() => { void load() })
</script>

<style scoped>
.patient-info { margin-bottom: 16px; }
</style>
