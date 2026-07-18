<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Equipment</p>
        <h1 class="page-title">设备管理</h1>
        <p class="page-subtitle">管理医疗设备台账、维保记录和使用率统计。</p>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="loadTab">
      <!-- 设备台账 -->
      <el-tab-pane label="设备台账" name="assets">
        <div class="toolbar">
          <el-input v-model="assetSearch" placeholder="搜索设备名/编号" clearable style="width:200px" @input="filterAssets" />
          <el-select v-model="assetStatusFilter" placeholder="状态" clearable @change="filterAssets" style="width:120px">
            <el-option label="正常" value="NORMAL" /><el-option label="维修中" value="REPAIRING" />
            <el-option label="报废" value="SCRAPPED" /><el-option label="借出" value="LOANED" />
          </el-select>
          <el-button type="primary" @click="openAssetDialog()">新增设备</el-button>
        </div>
        <el-table :data="filteredAssets" border stripe v-loading="loading">
          <el-table-column label="设备编号" prop="assetNo" width="130" />
          <el-table-column label="设备名称" prop="name" min-width="150" />
          <el-table-column label="型号" prop="model" width="120" />
          <el-table-column label="科室" prop="departmentName" width="120" />
          <el-table-column label="购入日期" width="110"><template #default="{ row }">{{ fmt(row.purchaseDate) }}</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="assetTagType(row.status)" size="small">{{ assetStatusLabel(row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button size="small" @click="openAssetDialog(row)">编辑</el-button>
              <el-button size="small" @click="viewMaintenance(row)">维保</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 维保记录 -->
      <el-tab-pane label="维保记录" name="maintenance">
        <div class="toolbar">
          <span v-if="maintAsset">当前设备: <strong>{{ maintAsset.name }} ({{ maintAsset.assetNo }})</strong></span>
          <el-button type="primary" size="small" :disabled="!maintAsset" @click="maintVisible=true">新增记录</el-button>
        </div>
        <el-table :data="maintenanceRecords" border stripe v-loading="loading">
          <el-table-column label="维保类型" prop="type" width="120" />
          <el-table-column label="内容" prop="description" show-overflow-tooltip />
          <el-table-column label="执行人" prop="technician" width="100" />
          <el-table-column label="费用" width="100"><template #default="{ row }">{{ row.cost ?? '-' }}</template></el-table-column>
          <el-table-column label="日期" width="120"><template #default="{ row }">{{ fmt(row.performedAt) }}</template></el-table-column>
          <el-table-column label="下次维保" width="120"><template #default="{ row }">{{ fmt(row.nextDueAt) }}</template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 使用率统计 -->
      <el-tab-pane label="使用率统计" name="utilization">
        <el-table :data="utilizationStats" border stripe v-loading="loading">
          <el-table-column label="设备" prop="name" min-width="150" />
          <el-table-column label="编号" prop="assetNo" width="130" />
          <el-table-column label="总工时(h)" prop="totalHours" width="110" />
          <el-table-column label="使用工时(h)" prop="usedHours" width="120" />
          <el-table-column label="使用率" width="100"><template #default="{ row }"><el-progress :percentage="row.utilizationRate" :stroke-width="14" :text-inside="true" /></template></el-table-column>
          <el-table-column label="故障次数" prop="breakdownCount" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑设备 -->
    <el-dialog v-model="assetVisible" :title="assetForm.id ? '编辑设备' : '新增设备'" width="520px">
      <el-form label-width="86px">
        <el-form-item label="设备名称"><el-input v-model="assetForm.name" /></el-form-item>
        <el-form-item label="设备编号"><el-input v-model="assetForm.assetNo" /></el-form-item>
        <el-form-item label="型号"><el-input v-model="assetForm.model" /></el-form-item>
        <el-form-item label="科室"><el-input v-model="assetForm.departmentName" /></el-form-item>
        <el-form-item label="购入日期"><el-date-picker v-model="assetForm.purchaseDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="assetForm.status">
            <el-option label="正常" value="NORMAL" /><el-option label="维修中" value="REPAIRING" />
            <el-option label="报废" value="SCRAPPED" /><el-option label="借出" value="LOANED" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="assetForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="assetVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveAsset">保存</el-button></template>
    </el-dialog>

    <!-- 新增维保记录 -->
    <el-dialog v-model="maintVisible" title="新增维保记录" width="480px">
      <el-form label-width="86px">
        <el-form-item label="维保类型"><el-select v-model="maintForm.type"><el-option label="定期保养" value="MAINTENANCE" /><el-option label="故障维修" value="REPAIR" /><el-option label="校准检定" value="CALIBRATION" /></el-select></el-form-item>
        <el-form-item label="内容"><el-input v-model="maintForm.description" type="textarea" /></el-form-item>
        <el-form-item label="执行人"><el-input v-model="maintForm.technician" /></el-form-item>
        <el-form-item label="费用"><el-input-number v-model="maintForm.cost" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="下次维保"><el-date-picker v-model="maintForm.nextDueAt" type="date" value-format="YYYY-MM-DD" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="maintVisible=false">取消</el-button><el-button type="primary" @click="saveMaintenance">保存</el-button></template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { apiClient } from '../api/client'

