<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Inpatient Doctor</p>
        <h1 class="page-title">住院患者</h1>
        <p class="page-subtitle">查看住院患者床位、医嘱、费用和出院申请。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe highlight-current-row @current-change="selectAdmission">
        <el-table-column label="住院号" prop="admissionNo" min-width="150" />
        <el-table-column label="患者" min-width="120">
          <template #default="{ row }">{{ row.visitMember?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="床位" min-width="150">
          <template #default="{ row }">{{ row.ward?.name || '-' }} / {{ row.currentBed?.bedNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="诊断" prop="diagnosis" min-width="180" />
        <el-table-column label="状态" prop="status" width="150" />
      </el-table>
    </section>

    <div v-if="selected" class="dashboard-grid">
      <section class="panel">
        <div class="section-heading">
          <h2>住院医嘱</h2>
          <el-button size="small" type="primary" @click="orderVisible = true">新增医嘱</el-button>
        </div>
        <el-table :data="selected.orders || []" border stripe empty-text="暂无医嘱">
          <el-table-column label="类型" prop="type" width="110" />
          <el-table-column label="内容" prop="content" />
          <el-table-column label="状态" prop="status" width="110" />
          <el-table-column label="费用数" width="90">
            <template #default="{ row }">{{ row.charges?.length || 0 }}</template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <div class="section-heading">
          <h2>出院申请</h2>
          <el-button size="small" type="warning" :disabled="selected.status !== 'ADMITTED'" @click="dischargeVisible = true">申请出院</el-button>
        </div>
        <el-table :data="selected.dischargeRequests || []" border stripe empty-text="暂无出院申请">
          <el-table-column label="状态" prop="status" width="130" />
          <el-table-column label="原因" prop="reason" />
          <el-table-column label="申请时间" min-width="150">
            <template #default="{ row }">{{ formatDate(row.requestedAt) }}</template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <section v-if="selected" class="panel">
      <h2>住院费用</h2>
      <el-table :data="selected.charges || []" border stripe empty-text="暂无费用">
        <el-table-column label="项目" prop="itemName" />
        <el-table-column label="数量" prop="quantity" width="90" />
        <el-table-column label="金额" prop="amount" width="120" />
        <el-table-column label="状态" prop="status" width="120" />
      </el-table>
    </section>

    <el-dialog v-model="orderVisible" title="新增住院医嘱" width="520px">
      <el-form label-width="86px">
        <el-form-item label="类型"><el-input v-model="orderForm.type" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="orderForm.content" type="textarea" /></el-form-item>
        <el-form-item label="医生ID"><el-input v-model="orderForm.doctorId" placeholder="管理员代录时填写" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOrder">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dischargeVisible" title="申请出院" width="480px">
      <el-form label-width="86px">
        <el-form-item label="原因"><el-input v-model="dischargeForm.reason" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dischargeVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDischarge">提交</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createInpatientOrder, fetchDoctorInpatients, requestInpatientDischarge } from '../api/hospital'

interface AdmissionRow {
  id: string
  admissionNo: string
  status: string
  diagnosis?: string
  visitMember?: { name?: string }
  ward?: { name?: string }
  currentBed?: { bedNo?: string }
  orders?: Array<{ id: string; type: string; content: string; status: string; charges?: unknown[] }>
  charges?: Array<{ itemName: string; quantity: number; amount: string | number; status: string }>
  dischargeRequests?: Array<{ id: string; status: string; reason: string; requestedAt: string }>
}

const loading = ref(false)
const rows = ref<AdmissionRow[]>([])
const selected = ref<AdmissionRow | null>(null)
const orderVisible = ref(false)
const dischargeVisible = ref(false)
const orderForm = reactive({ type: 'LONG_TERM', content: '', doctorId: '' })
const dischargeForm = reactive({ reason: '' })

async function load() {
  loading.value = true
  try {
    rows.value = (await fetchDoctorInpatients()) as AdmissionRow[]
    selected.value = selected.value ? rows.value.find((row) => row.id === selected.value?.id) ?? rows.value[0] ?? null : rows.value[0] ?? null
  } finally {
    loading.value = false
  }
}

function selectAdmission(row?: AdmissionRow) {
  selected.value = row ?? null
}

function formatDate(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '-'
}

async function submitOrder() {
  if (!selected.value) return
  await createInpatientOrder(selected.value.id, { type: orderForm.type, content: orderForm.content, doctorId: orderForm.doctorId || undefined })
  orderVisible.value = false
  orderForm.content = ''
  await load()
}

async function submitDischarge() {
  if (!selected.value) return
  await requestInpatientDischarge(selected.value.id, { reason: dischargeForm.reason })
  dischargeVisible.value = false
  dischargeForm.reason = ''
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.section-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

h2 {
  margin: 0 0 12px;
}

.section-heading h2 {
  margin: 0;
}
</style>
