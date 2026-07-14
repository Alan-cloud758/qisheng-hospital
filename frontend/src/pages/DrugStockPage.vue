<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Drug Inventory</p>
        <h1 class="page-title">药品库存</h1>
        <p class="page-subtitle">维护药品批次、库存数量、近效期和低库存预警。</p>
      </div>
      <div class="stock-actions">
        <el-button type="primary" @click="receiveVisible = true">入库</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <section v-if="alerts.length" class="panel alert-panel">
      <el-alert
        v-for="alert in alerts"
        :key="alert.id"
        :title="alert.message"
        :type="alert.level === 'CRITICAL' ? 'error' : 'warning'"
        show-icon
        :closable="false"
      />
    </section>

    <section class="panel">
      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column label="药品" min-width="160">
          <template #default="{ row }">{{ row.drug?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="批号" prop="batchNo" min-width="130" />
        <el-table-column label="库存" prop="quantity" width="90" />
        <el-table-column label="有效期" min-width="120">
          <template #default="{ row }">{{ formatDate(row.expiresAt) }}</template>
        </el-table-column>
        <el-table-column label="供应商" prop="supplier" min-width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openAdjust(row)">盘点</el-button>
            <el-button size="small" type="warning" @click="openDamage(row)">报损</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="receiveVisible" title="药品入库" width="520px">
      <el-form label-width="86px">
        <el-form-item label="药品">
          <el-select v-model="receiveForm.drugId" filterable placeholder="选择药品">
            <el-option v-for="drug in drugs" :key="drug.id" :label="`${drug.name} ${drug.spec}`" :value="drug.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="批号">
          <el-input v-model="receiveForm.batchNo" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="receiveForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="receiveForm.expiresAt" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="receiveForm.supplier" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="receiveForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiveVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReceive">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mutationVisible" :title="mutationMode === 'adjust' ? '库存盘点' : '库存报损'" width="420px">
      <el-form label-width="86px">
        <el-form-item label="药品批次">
          <span>{{ selectedBatch?.drug?.name || '-' }} / {{ selectedBatch?.batchNo || '-' }}</span>
        </el-form-item>
        <el-form-item :label="mutationMode === 'adjust' ? '盘点后' : '报损数'">
          <el-input-number v-model="mutationForm.quantity" :min="mutationMode === 'adjust' ? 0 : 1" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="mutationForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mutationVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMutation">提交</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  adjustDrugStock,
  damageDrugStock,
  fetchAdminResource,
  fetchDrugStockAlerts,
  fetchDrugStockBatches,
  receiveDrugStock,
} from '../api/hospital'

interface DrugRow {
  id: string
  name: string
  spec: string
}

interface StockBatchRow {
  id: string
  batchNo: string
  quantity: number
  expiresAt: string
  supplier?: string
  isActive: boolean
  drug?: DrugRow
}

interface StockAlertRow {
  id: string
  level: string
  message: string
}

const loading = ref(false)
const receiveVisible = ref(false)
const mutationVisible = ref(false)
const mutationMode = ref<'adjust' | 'damage'>('adjust')
const rows = ref<StockBatchRow[]>([])
const drugs = ref<DrugRow[]>([])
const alerts = ref<StockAlertRow[]>([])
const selectedBatch = ref<StockBatchRow | null>(null)
const receiveForm = reactive({ drugId: '', batchNo: '', quantity: 1, expiresAt: '', supplier: '', reason: '药品入库' })
const mutationForm = reactive({ quantity: 0, reason: '' })

async function load() {
  loading.value = true
  try {
    const [batchRows, alertRows, drugPage] = await Promise.all([
      fetchDrugStockBatches(),
      fetchDrugStockAlerts(),
      fetchAdminResource('drugs', { pageSize: 500 }),
    ])
    rows.value = batchRows as StockBatchRow[]
    alerts.value = alertRows as StockAlertRow[]
    drugs.value = drugPage.items as DrugRow[]
  } finally {
    loading.value = false
  }
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '-'
}

function openAdjust(row: StockBatchRow) {
  selectedBatch.value = row
  mutationMode.value = 'adjust'
  mutationForm.quantity = row.quantity
  mutationForm.reason = '库存盘点调整'
  mutationVisible.value = true
}

function openDamage(row: StockBatchRow) {
  selectedBatch.value = row
  mutationMode.value = 'damage'
  mutationForm.quantity = 1
  mutationForm.reason = '库存报损'
  mutationVisible.value = true
}

async function submitReceive() {
  await receiveDrugStock({ ...receiveForm })
  receiveVisible.value = false
  await load()
}

async function submitMutation() {
  if (!selectedBatch.value) return
  if (mutationMode.value === 'adjust') {
    await adjustDrugStock(selectedBatch.value.id, { quantity: mutationForm.quantity, reason: mutationForm.reason })
  } else {
    await damageDrugStock(selectedBatch.value.id, { quantity: mutationForm.quantity, reason: mutationForm.reason })
  }
  mutationVisible.value = false
  await load()
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.stock-actions,
.alert-panel {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.alert-panel {
  align-items: stretch;
}

.alert-panel .el-alert {
  flex: 1 1 320px;
}
</style>