interface Equipment { id: string; assetNo: string; name: string; model?: string; departmentName?: string; purchaseDate?: string; status: string; remark?: string }

const activeTab = ref('assets')
const loading = ref(false)
const saving = ref(false)
const fmt = (v?: string) => v ? v.slice(0, 10) : '-'

const assets = ref<Equipment[]>([])
const filteredAssets = ref<Equipment[]>([])
const assetSearch = ref('')
const assetStatusFilter = ref('')
const assetVisible = ref(false)
const assetForm = reactive<Partial<Equipment> & { id?: string }>({})

const maintAsset = ref<Equipment | null>(null)
const maintenanceRecords = ref<Record<string, unknown>[]>([])
const maintVisible = ref(false)
const maintForm = reactive({ type: 'MAINTENANCE', description: '', technician: '', cost: 0, nextDueAt: '' })

const utilizationStats = ref<Record<string, unknown>[]>([])

function assetTagType(s: string) { return s === 'NORMAL' ? 'success' : s === 'REPAIRING' ? 'warning' : s === 'SCRAPPED' ? 'info' : 'primary' }
function assetStatusLabel(s: string) { return { NORMAL: '正常', REPAIRING: '维修中', SCRAPPED: '报废', LOANED: '借出' }[s] || s }

function filterAssets() {
  const q = assetSearch.value.toLowerCase()
  filteredAssets.value = assets.value.filter(a => {
    const matchText = !q || a.name.toLowerCase().includes(q) || a.assetNo.toLowerCase().includes(q)
    const matchStatus = !assetStatusFilter.value || a.status === assetStatusFilter.value
    return matchText && matchStatus
  })
}

function openAssetDialog(row?: Equipment) {
  if (row) Object.assign(assetForm, { ...row })
  else Object.assign(assetForm, { id: '', name: '', assetNo: '', model: '', departmentName: '', purchaseDate: '', status: 'NORMAL', remark: '' })
  assetVisible.value = true
}

async function saveAsset() {
  saving.value = true
  try {
    if (assetForm.id) await apiClient.put(`/admin/equipment/${assetForm.id}`, { ...assetForm })
    else await apiClient.post('/admin/equipment', { ...assetForm })
    assetVisible.value = false; await loadAssets()
  } finally { saving.value = false }
}

function viewMaintenance(row: Equipment) {
  maintAsset.value = row; activeTab.value = 'maintenance'; loadMaintenance()
}

async function loadAssets() {
  const { data } = await apiClient.get('/admin/equipment')
  assets.value = data.items || []; filterAssets()
}

async function loadMaintenance() {
  if (!maintAsset.value) return maintenanceRecords.value = []
  const { data } = await apiClient.get(`/admin/equipment/${maintAsset.value.id}/maintenance`)
  maintenanceRecords.value = data.items || []
}

async function loadUtilization() {
  const { data } = await apiClient.get('/admin/equipment/utilization')
  utilizationStats.value = data.items || []
}

async function saveMaintenance() {
  if (!maintAsset.value) return
  await apiClient.post(`/admin/equipment/${maintAsset.value.id}/maintenance`, { ...maintForm })
  maintVisible.value = false; Object.assign(maintForm, { type: 'MAINTENANCE', description: '', technician: '', cost: 0, nextDueAt: '' })
  await loadMaintenance()
}

async function loadTab() {
  loading.value = true
  try {
    if (activeTab.value === 'assets') await loadAssets()
    else if (activeTab.value === 'maintenance') await loadMaintenance()
    else if (activeTab.value === 'utilization') await loadUtilization()
  } finally { loading.value = false }
}

onMounted(() => { void loadTab() })
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
</style>
