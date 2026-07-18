<template>
  <section class="page-shell">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Exam Packages</p>
        <h1 class="page-title">体检套餐管理</h1>
        <p class="page-subtitle">维护体检套餐项目、价格和适用人群。</p>
      </div>
      <el-button type="primary" @click="openCreate">新建套餐</el-button>
    </div>

    <!-- Search -->
    <section class="panel filter-bar">
      <el-form inline @submit.prevent="load">
        <el-form-item label="名称">
          <el-input v-model="searchName" clearable placeholder="套餐名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- Table -->
    <section class="panel">
      <el-table v-loading="loading" :data="packages" border stripe>
        <el-table-column label="套餐名称" prop="name" min-width="160" />
        <el-table-column label="编码" prop="code" width="130" />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <span style="font-weight:600;color:var(--color-success);">{{ row.price != null ? `¥${row.price}` : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="适用性别" width="100">
          <template #default="{ row }">{{ genderLabel(row.gender) }}</template>
        </el-table-column>
        <el-table-column label="项目数" width="90">
          <template #default="{ row }">{{ row.items?.length ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span class="badge" :class="row.enabled === false ? 'badge-muted' : 'badge-success'">
              {{ row.enabled === false ? '停用' : '启用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" :type="row.enabled === false ? 'success' : 'warning'" @click="togglePackage(row)">
              {{ row.enabled === false ? '启用' : '停用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套餐' : '新建套餐'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="套餐名称" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="form.code" placeholder="套餐编码" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="适用性别">
          <el-select v-model="form.gender" clearable placeholder="不限">
            <el-option label="不限" value="" />
            <el-option label="男" value="MALE" />
            <el-option label="女" value="FEMALE" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="套餐描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { apiClient } from '../api/client'

interface ExamPackage {
  id: string
  name: string
  code?: string
  price?: number
  gender?: string
  description?: string
  enabled?: boolean
  items?: unknown[]
}

const loading = ref(false)
const submitting = ref(false)
const packages = ref<ExamPackage[]>([])
const searchName = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')

const form = reactive({ name: '', code: '', price: undefined as number | undefined, gender: '', description: '' })

function genderLabel(g?: string) {
  const map: Record<string, string> = { MALE: '男', FEMALE: '女' }
  return map[g ?? ''] ?? '不限'
}

function resetForm() {
  form.name = ''
  form.code = ''
  form.price = undefined
  form.gender = ''
  form.description = ''
}

function openCreate() {
  resetForm()
  isEdit.value = false
  editingId.value = ''
  dialogVisible.value = true
}

function openEdit(row: ExamPackage) {
  isEdit.value = true
  editingId.value = row.id
  form.name = row.name ?? ''
  form.code = row.code ?? ''
  form.price = row.price
  form.gender = row.gender ?? ''
  form.description = row.description ?? ''
  dialogVisible.value = true
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (searchName.value.trim()) params.name = searchName.value.trim()
    const { data } = await apiClient.get('/admin/exam/packages', { params })
    packages.value = Array.isArray(data) ? data : (data.data ?? data.items ?? [])
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!form.name.trim()) return
  submitting.value = true
  try {
    const payload = { ...form, price: form.price ?? undefined }
    if (isEdit.value) {
      await apiClient.put(`/admin/exam/packages/${editingId.value}`, payload)
      ElMessage.success('套餐已更新')
    } else {
      await apiClient.post('/admin/exam/packages', payload)
      ElMessage.success('套餐已创建')
    }
    dialogVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

async function togglePackage(row: ExamPackage) {
  await apiClient.put(`/admin/exam/packages/${row.id}`, { enabled: row.enabled === false })
  ElMessage.success(row.enabled === false ? '已启用' : '已停用')
  await load()
}

onMounted(() => { void load() })
</script>

<style scoped>
.filter-bar {
  padding: var(--space-4) var(--space-5);
}
.filter-bar :deep(.el-form) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: center;
}
.filter-bar :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
}
</style>
