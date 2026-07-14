<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Ward Capacity</p>
        <h1 class="page-title">病区床位</h1>
        <p class="page-subtitle">维护病区、床位状态和每日床位费。</p>
      </div>
      <div class="toolbar-actions">
        <el-button type="primary" @click="openWard">新增病区</el-button>
        <el-button type="primary" plain @click="openBed">新增床位</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h2>病区</h2>
        <el-table v-loading="loading" :data="wards" border stripe>
          <el-table-column label="编码" prop="code" width="120" />
          <el-table-column label="病区" prop="name" />
          <el-table-column label="院区" min-width="140">
            <template #default="{ row }">{{ row.campus?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="楼层" prop="floor" width="100" />
          <el-table-column label="床位数" width="90">
            <template #default="{ row }">{{ row.beds?.length || 0 }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }"><el-button size="small" @click="editWard(row)">编辑</el-button></template>
          </el-table-column>
        </el-table>
      </section>

      <section class="panel">
        <h2>床位</h2>
        <el-table v-loading="loading" :data="beds" border stripe>
          <el-table-column label="病区" min-width="140">
            <template #default="{ row }">{{ row.ward?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="床号" prop="bedNo" width="100" />
          <el-table-column label="状态" prop="status" width="120" />
          <el-table-column label="床位费" prop="dailyRate" width="100" />
          <el-table-column label="启用" width="80">
            <template #default="{ row }">{{ row.isActive === false ? '否' : '是' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90">
            <template #default="{ row }"><el-button size="small" @click="editBed(row)">编辑</el-button></template>
          </el-table-column>
        </el-table>
      </section>
    </div>

    <el-dialog v-model="wardVisible" :title="wardForm.id ? '编辑病区' : '新增病区'" width="520px">
      <el-form label-width="92px">
        <el-form-item label="院区ID"><el-input v-model="wardForm.campusId" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="wardForm.code" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="wardForm.name" /></el-form-item>
        <el-form-item label="楼层"><el-input v-model="wardForm.floor" /></el-form-item>
        <el-form-item label="护士站"><el-input v-model="wardForm.nurseStation" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="wardForm.isActive" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wardVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWard">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bedVisible" :title="bedForm.id ? '编辑床位' : '新增床位'" width="520px">
      <el-form label-width="92px">
        <el-form-item label="病区ID"><el-input v-model="bedForm.wardId" /></el-form-item>
        <el-form-item label="床号"><el-input v-model="bedForm.bedNo" /></el-form-item>
        <el-form-item label="床位费"><el-input-number v-model="bedForm.dailyRate" :min="0" /></el-form-item>
        <el-form-item label="启用"><el-switch v-model="bedForm.isActive" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bedVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBed">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createAdminResource, fetchAdminResource, updateAdminResource } from '../api/hospital'

interface WardRow {
  id: string
  campusId: string
  code: string
  name: string
  floor?: string
  nurseStation?: string
  isActive: boolean
  campus?: { name?: string }
  beds?: unknown[]
}

interface BedRow {
  id: string
  wardId: string
  bedNo: string
  status: string
  dailyRate: number
  isActive: boolean
  ward?: { name?: string }
}

const loading = ref(false)
const wards = ref<WardRow[]>([])
const beds = ref<BedRow[]>([])
const wardVisible = ref(false)
const bedVisible = ref(false)
const wardForm = reactive({ id: '', campusId: '', code: '', name: '', floor: '', nurseStation: '', isActive: true })
const bedForm = reactive({ id: '', wardId: '', bedNo: '', status: 'AVAILABLE', dailyRate: 0, isActive: true })

async function load() {
  loading.value = true
  try {
    const [wardPage, bedPage] = await Promise.all([fetchAdminResource('wards', { pageSize: 200 }), fetchAdminResource('beds', { pageSize: 500 })])
    wards.value = wardPage.items as WardRow[]
    beds.value = bedPage.items as BedRow[]
  } finally {
    loading.value = false
  }
}

function openWard() {
  Object.assign(wardForm, { id: '', campusId: '', code: '', name: '', floor: '', nurseStation: '', isActive: true })
  wardVisible.value = true
}

function editWard(row: WardRow) {
  Object.assign(wardForm, row)
  wardVisible.value = true
}

function openBed() {
  Object.assign(bedForm, { id: '', wardId: '', bedNo: '', status: 'AVAILABLE', dailyRate: 0, isActive: true })
  bedVisible.value = true
}

function editBed(row: BedRow) {
  Object.assign(bedForm, row)
  bedVisible.value = true
}

async function saveWard() {
  const { id, ...data } = wardForm
  if (id) await updateAdminResource('wards', id, data)
  else await createAdminResource('wards', data)
  wardVisible.value = false
  await load()
}

async function saveBed() {
  const data = { wardId: bedForm.wardId, bedNo: bedForm.bedNo, dailyRate: bedForm.dailyRate, isActive: bedForm.isActive }
  if (bedForm.id) await updateAdminResource('beds', bedForm.id, data)
  else await createAdminResource('beds', data)
  bedVisible.value = false
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 16px;
}

h2 {
  margin: 0 0 12px;
}
</style>
