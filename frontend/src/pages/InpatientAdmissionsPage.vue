<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Inpatient Nursing</p>
        <h1 class="page-title">住院入出院</h1>
        <p class="page-subtitle">办理入院登记、床位分配、转床和出院流转。</p>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" @click="admissionVisible = true">新建入院</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="住院号" prop="admissionNo" min-width="150" />
        <el-table-column label="患者" min-width="120">
          <template #default="{ row }">{{ row.visitMember?.name || row.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="主管医生" min-width="120">
          <template #default="{ row }">{{ row.attendingDoctor?.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="病区/床位" min-width="160">
          <template #default="{ row }">{{ row.ward?.name || '-' }} / {{ row.currentBed?.bedNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="150" />
        <el-table-column label="费用" width="110">
          <template #default="{ row }">¥{{ chargeTotal(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="360">
          <template #default="{ row }">
            <el-button size="small" @click="openAssign(row)">分床</el-button>
            <el-button size="small" @click="openTransfer(row)">转床</el-button>
            <el-button size="small" type="success" :disabled="!latestDischarge(row, 'REQUESTED')" @click="approve(row)">批准出院</el-button>
            <el-button size="small" type="warning" :disabled="!latestDischarge(row, 'APPROVED')" @click="settle(row)">结算</el-button>
            <el-button size="small" type="danger" :disabled="!canComplete(row)" @click="complete(row)">出院</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="admissionVisible" title="新建入院" width="560px">
      <el-form label-width="110px">
        <el-form-item label="患者用户ID"><el-input v-model="admissionForm.userId" /></el-form-item>
        <el-form-item label="就诊人ID"><el-input v-model="admissionForm.visitMemberId" /></el-form-item>
        <el-form-item label="主管医生ID"><el-input v-model="admissionForm.attendingDoctorId" /></el-form-item>
        <el-form-item label="病区ID"><el-input v-model="admissionForm.wardId" /></el-form-item>
        <el-form-item label="诊断"><el-input v-model="admissionForm.diagnosis" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="admissionForm.notes" type="textarea" /></el-form-item>
        <el-form-item label="押金"><el-input-number v-model="admissionForm.depositAmount" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="admissionVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdmission">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bedVisible" :title="bedMode === 'assign' ? '分配床位' : '转床'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="住院号">{{ selectedAdmission?.admissionNo || '-' }}</el-form-item>
        <el-form-item label="床位">
          <el-select v-model="bedForm.bedId" filterable placeholder="选择空床">
            <el-option v-for="bed in availableBeds" :key="bed.id" :label="`${bed.ward?.name || '-'} / ${bed.bedNo}`" :value="bed.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因"><el-input v-model="bedForm.reason" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bedVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBedAction">确认</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  approveDischarge,
  assignInpatientBed,
  completeDischarge,
  createInpatientAdmission,
  fetchNurseBeds,
  fetchNurseAdmissions,
  settleDischarge,
  transferInpatientBed,
} from '../api/hospital'

interface AdmissionRow {
  id: string
  admissionNo: string
  status: string
  user?: { displayName?: string }
  visitMember?: { name?: string }
  attendingDoctor?: { user?: { displayName?: string } }
  ward?: { name?: string }
  currentBed?: { bedNo?: string }
  charges?: Array<{ amount: string | number; paymentOrder?: { status: string } | null }>
  dischargeRequests?: Array<{ id: string; status: string }>
}

interface BedRow {
  id: string
  bedNo: string
  status: string
  ward?: { name?: string }
}

const loading = ref(false)
const rows = ref<AdmissionRow[]>([])
const beds = ref<BedRow[]>([])
const admissionVisible = ref(false)
const bedVisible = ref(false)
const bedMode = ref<'assign' | 'transfer'>('assign')
const selectedAdmission = ref<AdmissionRow | null>(null)
const admissionForm = reactive({ userId: '', visitMemberId: '', attendingDoctorId: '', wardId: '', diagnosis: '', notes: '', depositAmount: 0 })
const bedForm = reactive({ bedId: '', reason: '' })

const availableBeds = computed(() => beds.value.filter((bed) => bed.status === 'AVAILABLE'))

async function load() {
  loading.value = true
  try {
    const [admissions, bedRows] = await Promise.all([fetchNurseAdmissions(), fetchNurseBeds()])
    rows.value = admissions as AdmissionRow[]
    beds.value = bedRows as BedRow[]
  } finally {
    loading.value = false
  }
}

function chargeTotal(row: AdmissionRow) {
  return (row.charges ?? []).reduce((sum, charge) => sum + Number(charge.amount), 0)
}

function latestDischarge(row: AdmissionRow, status: string) {
  return (row.dischargeRequests ?? []).find((request) => request.status === status)
}

function canComplete(row: AdmissionRow) {
  const hasPendingInpatientOrder = (row.charges ?? []).some((charge) => charge.paymentOrder && charge.paymentOrder.status !== 'PAID')
  return Boolean(latestDischarge(row, 'SETTLED')) && !hasPendingInpatientOrder
}

function openAssign(row: AdmissionRow) {
  selectedAdmission.value = row
  bedMode.value = 'assign'
  bedForm.bedId = ''
  bedForm.reason = '入院分床'
  bedVisible.value = true
}

function openTransfer(row: AdmissionRow) {
  selectedAdmission.value = row
  bedMode.value = 'transfer'
  bedForm.bedId = ''
  bedForm.reason = '住院转床'
  bedVisible.value = true
}

async function submitAdmission() {
  await createInpatientAdmission({
    userId: admissionForm.userId,
    visitMemberId: admissionForm.visitMemberId,
    ...(admissionForm.attendingDoctorId ? { attendingDoctorId: admissionForm.attendingDoctorId } : {}),
    ...(admissionForm.wardId ? { wardId: admissionForm.wardId } : {}),
    ...(admissionForm.diagnosis ? { diagnosis: admissionForm.diagnosis } : {}),
    ...(admissionForm.notes ? { notes: admissionForm.notes } : {}),
    depositAmount: admissionForm.depositAmount,
  })
  admissionVisible.value = false
  await load()
}

async function submitBedAction() {
  if (!selectedAdmission.value) return
  if (bedMode.value === 'assign') {
    await assignInpatientBed(selectedAdmission.value.id, { ...bedForm })
  } else {
    await transferInpatientBed(selectedAdmission.value.id, { ...bedForm })
  }
  bedVisible.value = false
  await load()
}

async function approve(row: AdmissionRow) {
  const request = latestDischarge(row, 'REQUESTED')
  if (!request) return
  await approveDischarge(request.id)
  await load()
}

async function settle(row: AdmissionRow) {
  const request = latestDischarge(row, 'APPROVED')
  if (!request) return
  await settleDischarge(request.id)
  await load()
}

async function complete(row: AdmissionRow) {
  const request = latestDischarge(row, 'SETTLED')
  if (!request) return
  await completeDischarge(request.id)
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.toolbar-actions {
  display: flex;
  gap: 10px;
}
</style>
