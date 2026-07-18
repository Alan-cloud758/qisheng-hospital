<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Inpatient Progress</p>
        <h1 class="page-title">住院深度管理</h1>
        <p class="page-subtitle">查看病程记录、医嘱、会诊、转科和出院小结。</p>
      </div>
      <el-button @click="loadAdmissions">刷新</el-button>
    </div>

    <div class="detail-layout">
      <section class="panel patient-sidebar">
        <h3>住院患者</h3>
        <el-input v-model="search" placeholder="搜索住院号/姓名" clearable style="margin-bottom:8px" />
        <el-table :data="filteredAdmissions" highlight-current-row size="small" @current-change="selectAdmission" style="width:100%">
          <el-table-column label="住院号" prop="admissionNo" min-width="100" />
          <el-table-column label="患者" min-width="80"><template #default="{ row }">{{ row.visitMember?.name || '-' }}</template></el-table-column>
          <el-table-column label="状态" width="70"><template #default="{ row }"><el-tag :type="row.status==='ADMITTED'?'success':'info'" size="small">{{ row.status }}</el-tag></template></el-table-column>
        </el-table>
      </section>

      <section class="panel" v-if="selected">
        <el-tabs v-model="activeTab" @tab-change="loadTab">
          <el-tab-pane label="病程记录" name="progress">
            <div class="toolbar"><el-button type="primary" size="small" @click="progressVisible=true">新增记录</el-button></div>
            <el-timeline v-if="progressRecords.length">
              <el-timeline-item v-for="r in progressRecords" :key="r.id" :timestamp="fmt(r.createdAt)" placement="top">
                <el-card shadow="never"><p><strong>{{ r.recordType || '一般记录' }}</strong> — {{ r.authorName || '-' }}</p><p>{{ r.content }}</p></el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无病程记录" />
          </el-tab-pane>

          <el-tab-pane label="医嘱管理" name="orders">
            <div class="toolbar"><el-button type="primary" size="small" @click="orderVisible=true">新增医嘱</el-button></div>
            <el-table :data="orders" border stripe>
              <el-table-column label="类型" prop="type" width="100" />
              <el-table-column label="内容" prop="content" />
              <el-table-column label="状态" prop="status" width="100" />
              <el-table-column label="日期" width="120"><template #default="{ row }">{{ fmt(row.createdAt) }}</template></el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="会诊记录" name="consults">
            <div class="toolbar"><el-button type="primary" size="small" @click="consultVisible=true">申请会诊</el-button></div>
            <el-table :data="consults" border stripe>
              <el-table-column label="会诊科室" prop="targetDepartment" />
              <el-table-column label="会诊医生" prop="consultantName" />
              <el-table-column label="原因" prop="reason" show-overflow-tooltip />
              <el-table-column label="意见" prop="opinion" show-overflow-tooltip />
              <el-table-column label="状态" prop="status" width="90" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="转科记录" name="transfers">
            <el-table :data="transfers" border stripe>
              <el-table-column label="原科室" prop="fromDepartment" />
              <el-table-column label="目标科室" prop="toDepartment" />
              <el-table-column label="原因" prop="reason" show-overflow-tooltip />
              <el-table-column label="日期" width="120"><template #default="{ row }">{{ fmt(row.transferredAt) }}</template></el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="出院小结" name="discharge">
            <div v-if="dischargeSummary">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="出院日期">{{ fmt(dischargeSummary.dischargedAt) }}</el-descriptions-item>
                <el-descriptions-item label="住院天数">{{ dischargeSummary.stayDays }} 天</el-descriptions-item>
                <el-descriptions-item label="入院诊断" :span="2">{{ dischargeSummary.admitDiagnosis }}</el-descriptions-item>
                <el-descriptions-item label="出院诊断" :span="2">{{ dischargeSummary.dischargeDiagnosis }}</el-descriptions-item>
                <el-descriptions-item label="治疗经过" :span="2">{{ dischargeSummary.treatmentSummary }}</el-descriptions-item>
                <el-descriptions-item label="出院医嘱" :span="2">{{ dischargeSummary.dischargeOrder }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <el-empty v-else description="暂无出院小结" />
          </el-tab-pane>
        </el-tabs>
      </section>
      <section v-else class="panel empty-state"><el-empty description="请选择左侧住院患者" /></section>
    </div>

    <el-dialog v-model="progressVisible" title="新增病程记录" width="520px">
      <el-form label-width="86px">
        <el-form-item label="记录类型"><el-select v-model="progressForm.recordType"><el-option v-for="t in ['一般记录','上级查房','抢救记录','手术记录']" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="内容"><el-input v-model="progressForm.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="progressVisible=false">取消</el-button><el-button type="primary" @click="submitProgress">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="orderVisible" title="新增医嘱" width="480px">
      <el-form label-width="86px">
        <el-form-item label="类型"><el-select v-model="orderForm.type"><el-option label="长期医嘱" value="LONG_TERM" /><el-option label="临时医嘱" value="TEMPORARY" /></el-select></el-form-item>
        <el-form-item label="内容"><el-input v-model="orderForm.content" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="orderVisible=false">取消</el-button><el-button type="primary" @click="submitOrder">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="consultVisible" title="申请会诊" width="480px">
      <el-form label-width="86px">
        <el-form-item label="会诊科室"><el-input v-model="consultForm.targetDepartment" /></el-form-item>
        <el-form-item label="会诊医生"><el-input v-model="consultForm.consultantName" /></el-form-item>
        <el-form-item label="会诊原因"><el-input v-model="consultForm.reason" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="consultVisible=false">取消</el-button><el-button type="primary" @click="submitConsult">提交</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { apiClient } from '../api/client'

interface Admission { id: string; admissionNo: string; status: string; visitMember?: { name?: string } }

const fmt = (v?: string) => v ? v.replace('T', ' ').slice(0, 16) : '-'
const search = ref('')
const admissions = ref<Admission[]>([])
const selected = ref<Admission | null>(null)
const activeTab = ref('progress')
const loading = ref(false)

const progressRecords = ref<Record<string, unknown>[]>([])
const orders = ref<Record<string, unknown>[]>([])
const consults = ref<Record<string, unknown>[]>([])
const transfers = ref<Record<string, unknown>[]>([])
const dischargeSummary = ref<Record<string, unknown> | null>(null)

const progressVisible = ref(false)
const orderVisible = ref(false)
const consultVisible = ref(false)
const progressForm = reactive({ recordType: '一般记录', content: '' })
const orderForm = reactive({ type: 'LONG_TERM', content: '' })
const consultForm = reactive({ targetDepartment: '', consultantName: '', reason: '' })

const filteredAdmissions = computed(() => {
  const q = search.value.toLowerCase()
  return admissions.value.filter(a => !q || a.admissionNo.toLowerCase().includes(q) || (a.visitMember?.name || '').toLowerCase().includes(q))
})

function selectAdmission(row?: Admission) {
  selected.value = row ?? null
  if (row) loadTab()
}

async function loadAdmissions() {
  const { data } = await apiClient.get('/admin/inpatient-admissions')
  admissions.value = data.items || []
  if (selected.value) selected.value = admissions.value.find(a => a.id === selected.value?.id) ?? null
}

async function loadTab() {
  if (!selected.value) return
  loading.value = true
  const id = selected.value.id
  try {
    const map: Record<string, { url: string; setter: (v: unknown[]) => void }> = {
      progress: { url: `/admin/inpatients/${id}/progress-records`, setter: v => { progressRecords.value = v as Record<string, unknown>[] } },
      orders: { url: `/admin/inpatients/${id}/orders`, setter: v => { orders.value = v as Record<string, unknown>[] } },
      consults: { url: `/admin/inpatients/${id}/consults`, setter: v => { consults.value = v as Record<string, unknown>[] } },
      transfers: { url: `/admin/inpatients/${id}/transfers`, setter: v => { transfers.value = v as Record<string, unknown>[] } },
      discharge: { url: `/admin/inpatients/${id}/discharge-summary`, setter: v => { dischargeSummary.value = (v as Record<string, unknown>[])[0] || null } },
    }
    const cfg = map[activeTab.value]
    if (cfg) {
      try { const { data } = await apiClient.get(cfg.url); cfg.setter(data.items || data || []) } catch { cfg.setter([]) }
    }
  } finally { loading.value = false }
}

async function submitProgress() {
  if (!selected.value) return
  await apiClient.post(`/admin/inpatients/${selected.value.id}/progress-records`, { ...progressForm })
  progressVisible.value = false; progressForm.content = ''; await loadTab()
}
async function submitOrder() {
  if (!selected.value) return
  await apiClient.post(`/staff/doctor/inpatients/${selected.value.id}/orders`, { ...orderForm })
  orderVisible.value = false; orderForm.content = ''; await loadTab()
}
async function submitConsult() {
  if (!selected.value) return
  await apiClient.post(`/admin/inpatients/${selected.value.id}/consults`, { ...consultForm })
  consultVisible.value = false; Object.assign(consultForm, { targetDepartment: '', consultantName: '', reason: '' }); await loadTab()
}

onMounted(() => { void loadAdmissions() })
</script>

<style scoped>
.detail-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
.patient-sidebar h3 { margin: 0 0 10px; font-size: 16px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
.empty-state { display: flex; align-items: center; justify-content: center; min-height: 300px; }
</style>
