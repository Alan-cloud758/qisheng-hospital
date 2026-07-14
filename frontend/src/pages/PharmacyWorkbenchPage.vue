<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Pharmacy Desk</p>
        <h1 class="page-title">药房工作台</h1>
        <p class="page-subtitle">审核医生提交的处方，并按库存批次完成发药扣减。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <section v-if="alerts.length" class="panel warning-strip">
      <el-alert
        v-for="alert in alerts.slice(0, 4)"
        :key="alert.id"
        :title="alert.message"
        :type="alert.level === 'CRITICAL' ? 'error' : 'warning'"
        show-icon
        :closable="false"
      />
    </section>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="处方ID" prop="id" min-width="180" />
        <el-table-column label="医生" min-width="120">
          <template #default="{ row }">{{ row.doctor?.user?.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="药品数" width="100">
          <template #default="{ row }">{{ row.items?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="库存提示" min-width="180">
          <template #default="{ row }">
            <el-tag :type="stockStatus(row).type">{{ stockStatus(row).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" />
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.status !== 'SUBMITTED'" @click="review(row.id)">审核</el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'REVIEWED'" @click="openDispense(row)">发药</el-button>
            <el-button size="small" type="warning" :disabled="row.status !== 'DISPENSED'" @click="returnStock(row.id)">退回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dispenseVisible" :title="dispenseConfirmed ? '发药完成批次' : '确认发药批次'" width="680px">
      <div v-if="selectedPrescription" class="dispense-summary">
        <p>处方：{{ selectedPrescription.id }}</p>
        <p>医生：{{ selectedPrescription.doctor?.user?.displayName || '-' }}</p>
      </div>
      <el-table :data="plannedBatches" border>
        <el-table-column label="药品" prop="drugName" min-width="150" />
        <el-table-column label="批号" prop="batchNo" min-width="120" />
        <el-table-column label="扣减数量" prop="quantity" width="100" />
        <el-table-column label="有效期" min-width="120">
          <template #default="{ row }">{{ formatDate(row.expiresAt) }}</template>
        </el-table-column>
      </el-table>
      <p v-if="dispenseWarning" class="dispense-warning">{{ dispenseWarning }}</p>
      <p v-if="dispenseConfirmed" class="dispense-success">已按后端实际扣减批次完成发药。</p>
      <template #footer>
        <el-button @click="dispenseVisible = false">{{ dispenseConfirmed ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!dispenseConfirmed" type="primary" :disabled="Boolean(dispenseWarning)" @click="confirmDispense">确认发药</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { dispensePrescription, fetchDrugStockAlerts, fetchPharmacyPrescriptions, returnPrescription, reviewPrescription } from '../api/hospital'

interface StockBatchRow {
  id: string
  batchNo: string
  quantity: number
  expiresAt: string
}

interface PrescriptionItemRow {
  quantity: number
  drug?: {
    id: string
    name?: string
    stockBatches?: StockBatchRow[]
  }
}

interface PrescriptionRow {
  id: string
  status: string
  doctor?: { user?: { displayName?: string } }
  items?: PrescriptionItemRow[]
}

interface StockAlertRow {
  id: string
  level: string
  message: string
}

interface PlannedBatchRow {
  drugName: string
  batchId: string
  batchNo: string
  quantity: number
  expiresAt: string
}

const loading = ref(false)
const rows = ref<PrescriptionRow[]>([])
const alerts = ref<StockAlertRow[]>([])
const dispenseVisible = ref(false)
const dispenseWarning = ref('')
const dispenseConfirmed = ref(false)
const selectedPrescription = ref<PrescriptionRow | null>(null)
const plannedBatches = ref<PlannedBatchRow[]>([])

async function load() {
  loading.value = true
  try {
    const [prescriptions, stockAlerts] = await Promise.all([fetchPharmacyPrescriptions(), fetchDrugStockAlerts()])
    rows.value = prescriptions as PrescriptionRow[]
    alerts.value = stockAlerts as StockAlertRow[]
  } finally {
    loading.value = false
  }
}

async function review(id: string) {
  await reviewPrescription(id)
  await load()
}

function planBatches(row: PrescriptionRow) {
  const now = new Date()
  const planned: PlannedBatchRow[] = []
  const reservedByBatch = new Map<string, number>()
  let warning = ''

  for (const item of row.items || []) {
    let remaining = item.quantity
    const batches = [...(item.drug?.stockBatches || [])]
      .filter((batch) => batch.quantity > 0 && new Date(batch.expiresAt) >= startOfToday(now))
      .sort((left, right) => new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime())

    for (const batch of batches) {
      const available = Math.max(batch.quantity - (reservedByBatch.get(batch.id) ?? 0), 0)
      if (available === 0) continue
      const picked = Math.min(available, remaining)
      planned.push({
        drugName: item.drug?.name || '-',
        batchId: batch.id,
        batchNo: batch.batchNo,
        quantity: picked,
        expiresAt: batch.expiresAt,
      })
      reservedByBatch.set(batch.id, (reservedByBatch.get(batch.id) ?? 0) + picked)
      remaining -= picked
      if (remaining === 0) break
    }

    if (remaining > 0) {
      warning = `${item.drug?.name || '药品'} 库存不足，缺少 ${remaining}`
      break
    }
  }

  return { planned, warning }
}

function stockStatus(row: PrescriptionRow) {
  const result = planBatches(row)
  return result.warning ? { type: 'danger', label: '库存不足' } : { type: 'success', label: '库存可发' }
}

function openDispense(row: PrescriptionRow) {
  const result = planBatches(row)
  selectedPrescription.value = row
  plannedBatches.value = result.planned
  dispenseWarning.value = result.warning
  dispenseConfirmed.value = false
  dispenseVisible.value = true
}

async function confirmDispense() {
  if (!selectedPrescription.value) return
  const item = (await dispensePrescription(selectedPrescription.value.id)) as PrescriptionRow & { selectedBatches?: Array<PlannedBatchRow & { drugId?: string }> }
  if (item.selectedBatches?.length) {
    plannedBatches.value = item.selectedBatches.map((batch) => ({
      drugName: batch.drugName,
      batchId: batch.batchId,
      batchNo: batch.batchNo,
      quantity: batch.quantity,
      expiresAt: batch.expiresAt,
    }))
  }
  selectedPrescription.value = item
  dispenseConfirmed.value = true
  await load()
}

async function returnStock(id: string) {
  await returnPrescription(id)
  await load()
}

function startOfToday(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.warning-strip {
  display: grid;
  gap: 10px;
}

.dispense-summary {
  display: flex;
  gap: 20px;
  color: #475569;
  margin-bottom: 12px;
}

.dispense-summary p {
  margin: 0;
}

.dispense-warning {
  color: #b42318;
  margin: 12px 0 0;
}

.dispense-success {
  color: #067647;
  margin: 12px 0 0;
}
</style>
